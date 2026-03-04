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

from app.database import async_session_maker as async_session_factory, get_db
from app.plugins.benchmark.models import BenchmarkResult, BenchmarkSession, BenchmarkTurn
from app.plugins.benchmark.schemas import (
    BenchmarkEndRequest,
    BenchmarkInsights,
    BenchmarkResultOut,
    BenchmarkScores,
    BenchmarkSessionCreate,
    BenchmarkSessionOut,
    BenchmarkTurnRequest,
    BenchmarkTurnResponse,
)
from app.plugins.benchmark.services import claude_service, voice_service
from app.plugins.benchmark.services.claude_service import CHARACTER_PROMPTS, _build_opener

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/benchmark", tags=["benchmark"])

_SENTENCE_END = re.compile(r'[.!?]["\')\]]?\s*$')


# ─── Session endpoints ───


@router.post("/sessions", response_model=BenchmarkSessionOut, status_code=201)
async def create_session(data: BenchmarkSessionCreate, db: AsyncSession = Depends(get_db)):
    session = BenchmarkSession(
        student_id=UUID("00000000-0000-0000-0000-000000000000"),
        student_name=data.student_name,
        student_age=data.student_age,
        student_grade=data.student_grade,
        character=data.character,
        voice_provider=data.voice_provider,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=BenchmarkSessionOut)
async def get_session(session_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BenchmarkSession).where(BenchmarkSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/sessions", response_model=list[BenchmarkSessionOut])
async def list_sessions(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(BenchmarkSession).order_by(BenchmarkSession.started_at.desc())
    if status:
        query = query.where(BenchmarkSession.status == status)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


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
    student_name = session.student_name
    student_age = session.student_age or 10
    student_grade = session.student_grade or ""
    character_id = session.character

    if data.student_text == "[START]":
        char = CHARACTER_PROMPTS.get(character_id, CHARACTER_PROMPTS["harry_potter"])
        opener_text = _build_opener(char, student_name, student_age, student_grade)
        ai_turn_number = 1
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

    if data.student_text == "[START]":
        char = CHARACTER_PROMPTS.get(session.character, CHARACTER_PROMPTS["harry_potter"])
        ai_text = _build_opener(char, session.student_name, session.student_age or 10, session.student_grade or "")
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
            student_name=session.student_name,
            age=session.student_age or 10,
            grade=session.student_grade or "",
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


# ─── Benchmark result endpoints ───


def _result_to_out(b: BenchmarkResult) -> BenchmarkResultOut:
    session = b.session
    return BenchmarkResultOut(
        id=b.id,
        session_id=b.session_id,
        generated_at=b.generated_at,
        scores=BenchmarkScores(
            curiosity=b.score_curiosity or 0,
            critical_thinking=b.score_critical_thinking or 0,
            mathematical_thinking=b.score_mathematical_thinking or 0,
            knowledge_depth=b.score_knowledge_depth or 0,
            communication=b.score_communication or 0,
            creativity=b.score_creativity or 0,
            emotional_intelligence=b.score_emotional_intelligence or 0,
            leadership=b.score_leadership or 0,
        ),
        insights=BenchmarkInsights(
            strongest_areas=b.strongest_areas or [],
            growth_areas=b.growth_areas or [],
            dominant_interests=b.dominant_interests or [],
            learning_style=b.learning_style,
            engagement_level=b.engagement_level,
            notable_observations=b.notable_observations or [],
        ),
        curriculum_signals=b.curriculum_signals,
        summary=b.summary,
        conversation_snapshot=b.conversation_snapshot,
        student_name=session.student_name if session else None,
        student_age=session.student_age if session else None,
        student_grade=session.student_grade if session else None,
        character=session.character if session else None,
        total_turns=session.total_turns if session else None,
        session_started_at=session.started_at if session else None,
    )


@router.get("/results/{session_id}", response_model=BenchmarkResultOut)
async def get_benchmark_result(session_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BenchmarkResult).where(BenchmarkResult.session_id == session_id))
    benchmark = result.scalar_one_or_none()
    if not benchmark:
        sess_result = await db.execute(select(BenchmarkSession).where(BenchmarkSession.id == session_id))
        session = sess_result.scalar_one_or_none()
        if session and session.status == "benchmark_failed":
            return JSONResponse(status_code=500, content={"status": "failed", "detail": "Benchmark generation failed"})
        return JSONResponse(status_code=202, content={"status": "pending"})
    return _result_to_out(benchmark)


@router.get("/results", response_model=list[BenchmarkResultOut])
async def list_benchmark_results(
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(BenchmarkResult).order_by(BenchmarkResult.generated_at.desc())
    if search:
        query = query.join(BenchmarkSession, BenchmarkResult.session_id == BenchmarkSession.id).where(
            BenchmarkSession.student_name.ilike(f"%{search}%")
        )
    query = query.offset(offset).limit(limit)
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


@router.get("/voice/providers")
async def get_providers():
    default = os.getenv("DEFAULT_VOICE_PROVIDER", "sarvam")
    return {
        "providers": [
            {"id": "sarvam", "name": "Sarvam AI (Bulbul v3)", "tier": "test"},
            {"id": "elevenlabs", "name": "ElevenLabs", "tier": "production"},
        ],
        "default": default,
    }
