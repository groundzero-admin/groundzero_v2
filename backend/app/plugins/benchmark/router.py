"""Benchmark plugin router - all API endpoints.

Combines session management, conversation, benchmark retrieval, and voice endpoints.
All routes are prefixed with /benchmark.
"""

import asyncio
import base64
import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import async_session_maker as async_session_factory, get_db
from app.models.student import Student
from app.models.user import User
from app.plugins.benchmark.models import BenchmarkResult, BenchmarkSession, BenchmarkTurn
from app.plugins.benchmark.schemas import (
    BenchmarkEndRequest,
    BenchmarkInsights,
    BenchmarkResultOut,
    PillarStages,
    BenchmarkSessionCreate,
    BenchmarkSessionOut,
    BenchmarkTurnRequest,
    BenchmarkTurnResponse,
    RealtimeStartResponse,
    SaveTranscriptRequest,
)
from app.plugins.benchmark.services import claude_service, voice_service
from app.plugins.benchmark.services.claude_service import CHARACTER_PROMPTS, _build_opener, _build_farewell
from app.plugins.benchmark.services.elevenlabs_conversation import (
    get_or_create_agent,
    get_signed_url,
    build_session_prompt,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/benchmark", tags=["benchmark"])

_SENTENCE_END = re.compile(r'[.!?]["\')\]]?\s*$')


async def _get_student_for_user(user: User, db: AsyncSession) -> Student:
    result = await db.execute(select(Student).where(Student.user_id == user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="No student profile linked to this user")
    return student


def _session_to_out(session: BenchmarkSession) -> BenchmarkSessionOut:
    student = session.student
    return BenchmarkSessionOut(
        id=session.id,
        student_id=session.student_id,
        student_name=student.name if student else None,
        student_grade=student.grade if student else None,
        character=session.character,
        voice_provider=session.voice_provider,
        status=session.status,
        started_at=session.started_at,
        total_turns=session.total_turns,
    )


# ─── Session endpoints ───


@router.post("/sessions", response_model=BenchmarkSessionOut, status_code=201)
async def create_session(
    data: BenchmarkSessionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    student = await _get_student_for_user(user, db)
    session = BenchmarkSession(
        student_id=student.id,
        character=data.character,
        voice_provider=data.voice_provider,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return _session_to_out(session)


@router.get("/sessions/{session_id}", response_model=BenchmarkSessionOut)
async def get_session(
    session_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    student = await _get_student_for_user(user, db)
    result = await db.execute(
        select(BenchmarkSession).where(
            BenchmarkSession.id == session_id,
            BenchmarkSession.student_id == student.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _session_to_out(session)


@router.get("/sessions", response_model=list[BenchmarkSessionOut])
async def list_sessions(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    student = await _get_student_for_user(user, db)
    query = (
        select(BenchmarkSession)
        .where(BenchmarkSession.student_id == student.id)
        .order_by(BenchmarkSession.started_at.desc())
    )
    if status:
        query = query.where(BenchmarkSession.status == status)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return [_session_to_out(s) for s in result.scalars().all()]


# ─── Conversation endpoints ───


@router.post("/conversation/turn/stream")
async def conversation_turn_stream(data: BenchmarkTurnRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BenchmarkSession).where(BenchmarkSession.id == data.session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status in ("completed", "benchmark_ready"):
        raise HTTPException(status_code=400, detail="Session already ended")

    session_id = session.id
    student = session.student
    student_name = student.name if student else "Student"
    student_age = (student.grade + 5) if student else 10
    student_grade = str(student.grade) if student else ""
    character_id = session.character

    if data.student_text == "[START]":
        char = CHARACTER_PROMPTS.get(character_id, CHARACTER_PROMPTS["harry_potter"])
        opener_text = _build_opener(char, student_name, student_age, student_grade)
        ai_turn_number = 1
        conversation_history = None
        await db.commit()
    elif data.student_text == "[END]":
        char = CHARACTER_PROMPTS.get(character_id, CHARACTER_PROMPTS["harry_potter"])
        opener_text = _build_farewell(char, student_name)
        ai_turn_number = session.total_turns + 1
        conversation_history = None
        await db.commit()
    else:
        student_turn = BenchmarkTurn(
            session_id=session_id,
            turn_number=data.turn_number,
            speaker="student",
            text=data.student_text,
        )
        db.add(student_turn)
        await db.flush()

        turns_result = await db.execute(
            select(BenchmarkTurn)
            .where(BenchmarkTurn.session_id == session_id)
            .order_by(BenchmarkTurn.turn_number)
        )
        turns = turns_result.scalars().all()
        conversation_history = [
            {"role": "user" if t.speaker == "student" else "assistant", "content": t.text}
            for t in turns
        ]
        opener_text = None
        ai_turn_number = data.turn_number + 1
        await db.commit()

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()

        async def tts_worker(sentence: str, idx: int):
            try:
                audio_bytes = await voice_service.text_to_speech(sentence, character_id)
                audio_b64 = base64.b64encode(audio_bytes).decode()
                await queue.put(("audio", {"audio_base64": audio_b64, "index": idx}))
            except Exception as e:
                logger.warning("TTS failed for sentence %d: %s", idx, e)

        async def produce():
            full_text = ""
            sentence_buffer = ""
            tts_tasks: list[asyncio.Task] = []
            sentence_idx = 0

            if opener_text:
                full_text = opener_text
                await queue.put(("text_delta", {"token": opener_text}))
                tts_tasks.append(asyncio.create_task(tts_worker(opener_text, 0)))
            else:
                async for token in claude_service.stream_ai_response(
                    character=character_id,
                    student_name=student_name,
                    age=student_age,
                    grade=student_grade,
                    conversation_history=conversation_history,
                ):
                    full_text += token
                    sentence_buffer += token
                    await queue.put(("text_delta", {"token": token}))

                    stripped = sentence_buffer.strip()
                    if stripped and _SENTENCE_END.search(stripped):
                        tts_tasks.append(asyncio.create_task(tts_worker(stripped, sentence_idx)))
                        sentence_idx += 1
                        sentence_buffer = ""

                if sentence_buffer.strip():
                    tts_tasks.append(asyncio.create_task(tts_worker(sentence_buffer.strip(), sentence_idx)))

            if tts_tasks:
                await asyncio.gather(*tts_tasks, return_exceptions=True)

            try:
                async with async_session_factory() as db_save:
                    ai_turn = BenchmarkTurn(
                        session_id=session_id,
                        turn_number=ai_turn_number,
                        speaker="ai",
                        text=full_text,
                    )
                    db_save.add(ai_turn)
                    res = await db_save.execute(select(BenchmarkSession).where(BenchmarkSession.id == session_id))
                    sess = res.scalar_one_or_none()
                    if sess:
                        sess.total_turns = ai_turn_number
                    await db_save.commit()
            except Exception as e:
                logger.error("Failed to save AI turn: %s", e)

            await queue.put(("done", {"turn_number": ai_turn_number, "session_id": str(session_id), "ai_text": full_text}))

        task = asyncio.create_task(produce())
        while True:
            event_type, payload = await queue.get()
            yield f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"
            if event_type == "done":
                break
        await task

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/conversation/turn", response_model=BenchmarkTurnResponse)
async def conversation_turn(data: BenchmarkTurnRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BenchmarkSession).where(BenchmarkSession.id == data.session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status in ("completed", "benchmark_ready"):
        raise HTTPException(status_code=400, detail="Session already ended")

    student = session.student
    student_name = student.name if student else "Student"
    student_age = (student.grade + 5) if student else 10
    student_grade = str(student.grade) if student else ""

    if data.student_text == "[START]":
        char = CHARACTER_PROMPTS.get(session.character, CHARACTER_PROMPTS["harry_potter"])
        ai_text = _build_opener(char, student_name, student_age, student_grade)
        ai_turn = BenchmarkTurn(session_id=session.id, turn_number=1, speaker="ai", text=ai_text)
        db.add(ai_turn)
        session.total_turns = 1
    else:
        student_turn = BenchmarkTurn(session_id=session.id, turn_number=data.turn_number, speaker="student", text=data.student_text)
        db.add(student_turn)
        await db.flush()

        turns_result = await db.execute(
            select(BenchmarkTurn).where(BenchmarkTurn.session_id == session.id).order_by(BenchmarkTurn.turn_number)
        )
        turns = turns_result.scalars().all()
        conversation_history = [{"role": "user" if t.speaker == "student" else "assistant", "content": t.text} for t in turns]

        ai_text = await claude_service.get_ai_response(
            character=session.character,
            student_name=student_name,
            age=student_age,
            grade=student_grade,
            conversation_history=conversation_history,
        )
        ai_turn_number = data.turn_number + 1
        ai_turn = BenchmarkTurn(session_id=session.id, turn_number=ai_turn_number, speaker="ai", text=ai_text)
        db.add(ai_turn)
        session.total_turns = ai_turn_number

    await db.commit()
    return BenchmarkTurnResponse(ai_text=ai_text, audio_base64="", turn_number=session.total_turns, session_id=session.id)


async def _run_benchmark_background(session_id: UUID):
    from app.plugins.benchmark.services import benchmark_service

    try:
        async with async_session_factory() as db:
            await benchmark_service.run_benchmark(session_id, db)
        logger.info("Benchmark generated for session %s", session_id)
    except Exception as e:
        logger.error("Benchmark generation FAILED for session %s: %s", session_id, e)
        try:
            async with async_session_factory() as db:
                result = await db.execute(select(BenchmarkSession).where(BenchmarkSession.id == session_id))
                session = result.scalar_one_or_none()
                if session:
                    session.status = "benchmark_failed"
                    await db.commit()
        except Exception:
            pass


@router.post("/conversation/end")
async def end_session(data: BenchmarkEndRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BenchmarkSession).where(BenchmarkSession.id == data.session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)
    await db.commit()

    background_tasks.add_task(_run_benchmark_background, data.session_id)
    return {"message": "Session ended, benchmark generating", "session_id": str(data.session_id)}


# ─── Realtime (ElevenLabs Conversational AI) endpoints ───


@router.post("/conversation/start-realtime", response_model=RealtimeStartResponse)
async def start_realtime_conversation(
    data: BenchmarkSessionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a session and return an ElevenLabs signed URL for real-time voice conversation."""
    student = await _get_student_for_user(user, db)
    session = BenchmarkSession(
        student_id=student.id,
        character=data.character,
        voice_provider="elevenlabs",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    agent_id = await get_or_create_agent(data.character)
    signed_url = await get_signed_url(agent_id)

    student_name = student.name or "Student"
    student_age = (student.grade + 5) if student.grade else 10
    student_grade = str(student.grade) if student.grade else ""

    system_prompt = build_session_prompt(data.character, student_name, student_age, student_grade)
    char = CHARACTER_PROMPTS.get(data.character, CHARACTER_PROMPTS["harry_potter"])
    first_message = _build_opener(char, student_name, student_age, student_grade)

    return RealtimeStartResponse(
        session_id=session.id,
        signed_url=signed_url,
        agent_id=agent_id,
        system_prompt=system_prompt,
        first_message=first_message,
    )


@router.post("/conversation/save-transcript")
async def save_transcript(
    data: SaveTranscriptRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save the transcript from a realtime conversation and trigger benchmark generation."""
    student = await _get_student_for_user(user, db)
    result = await db.execute(
        select(BenchmarkSession).where(
            BenchmarkSession.id == data.session_id,
            BenchmarkSession.student_id == student.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    for i, turn in enumerate(data.transcript):
        db.add(BenchmarkTurn(
            session_id=session.id,
            turn_number=i + 1,
            speaker="student" if turn.speaker == "user" else "ai",
            text=turn.text,
        ))

    session.total_turns = len(data.transcript)
    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)
    await db.commit()

    background_tasks.add_task(_run_benchmark_background, data.session_id)
    return {"message": "Transcript saved, benchmark generating", "session_id": str(data.session_id)}


# ─── Benchmark result endpoints ───


def _compute_scores(pillar_stages: dict, capability_stages: dict) -> dict[str, int]:
    """Derive percentage scores (0-100) from pillar stages (1-5) and capability stages."""
    ps = pillar_stages or {}
    cs = capability_stages or {}

    def _pct(val: int | None) -> int:
        if val is None:
            return 0
        return min(100, max(0, int(val) * 20))

    def _avg_caps(*keys: str) -> int:
        vals = [int(cs[k]) for k in keys if cs.get(k) is not None]
        if not vals:
            return 0
        return min(100, max(0, round(sum(vals) / len(vals) * 20)))

    return {
        "communication": _pct(ps.get("communication")),
        "creativity": _pct(ps.get("creativity")),
        "mathematical_thinking": _pct(ps.get("math_logic")),
        "critical_thinking": _avg_caps("B", "D", "K") or _pct(ps.get("communication")),
        "curiosity": _pct(cs.get("G")) or _pct(ps.get("creativity")),
        "leadership": _pct(cs.get("L")) or _pct(ps.get("ai_systems")),
        "emotional_intelligence": _pct(cs.get("C")) or _pct(ps.get("communication")),
        "knowledge_depth": _pct(ps.get("ai_systems")),
    }


def _result_to_out(b: BenchmarkResult) -> BenchmarkResultOut:
    session = b.session
    student = session.student if session else None
    ps = b.pillar_stages or {}
    return BenchmarkResultOut(
        id=b.id,
        session_id=b.session_id,
        generated_at=b.generated_at,
        pillar_stages=PillarStages(
            communication=ps.get("communication", 1),
            creativity=ps.get("creativity", 1),
            ai_systems=ps.get("ai_systems", 1),
            math_logic=ps.get("math_logic", 1),
        ),
        capability_stages=b.capability_stages or {},
        capability_evidence=b.capability_evidence or {},
        insights=BenchmarkInsights(
            strongest_areas=b.strongest_areas or [],
            growth_areas=b.growth_areas or [],
            dominant_interests=b.dominant_interests or [],
            learning_style=b.learning_style,
            engagement_level=b.engagement_level,
            notable_observations=b.notable_observations or [],
        ),
        scores=_compute_scores(b.pillar_stages, b.capability_stages),
        summary=b.summary,
        conversation_snapshot=b.conversation_snapshot,
        student_name=student.name if student else None,
        student_grade=student.grade if student else None,
        character=session.character if session else None,
        total_turns=session.total_turns if session else None,
        session_started_at=session.started_at if session else None,
        bkt_seeded=b.bkt_seeded,
    )


@router.get("/results/{session_id}", response_model=BenchmarkResultOut)
async def get_benchmark_result(
    session_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    student = await _get_student_for_user(user, db)
    sess_result = await db.execute(
        select(BenchmarkSession).where(
            BenchmarkSession.id == session_id,
            BenchmarkSession.student_id == student.id,
        )
    )
    sess = sess_result.scalar_one_or_none()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(BenchmarkResult)
        .where(BenchmarkResult.session_id == session_id)
        .options(
            selectinload(BenchmarkResult.session).selectinload(BenchmarkSession.student)
        )
    )
    benchmark = result.scalar_one_or_none()
    if not benchmark:
        if sess.status == "benchmark_failed":
            return JSONResponse(status_code=500, content={"status": "failed", "detail": "Benchmark generation failed"})
        return JSONResponse(status_code=202, content={"status": "pending"})
    return _result_to_out(benchmark)


@router.get("/results", response_model=list[BenchmarkResultOut])
async def list_benchmark_results(
    limit: int = 20,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    student = await _get_student_for_user(user, db)
    query = (
        select(BenchmarkResult)
        .join(BenchmarkSession, BenchmarkResult.session_id == BenchmarkSession.id)
        .options(
            selectinload(BenchmarkResult.session).selectinload(BenchmarkSession.student)
        )
        .where(BenchmarkSession.student_id == student.id)
        .order_by(BenchmarkResult.generated_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return [_result_to_out(b) for b in result.scalars().all()]


# ─── Voice endpoints ───


class TTSRequest(BaseModel):
    text: str
    character: str
    provider: str = "sarvam"


@router.post("/voice/tts")
async def text_to_speech(data: TTSRequest):
    try:
        audio_bytes = await voice_service.text_to_speech(data.text, data.character, data.provider)
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
        return {"audio_base64": audio_base64, "provider": data.provider}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/voice/ws/stt")
async def websocket_stt(websocket: WebSocket):
    await websocket.accept()
    audio_chunks: list[bytes] = []
    interim_task: asyncio.Task | None = None

    async def _send_interim():
        last_count = 0
        try:
            while True:
                await asyncio.sleep(2.0)
                current_count = len(audio_chunks)
                if current_count == 0 or current_count == last_count:
                    continue
                last_count = current_count
                audio_bytes = b"".join(audio_chunks)
                try:
                    transcript = await voice_service.sarvam_stt(audio_bytes, "en-IN")
                    await websocket.send_json({"transcript": transcript, "final": False})
                except Exception as e:
                    logger.warning("Interim STT error: %s", e)
        except asyncio.CancelledError:
            pass

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.receive":
                if "bytes" in message and message["bytes"]:
                    audio_chunks.append(message["bytes"])
                    if interim_task is None:
                        interim_task = asyncio.create_task(_send_interim())
                elif "text" in message and message["text"]:
                    try:
                        data = json.loads(message["text"])
                    except json.JSONDecodeError:
                        continue

                    if data.get("action") == "stop":
                        if interim_task:
                            interim_task.cancel()
                            interim_task = None
                        if not audio_chunks:
                            await websocket.send_json({"transcript": "", "final": True, "error": "No audio received"})
                            continue
                        audio_bytes = b"".join(audio_chunks)
                        audio_chunks = []
                        language = data.get("language_code", "en-IN")
                        try:
                            transcript = await voice_service.sarvam_stt(audio_bytes, language)
                            await websocket.send_json({"transcript": transcript, "final": True})
                        except Exception as e:
                            logger.error("Final STT error: %s", e)
                            await websocket.send_json({"transcript": "", "final": True, "error": str(e)})

                    elif data.get("action") == "cancel":
                        if interim_task:
                            interim_task.cancel()
                            interim_task = None
                        audio_chunks = []
                        await websocket.send_json({"transcript": "", "cancelled": True})

            elif message["type"] == "websocket.disconnect":
                break
    except WebSocketDisconnect:
        pass
    finally:
        if interim_task:
            interim_task.cancel()


@router.websocket("/voice/ws/realtime")
async def websocket_realtime_sarvam(websocket: WebSocket):
    """Real-time conversational voice via Sarvam streaming STT + Claude + Sarvam streaming TTS."""
    await websocket.accept()

    from app.plugins.benchmark.services.sarvam_realtime import SarvamConversationPipeline

    pipeline: SarvamConversationPipeline | None = None
    stt_listener_task: asyncio.Task | None = None
    session_id: str | None = None

    try:
        # Wait for init message with session config
        init_raw = await websocket.receive_text()
        init_data = json.loads(init_raw)
        character = init_data["character"]
        student_name = init_data.get("student_name", "Student")
        student_age = init_data.get("student_age", 10)
        student_grade = init_data.get("student_grade", "")
        session_id = init_data.get("session_id")

        async def on_user_transcript(text: str):
            await websocket.send_json({"type": "user_transcript", "text": text})

        async def on_agent_text(text: str, delta: bool = False):
            await websocket.send_json({
                "type": "agent_text_delta" if delta else "agent_text",
                "text": text,
            })

        async def on_agent_audio(audio_b64: str):
            await websocket.send_json({"type": "agent_audio", "audio": audio_b64})

        async def on_turn_complete(turn_count: int):
            await websocket.send_json({"type": "turn_complete", "turn_count": turn_count})

        pipeline = SarvamConversationPipeline(
            character=character,
            student_name=student_name,
            student_age=student_age,
            student_grade=student_grade,
            on_user_transcript=on_user_transcript,
            on_agent_text=on_agent_text,
            on_agent_audio=on_agent_audio,
            on_turn_complete=on_turn_complete,
        )

        # Send opener text immediately, TTS runs in background
        await pipeline.send_opener_text()
        await websocket.send_json({"type": "ready"})

        # Start TTS for opener in background while we set up STT
        opener_tts_task = asyncio.create_task(pipeline.synthesize_opener())

        # Connect streaming STT
        await pipeline.connect_stt()
        stt_listener_task = asyncio.create_task(pipeline.listen_stt())

        # Wait for opener TTS to finish before entering audio loop
        await opener_tts_task

        # Forward audio from frontend to Sarvam STT
        audio_frame_count = 0
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.receive":
                if "bytes" in message and message["bytes"]:
                    audio_frame_count += 1
                    if audio_frame_count == 1:
                        logger.info("First audio frame received (%d bytes)", len(message["bytes"]))
                    elif audio_frame_count % 100 == 0:
                        logger.info("Audio frames received: %d", audio_frame_count)
                    await pipeline.feed_audio(message["bytes"])
                elif "text" in message and message["text"]:
                    data = json.loads(message["text"])
                    if data.get("action") == "end":
                        await pipeline.generate_farewell()
                        transcript = pipeline.get_transcript()
                        await websocket.send_json({
                            "type": "ended",
                            "transcript": transcript,
                            "turn_count": pipeline.turn_count,
                        })
                        break
            elif message["type"] == "websocket.disconnect":
                break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("Realtime Sarvam WS error: %s", e)
        try:
            await websocket.send_json({"type": "error", "detail": str(e)})
        except Exception:
            pass
    finally:
        if stt_listener_task:
            stt_listener_task.cancel()
        if pipeline:
            await pipeline.stop()


@router.get("/voice/providers")
async def get_providers():
    default = os.getenv("DEFAULT_VOICE_PROVIDER", "sarvam_realtime")
    return {
        "providers": [
            {"id": "sarvam_realtime", "name": "Sarvam Conversational AI", "mode": "realtime"},
            {"id": "sarvam", "name": "Sarvam Turn-based", "mode": "turn_based"},
            {"id": "elevenlabs_realtime", "name": "ElevenLabs Conversational AI", "mode": "realtime"},
            {"id": "elevenlabs", "name": "ElevenLabs Turn-based", "mode": "turn_based"},
        ],
        "default": default,
    }
