"""Benchmark plugin router - all API endpoints.

Predefined diagnostic Q&A flow:
1. Create session (select character)
2. Fetch questions for student's grade band
3. Submit answers one at a time
4. Complete session -> triggers AI evaluation + BKT seeding
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import fastapi
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import async_session_maker as async_session_factory, get_db
from app.models.student import Student
from app.models.user import User
from app.plugins.benchmark.models import BenchmarkQuestion, BenchmarkResult, BenchmarkSession, BenchmarkTurn
from app.plugins.benchmark.schemas import (
    AnswerOut,
    AnswerSubmit,
    BenchmarkInsights,
    BenchmarkResultOut,
    BenchmarkSessionCreate,
    BenchmarkSessionOut,
    PillarStages,
    QuestionOut,
    SessionCompleteRequest,
)
from app.plugins.benchmark.seed_questions import get_grade_band, seed_questions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/benchmark", tags=["benchmark"])


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
        voice_provider="text",
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


# ─── Question endpoints ───


@router.get("/questions", response_model=list[QuestionOut])
async def get_questions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the 20 diagnostic questions for the current student's grade band."""
    student = await _get_student_for_user(user, db)
    grade_band = get_grade_band(student.grade or 6)

    result = await db.execute(
        select(BenchmarkQuestion)
        .where(
            BenchmarkQuestion.grade_band == grade_band,
            BenchmarkQuestion.is_active == True,
        )
        .order_by(BenchmarkQuestion.question_number)
    )
    questions = result.scalars().all()

    if not questions:
        raise HTTPException(
            status_code=404,
            detail=f"No questions found for grade band {grade_band}. Run the seed script first.",
        )

    return [
        QuestionOut(
            id=q.id,
            question_number=q.question_number,
            text=q.text,
            curriculum_anchor=q.curriculum_anchor,
            pillars=q.pillars or [],
        )
        for q in questions
    ]


@router.post("/questions/seed")
async def seed_questions_endpoint(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Seed/update the question bank from code. Admin utility."""
    count = await seed_questions(db)
    return {"message": f"Seeded {count} questions"}


# ─── Answer endpoints ───


@router.post("/answers", response_model=AnswerOut)
async def submit_answer(
    data: AnswerSubmit,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a student's answer to a specific question."""
    student = await _get_student_for_user(user, db)

    sess_result = await db.execute(
        select(BenchmarkSession).where(
            BenchmarkSession.id == data.session_id,
            BenchmarkSession.student_id == student.id,
        )
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is no longer active")

    q_result = await db.execute(
        select(BenchmarkQuestion).where(BenchmarkQuestion.id == data.question_id)
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    existing_result = await db.execute(
        select(BenchmarkTurn).where(
            BenchmarkTurn.session_id == session.id,
            BenchmarkTurn.question_id == data.question_id,
        )
    )
    existing_turn = existing_result.scalar_one_or_none()

    if existing_turn and not data.is_retry:
        raise HTTPException(status_code=409, detail="Answer already submitted for this question")

    if existing_turn and data.is_retry:
        existing_turn.text = data.answer_text
    else:
        turn = BenchmarkTurn(
            session_id=session.id,
            turn_number=data.question_number,
            speaker="student",
            text=data.answer_text,
            question_id=data.question_id,
        )
        db.add(turn)

    session.total_turns = data.question_number

    entry = {
        "question_number": question.question_number,
        "question": question.text,
        "answer": data.answer_text,
        "is_retry": data.is_retry,
    }
    convo = list(session.conversation or [])
    if data.is_retry:
        convo = [e for e in convo if e.get("question_number") != question.question_number]
    convo.append(entry)
    convo.sort(key=lambda e: e.get("question_number", 0))
    session.conversation = convo

    await db.commit()

    return AnswerOut(
        turn_number=data.question_number,
        question_id=question.id,
        question_number=question.question_number,
        question_text=question.text,
        answer_text=data.answer_text,
    )


@router.get("/answers/{session_id}", response_model=list[AnswerOut])
async def get_answers(
    session_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all answers submitted for a session."""
    student = await _get_student_for_user(user, db)

    sess_result = await db.execute(
        select(BenchmarkSession).where(
            BenchmarkSession.id == session_id,
            BenchmarkSession.student_id == student.id,
        )
    )
    if not sess_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(BenchmarkTurn)
        .where(
            BenchmarkTurn.session_id == session_id,
            BenchmarkTurn.speaker == "student",
            BenchmarkTurn.question_id.isnot(None),
        )
        .order_by(BenchmarkTurn.turn_number)
    )
    turns = result.scalars().all()

    return [
        AnswerOut(
            turn_number=t.turn_number,
            question_id=t.question_id,
            question_number=t.question.question_number if t.question else t.turn_number,
            question_text=t.question.text if t.question else "",
            answer_text=t.text,
        )
        for t in turns
    ]


# ─── Session completion ───


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


@router.post("/complete")
async def complete_session(
    data: SessionCompleteRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark session complete and trigger benchmark evaluation."""
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

    if session.status not in ("active",):
        raise HTTPException(status_code=400, detail=f"Session status is '{session.status}', cannot complete")

    answers_result = await db.execute(
        select(BenchmarkTurn).where(
            BenchmarkTurn.session_id == session.id,
            BenchmarkTurn.speaker == "student",
            BenchmarkTurn.question_id.isnot(None),
        )
    )
    answer_count = len(answers_result.scalars().all())
    if answer_count < 1:
        raise HTTPException(status_code=400, detail="No answers submitted yet")

    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)
    await db.commit()

    background_tasks.add_task(_run_benchmark_background, data.session_id)
    return {
        "message": "Session completed, benchmark generating",
        "session_id": str(data.session_id),
        "answers_count": answer_count,
    }


# ─── Benchmark result endpoints ───


def _compute_scores(pillar_stages: dict, capability_stages: dict) -> dict[str, int]:
    ps = pillar_stages or {}
    cs = capability_stages or {}

    def _pct(val) -> int:
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


# ─── Answer feedback endpoint ───


@router.post("/feedback")
async def answer_feedback(
    question_text: str = fastapi.Form(...),
    answer_text: str = fastapi.Form(...),
    question_number: int = fastapi.Form(...),
    character: str = fastapi.Form("harry_potter"),
    is_retry: bool = fastapi.Form(False),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI feedback for a single answer and return feedback text + TTS audio + retry info."""
    from app.plugins.benchmark.services.claude_service import generate_answer_feedback
    from app.plugins.benchmark.services.voice_service import text_to_speech

    student = await _get_student_for_user(user, db)

    try:
        result = await generate_answer_feedback(
            question_text=question_text,
            answer_text=answer_text,
            question_number=question_number,
            character=character,
            student_name=student.name or "Student",
            grade=str(student.grade or "6"),
            is_retry=is_retry,
        )
    except Exception as e:
        logger.error("Feedback generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Feedback generation failed")

    feedback_text = result["feedback"]
    needs_retry = result["needs_retry"]
    hint = result.get("hint")

    try:
        audio_bytes = await text_to_speech(feedback_text, character)
    except Exception as e:
        logger.warning("Feedback TTS failed, returning text only: %s", e)
        import base64
        return JSONResponse(content={
            "feedback_text": feedback_text,
            "audio_base64": None,
            "needs_retry": needs_retry,
            "hint": hint,
        })

    import base64
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

    return JSONResponse(content={
        "feedback_text": feedback_text,
        "audio_base64": audio_b64,
        "needs_retry": needs_retry,
        "hint": hint,
    })


# ─── Voice endpoints ───


@router.post("/voice/tts")
async def tts_endpoint(
    text: str = fastapi.Form(...),
    character: str = fastapi.Form("harry_potter"),
    user: User = Depends(get_current_user),
):
    """Convert question text to speech audio. Provider is set in backend config."""
    from app.plugins.benchmark.services.voice_service import text_to_speech

    try:
        audio_bytes = await text_to_speech(text, character)
        return fastapi.responses.Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=question.wav"},
        )
    except Exception as e:
        logger.error("TTS failed: %s", e)
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@router.post("/voice/stt")
async def stt_endpoint(
    file: fastapi.UploadFile = fastapi.File(...),
    user: User = Depends(get_current_user),
):
    """Convert spoken answer audio to text. Provider is set in backend config."""
    from app.plugins.benchmark.services.voice_service import speech_to_text

    audio_bytes = await file.read()
    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio too short")

    try:
        transcript = await speech_to_text(audio_bytes)
        return {"transcript": transcript}
    except Exception as e:
        logger.error("STT failed: %s", e)
        raise HTTPException(status_code=500, detail=f"STT failed: {str(e)}")


@router.get("/voice/provider")
async def get_voice_provider(user: User = Depends(get_current_user)):
    """Return the currently configured voice provider."""
    from app.plugins.benchmark.services.voice_service import get_default_provider

    return {"provider": get_default_provider()}
