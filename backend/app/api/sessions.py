"""
Sessions & facilitator notes — optional delivery layer.
Nothing in the core engine depends on these routes.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.curriculum import Activity
from app.models.evidence import EvidenceEvent
from app.models.session import Cohort, FacilitatorNote, Session, SessionActivity
from app.models.user import User
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

    # Mark any currently active SessionActivity as completed
    sa_result = await db.execute(
        select(SessionActivity).where(
            SessionActivity.session_id == session_id,
            SessionActivity.status == "active",
        )
    )
    for sa in sa_result.scalars().all():
        sa.status = "completed"

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

    # Mark all remaining active/pending SessionActivities as completed
    sa_result = await db.execute(
        select(SessionActivity).where(
            SessionActivity.session_id == session_id,
            SessionActivity.status.in_(["pending", "active"]),
        )
    )
    for sa in sa_result.scalars().all():
        sa.status = "completed"

    # Auto-advance cohort's current_session_number
    if session.cohort_id:
        cohort_result = await db.execute(select(Cohort).where(Cohort.id == session.cohort_id))
        cohort = cohort_result.scalar_one_or_none()
        if cohort and cohort.current_session_number < MAX_SESSION_NUMBER:
            cohort.current_session_number += 1

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
