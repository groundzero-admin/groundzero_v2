"""
Sessions & facilitator notes — optional delivery layer.
Nothing in the core engine depends on these routes.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.curriculum import Activity
from app.models.evidence import EvidenceEvent
from app.models.session import Cohort, FacilitatorNote, Session, SessionActivity
from app.schemas.session import (
    CohortCreate,
    CohortOut,
    FacilitatorNoteCreate,
    FacilitatorNoteOut,
    LaunchActivityRequest,
    SessionActivityOut,
    SessionCreate,
    SessionOut,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])
cohort_router = APIRouter(prefix="/cohorts", tags=["cohorts"])

MAX_SESSION_NUMBER = 14


# ── Cohorts ──


@cohort_router.post(
    "",
    response_model=CohortOut,
    status_code=201,
    summary="Create New Cohort",
    description="Create a new student cohort (class group) with a name and grade band. Students are enrolled into cohorts to participate in live sessions.",
)
async def create_cohort(data: CohortCreate, db: AsyncSession = Depends(get_db)):
    cohort = Cohort(
        name=data.name,
        grade_band=data.grade_band,
        level=data.level,
        schedule=data.schedule,
        board=data.board,
    )
    db.add(cohort)
    await db.commit()
    await db.refresh(cohort)
    return cohort


@cohort_router.get(
    "",
    response_model=list[CohortOut],
    summary="List All Cohorts",
    description="Retrieve all cohorts (class groups), ordered by most recently created.",
)
async def list_cohorts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cohort).order_by(Cohort.created_at.desc()))
    return result.scalars().all()


@cohort_router.get(
    "/{cohort_id}",
    response_model=CohortOut,
    summary="Get Cohort Details",
    description="Retrieve a single cohort by its UUID.",
)
async def get_cohort(cohort_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cohort).where(Cohort.id == cohort_id))
    cohort = result.scalar_one_or_none()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    return cohort


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
):
    stmt = select(Session).order_by(Session.started_at.desc())
    if cohort_id is not None:
        stmt = stmt.where(Session.cohort_id == cohort_id)
    if active is True:
        stmt = stmt.where(Session.ended_at.is_(None))
    elif active is False:
        stmt = stmt.where(Session.ended_at.is_not(None))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "",
    response_model=SessionOut,
    status_code=201,
    summary="Start New Session",
    description="Create a new live session for a cohort. Auto-assigns all activities for the cohort's current session_number as SessionActivity rows (the lesson plan).",
)
async def create_session(data: SessionCreate, db: AsyncSession = Depends(get_db)):
    # Look up cohort to get current_session_number
    session_number = 1
    if data.cohort_id:
        result = await db.execute(select(Cohort).where(Cohort.id == data.cohort_id))
        cohort = result.scalar_one_or_none()
        if not cohort:
            raise HTTPException(status_code=404, detail="Cohort not found")
        session_number = cohort.current_session_number

    session = Session(
        cohort_id=data.cohort_id,
        session_number=session_number,
        teacher_id=data.teacher_id,
    )
    db.add(session)
    await db.flush()  # get session.id before creating SessionActivity rows

    # Auto-assign activities for this session_number
    activities_result = await db.execute(
        select(Activity)
        .where(Activity.session_number == session_number)
        .order_by(Activity.type)
    )
    activities = activities_result.scalars().all()

    # Sort by phase order: warmup → key_topic → diy → ai_lab
    phase_order = {"warmup": 0, "key_topic": 1, "diy": 2, "ai_lab": 3, "artifact": 4}
    activities_sorted = sorted(activities, key=lambda a: phase_order.get(a.type, 99))

    for idx, act in enumerate(activities_sorted, start=1):
        sa = SessionActivity(
            session_id=session.id,
            activity_id=act.id,
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
async def get_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
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
async def get_session_activities(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
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
async def end_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
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
async def get_facilitator_notes(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FacilitatorNote)
        .where(FacilitatorNote.session_id == session_id)
        .order_by(FacilitatorNote.created_at.desc())
    )
    return result.scalars().all()
