"""
Sessions & facilitator notes — optional delivery layer.
Nothing in the core engine depends on these routes.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.activity_question import ActivityQuestion
from app.models.curriculum import Activity
from app.models.evidence import EvidenceEvent
from app.models.question_template import QuestionTemplate
from app.models.session import Cohort, FacilitatorNote, LiveRoom, Session, SessionActivity
from app.models.student import Student
from app.models.user import User
from app.schemas.curriculum import QuestionOut
from app.schemas.session import (
    FacilitatorNoteCreate,
    FacilitatorNoteOut,
    LaunchActivityRequest,
    SessionActivityOut,
    SessionCreate,
    SessionOut,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])

MAX_SESSION_NUMBER = 14


class SessionActivityQuestionFlowOut(BaseModel):
    questions: list["SessionActivityQuestionOut"]
    attempted_question_ids: list[str]
    attempted_results: dict[str, bool] = {}
    next_question_index: int


class SessionActivityQuestionOut(BaseModel):
    id: uuid.UUID
    module_id: str
    competency_id: str
    competency_ids: list[str]
    text: str
    type: str
    options: list[dict] | None = None
    correct_answer: str | None = None
    difficulty: float
    grade_band: str
    topic_id: str | None = None
    explanation: str | None = None
    template_slug: str | None = None
    template_name: str | None = None
    data: dict = {}


# ── Sessions ──


@router.get(
    "",
    response_model=list[SessionOut],
    summary="List Sessions",
    description="List all sessions, optionally filtered by cohort and active/ended status. Used to find live sessions for a student's cohort.",
)
async def list_sessions(
    cohort_id: uuid.UUID | None = None,
    active: bool | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("student", "teacher", "admin")),
):
    stmt = select(Session).order_by(Session.started_at.desc().nulls_last())
    if cohort_id is not None:
        stmt = stmt.where(Session.cohort_id == cohort_id)
    if active is True:
        stmt = stmt.where(Session.ended_at.is_(None), Session.started_at.is_not(None))
    elif active is False:
        stmt = stmt.where(Session.ended_at.is_not(None))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "",
    response_model=SessionOut,
    status_code=201,
    summary="Start Next Session",
    description="Activate the next un-started session in a cohort. Sets started_at and auto-assigns activities from the lesson plan.",
)
async def create_session(data: SessionCreate, db: AsyncSession = Depends(get_db), _user: User = Depends(require_role("teacher", "admin"))):
    if not data.cohort_id:
        raise HTTPException(status_code=400, detail="cohort_id is required")

    result = await db.execute(select(Cohort).where(Cohort.id == data.cohort_id))
    cohort = result.scalar_one_or_none()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    # Check no session is already active (started but not ended)
    active_result = await db.execute(
        select(Session).where(
            Session.cohort_id == data.cohort_id,
            Session.started_at.is_not(None),
            Session.ended_at.is_(None),
        )
    )
    existing_active = active_result.scalar_one_or_none()
    if existing_active:
        return existing_active  # return it instead of creating a duplicate

    # Find the session to start: specific one if session_id provided, otherwise next un-started
    if data.session_id:
        next_result = await db.execute(
            select(Session).where(
                Session.id == data.session_id,
                Session.cohort_id == data.cohort_id,
                Session.started_at.is_(None),
            )
        )
    else:
        next_result = await db.execute(
            select(Session).where(
                Session.cohort_id == data.cohort_id,
                Session.started_at.is_(None),
            ).order_by(Session.order.asc().nulls_last(), Session.session_number.asc()).limit(1)
        )
    session = next_result.scalar_one_or_none()

    if not session:
        # No template sessions — fall back to creating a new one
        session = Session(
            cohort_id=data.cohort_id,
            session_number=cohort.current_session_number,
            teacher_id=data.teacher_id,
        )
        db.add(session)
        await db.flush()

    # Start the session
    session.started_at = datetime.utcnow()
    if data.teacher_id:
        session.teacher_id = data.teacher_id

    # Auto-assign activities from template (if session has a template and no activities yet)
    existing_activities = await db.execute(
        select(SessionActivity).where(SessionActivity.session_id == session.id).limit(1)
    )
    if not existing_activities.scalar_one_or_none() and session.template_id:
        from app.models.template_cohort import Template
        template = await db.get(Template, session.template_id)
        if template and template.activities:
            for idx, activity_id in enumerate(template.activities, start=1):
                sa = SessionActivity(
                    session_id=session.id,
                    activity_id=activity_id,
                    order=idx,
                )
                db.add(sa)

    await db.commit()
    await db.refresh(session)
    return session


@router.get(
    "/{session_id}",
    response_model=SessionOut,
    summary="Get Session Details",
    description="Retrieve a single session by its UUID, including cohort, activity, facilitator, and start/end times.",
)
async def get_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(require_role("teacher", "admin"))):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get(
    "/{session_id}/activities",
    response_model=list[SessionActivityOut],
    summary="Get Session Lesson Plan",
    description="Returns all activities assigned to a session with their statuses and order. Joined with Activity for name/type.",
)
async def get_session_activities(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(require_role("student", "teacher", "admin"))):
    result = await db.execute(
        select(SessionActivity, Activity.name, Activity.type, Activity.mode, Activity.duration_minutes)
        .outerjoin(Activity, SessionActivity.activity_id == Activity.id)
        .where(SessionActivity.session_id == session_id)
        .order_by(SessionActivity.order)
    )
    rows = result.all()

    # Auto-complete expired timed activities
    now = datetime.utcnow()
    dirty = False
    for sa, name, atype, mode, duration in rows:
        if (
            sa.status == "active"
            and mode == "timed_mcq"
            and duration
            and sa.launched_at
            and (now - sa.launched_at).total_seconds() > duration * 60
        ):
            sa.status = "completed"
            # Also clear session's current_activity_id
            sess_result = await db.execute(select(Session).where(Session.id == session_id))
            session = sess_result.scalar_one_or_none()
            if session and session.current_activity_id == sa.activity_id:
                session.current_activity_id = None
            dirty = True

    if dirty:
        await db.commit()

    return [
        SessionActivityOut(
            id=sa.id,
            session_id=sa.session_id,
            activity_id=sa.activity_id,
            order=sa.order,
            status=sa.status,
            launched_at=sa.launched_at,
            activity_name=name,
            activity_type=atype,
            duration_minutes=duration,
        )
        for sa, name, atype, mode, duration in rows
    ]


@router.get(
    "/{session_id}/activities/{activity_id}/questions",
    response_model=list[SessionActivityQuestionOut],
    summary="Get Questions for Session Activity",
    description="Returns ordered questions linked to an activity within a session. Normalized to QuestionOut for live student delivery.",
)
async def get_session_activity_questions(
    session_id: uuid.UUID,
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student", "teacher", "admin")),
):
    # Ensure activity is part of this session.
    sa_result = await db.execute(
        select(SessionActivity).where(
            SessionActivity.session_id == session_id,
            SessionActivity.activity_id == activity_id,
        )
    )
    if not sa_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Activity not found in this session")

    activity_result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = activity_result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    qids_raw = activity.question_ids or []
    qids: list[uuid.UUID] = []
    for qid in qids_raw:
        try:
            qids.append(uuid.UUID(str(qid)))
        except (ValueError, TypeError):
            continue

    if not qids:
        return []

    aq_result = await db.execute(
        select(ActivityQuestion, QuestionTemplate.slug, QuestionTemplate.name)
        .outerjoin(QuestionTemplate, ActivityQuestion.template_id == QuestionTemplate.id)
        .where(ActivityQuestion.id.in_(qids))
    )
    aq_rows = {row[0].id: row for row in aq_result.all()}

    out: list[SessionActivityQuestionOut] = []
    for qid in qids:
        row = aq_rows.get(qid)
        if not row:
            continue
        aq, template_slug, template_name = row

        data = aq.data or {}
        raw_options = data.get("options") if isinstance(data, dict) else None
        norm_options: list[dict] = []
        if isinstance(raw_options, list):
            for idx, opt in enumerate(raw_options):
                if not isinstance(opt, dict):
                    continue
                label = opt.get("label")
                if not isinstance(label, str) or not label.strip():
                    label = chr(65 + idx)  # A, B, C...
                text = str(opt.get("text") or "")
                is_correct = bool(opt.get("is_correct", False))
                norm_options.append({
                    "label": label,
                    "text": text,
                    "is_correct": is_correct,
                })

        correct_label = None
        for opt in norm_options:
            if opt.get("is_correct"):
                correct_label = str(opt.get("label"))
                break

        inferred_type = "mcq" if str(template_slug or "").startswith("mcq_") else str(data.get("type") or "widget")
        if not isinstance(data, dict):
            data = {}

        out.append(
            SessionActivityQuestionOut(
                id=aq.id,
                module_id=activity.module_id,
                competency_id=aq.competency_id,
                competency_ids=list(aq.competency_ids or [aq.competency_id]),
                text=str(data.get("question") or data.get("prompt") or aq.title),
                type=inferred_type,
                options=norm_options or None,
                correct_answer=correct_label,
                difficulty=float(aq.difficulty),
                grade_band=aq.grade_band or "",
                topic_id=None,
                explanation=str(data.get("explanation")) if data.get("explanation") else None,
                template_slug=str(template_slug) if template_slug else None,
                template_name=str(template_name) if template_name else None,
                data=data,
            )
        )

    return out


@router.get(
    "/{session_id}/activities/{activity_id}/question-flow",
    response_model=SessionActivityQuestionFlowOut,
    summary="Get student question flow for a session activity",
    description="Returns ordered activity questions plus attempted question IDs and next unanswered question index for this student in the session.",
)
async def get_session_activity_question_flow(
    session_id: uuid.UUID,
    activity_id: str,
    student_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student", "teacher", "admin")),
):
    effective_student_id = student_id
    if user.role == "student":
        s_res = await db.execute(select(Student.id).where(Student.user_id == user.id))
        current_student_id = s_res.scalar_one_or_none()
        if not current_student_id:
            raise HTTPException(status_code=404, detail="Student record not found")
        effective_student_id = current_student_id

    # Reuse base question endpoint logic
    questions = await get_session_activity_questions(
        session_id=session_id,
        activity_id=activity_id,
        db=db,
        user=user,
    )
    if not questions:
        return SessionActivityQuestionFlowOut(
            questions=[],
            attempted_question_ids=[],
            attempted_results={},
            next_question_index=0,
        )

    attempted_question_ids: list[str] = []
    attempted_results: dict[str, bool] = {}
    if effective_student_id is not None:
        qid_set = {str(q.id) for q in questions}
        ev_result = await db.execute(
            select(EvidenceEvent.meta["questionId"].astext, EvidenceEvent.outcome)
            .where(
                EvidenceEvent.student_id == effective_student_id,
                EvidenceEvent.session_id == session_id,
                EvidenceEvent.meta["questionId"].astext.is_not(None),
            )
            .order_by(EvidenceEvent.created_at.desc())
        )
        seen: set[str] = set()
        for qid, outcome in ev_result.all():
            if qid and qid in qid_set and qid not in seen:
                seen.add(qid)
                attempted_question_ids.append(qid)
                attempted_results[qid] = bool((outcome or 0.0) >= 0.5)

    attempted_set = set(attempted_question_ids)
    next_idx = 0
    for idx, q in enumerate(questions):
        if str(q.id) not in attempted_set:
            next_idx = idx
            break
    else:
        next_idx = len(questions)

    return SessionActivityQuestionFlowOut(
        questions=questions,
        attempted_question_ids=attempted_question_ids,
        attempted_results=attempted_results,
        next_question_index=next_idx,
    )


@router.put(
    "/{session_id}/launch-activity",
    response_model=SessionOut,
    summary="Launch Activity in Session",
    description="Sets the given activity as live. Marks previous active activity as completed, target as active, and updates session.current_activity_id.",
)
async def launch_activity(
    session_id: uuid.UUID,
    body: LaunchActivityRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("teacher", "admin")),
):
    # Verify session exists and is active
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.ended_at:
        raise HTTPException(status_code=400, detail="Session already ended")

    # Pause any currently active SessionActivity
    sa_result = await db.execute(
        select(SessionActivity).where(
            SessionActivity.session_id == session_id,
            SessionActivity.status == "active",
        )
    )
    for sa in sa_result.scalars().all():
        sa.status = "paused"

    # Mark target activity as active
    target_result = await db.execute(
        select(SessionActivity).where(
            SessionActivity.session_id == session_id,
            SessionActivity.activity_id == body.activity_id,
        )
    )
    target_sa = target_result.scalar_one_or_none()
    if not target_sa:
        raise HTTPException(status_code=404, detail="Activity not in this session's lesson plan")
    target_sa.status = "active"
    target_sa.launched_at = datetime.utcnow()

    # Update session's current_activity_id
    session.current_activity_id = body.activity_id

    await db.commit()
    await db.refresh(session)
    return session


@router.post(
    "/{session_id}/end",
    response_model=SessionOut,
    summary="End Live Session",
    description="Mark an active session as ended. Auto-advances the cohort's current_session_number (capped at 14). Marks remaining pending activities as completed.",
)
async def end_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(require_role("teacher", "admin"))):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.ended_at:
        raise HTTPException(status_code=400, detail="Session already ended")

    session.ended_at = datetime.utcnow()
    session.current_activity_id = None

    # Pause any currently active activities (don't complete them)
    sa_result = await db.execute(
        select(SessionActivity).where(
            SessionActivity.session_id == session_id,
            SessionActivity.status == "active",
        )
    )
    for sa in sa_result.scalars().all():
        sa.status = "paused"

    await db.commit()
    await db.refresh(session)
    return session


@router.post(
    "/{session_id}/restart",
    response_model=SessionOut,
    summary="Restart an ended session",
    description="Clears ended_at so the session can be used again. Does not change activity statuses.",
)
async def restart_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(require_role("teacher", "admin"))):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.ended_at:
        raise HTTPException(status_code=400, detail="Session is not ended")

    session.ended_at = None
    session.started_at = datetime.utcnow()

    # Re-enable HMS room so room codes work again
    room_result = await db.execute(select(LiveRoom).where(LiveRoom.session_id == session_id))
    room = room_result.scalar_one_or_none()
    if room:
        room.is_live = True

    await db.commit()
    await db.refresh(session)
    return session


@router.post(
    "/{session_id}/mark-done",
    response_model=SessionOut,
    summary="Mark session as completed/done",
    description="Finalizes the session: marks all activities as completed and advances the cohort.",
)
async def mark_session_done(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(require_role("teacher", "admin"))):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Ensure it is ended first
    if not session.ended_at:
        session.ended_at = datetime.utcnow()

    session.current_activity_id = None

    # Mark ALL activities as completed
    sa_result = await db.execute(
        select(SessionActivity).where(
            SessionActivity.session_id == session_id,
            SessionActivity.status.in_(["pending", "active", "paused"]),
        )
    )
    for sa in sa_result.scalars().all():
        sa.status = "completed"

    # Auto-advance cohort
    if session.cohort_id:
        cohort_result = await db.execute(select(Cohort).where(Cohort.id == session.cohort_id))
        cohort = cohort_result.scalar_one_or_none()
        if cohort and cohort.current_session_number < MAX_SESSION_NUMBER:
            cohort.current_session_number += 1

    await db.commit()
    await db.refresh(session)
    return session


@router.put(
    "/{session_id}/pause-activity",
    response_model=SessionOut,
    summary="Pause the currently active activity",
    description="Pauses the active activity without launching a new one.",
)
async def pause_activity(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(require_role("teacher", "admin"))):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Pause the currently active activity
    sa_result = await db.execute(
        select(SessionActivity).where(
            SessionActivity.session_id == session_id,
            SessionActivity.status == "active",
        )
    )
    for sa in sa_result.scalars().all():
        sa.status = "paused"

    session.current_activity_id = None

    await db.commit()
    await db.refresh(session)
    return session


# ── Facilitator Notes ──


@router.post(
    "/{session_id}/facilitator-notes",
    response_model=FacilitatorNoteOut,
    status_code=201,
    summary="Record Facilitator Observation",
    description="Submit a facilitator's observation note for a student during a session. Includes engagement level (1-3), notable moments, and optional intervention flag. Optionally creates a BKT evidence event if a competency_id is provided.",
)
async def submit_facilitator_note(
    session_id: uuid.UUID,
    data: FacilitatorNoteCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("teacher", "admin")),
):
    # Verify session exists
    result = await db.execute(select(Session).where(Session.id == session_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    # Create facilitator note
    note = FacilitatorNote(
        session_id=session_id,
        student_id=data.student_id,
        engagement=data.engagement,
        notable_moment=data.notable_moment,
        intervention_flag=data.intervention_flag,
    )
    db.add(note)

    # Optionally create an evidence event (source="facilitator", weight=0.5)
    if data.competency_id:
        # Map engagement to outcome: 1=0.3, 2=0.5, 3=0.8
        outcome_map = {1: 0.3, 2: 0.5, 3: 0.8}
        event = EvidenceEvent(
            student_id=data.student_id,
            competency_id=data.competency_id,
            source="facilitator",
            session_id=session_id,
            outcome=outcome_map.get(data.engagement, 0.5),
            weight=0.5,
            meta={"engagement": data.engagement, "notable_moment": data.notable_moment},
        )
        db.add(event)

    await db.commit()
    await db.refresh(note)
    return note


@router.get(
    "/{session_id}/facilitator-notes",
    response_model=list[FacilitatorNoteOut],
    summary="Get Session Observations",
    description="Retrieve all facilitator observation notes for a session, ordered by most recent first.",
)
async def get_facilitator_notes(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(require_role("teacher", "admin"))):
    result = await db.execute(
        select(FacilitatorNote)
        .where(FacilitatorNote.session_id == session_id)
        .order_by(FacilitatorNote.created_at.desc())
    )
    return result.scalars().all()
