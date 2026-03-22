"""Student-facing live session API — all enrolled cohorts merged; session review."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_role
from app.database import get_db
from app.models.batch_enrollment import CohortEnrollment
from app.models.session import Cohort, Session
from app.models.student import Student
from app.models.user import User
from app.services import hms_service
from app.api.live_batches import SessionViewOut, build_session_view

router = APIRouter(prefix="/students/me", tags=["student-live"])


class StudentLiveSessionOut(BaseModel):
    id: str
    title: str | None
    description: str | None
    order: int | None
    scheduled_at: str | None
    started_at: str | None = None
    ended_at: str | None = None
    is_live: bool
    room_code_guest: str | None
    cohort_name: str
    cohort_id: str
    student_name: str


@router.get(
    "/live-sessions",
    response_model=list[StudentLiveSessionOut],
    summary="Live sessions from all cohorts the student is enrolled in (merged, sorted)",
)
async def get_my_live_sessions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
):
    result = await db.execute(select(Student).where(Student.user_id == user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(404, "Student record not found")

    enr_result = await db.execute(
        select(CohortEnrollment.cohort_id).where(CohortEnrollment.student_id == student.id)
    )
    cohort_ids = list(set(enr_result.scalars().all()))
    if not cohort_ids:
        return []
    cohorts_result = await db.execute(
        select(Cohort)
        .where(Cohort.id.in_(cohort_ids))
        .options(selectinload(Cohort.sessions).selectinload(Session.live_room))
    )
    cohorts = cohorts_result.scalars().all()
    if not cohorts:
        return []

    combined: list[tuple[Session, Cohort]] = []
    for cohort in cohorts:
        for sess in cohort.sessions:
            combined.append((sess, cohort))

    combined.sort(
        key=lambda pair: (
            pair[0].scheduled_at.timestamp() if pair[0].scheduled_at else float("inf"),
            pair[0].order or 0,
            str(pair[0].id),
        )
    )

    out: list[StudentLiveSessionOut] = []
    for sess, cohort in combined:
        room = sess.live_room
        is_live = sess.started_at is not None and sess.ended_at is None
        out.append(
            StudentLiveSessionOut(
                id=str(sess.id),
                title=sess.title,
                description=sess.description,
                order=sess.order,
                scheduled_at=sess.scheduled_at.isoformat() if sess.scheduled_at else None,
                started_at=sess.started_at.isoformat() if sess.started_at else None,
                ended_at=sess.ended_at.isoformat() if sess.ended_at else None,
                is_live=is_live,
                room_code_guest=room.room_code_guest if room and is_live else None,
                cohort_name=cohort.name,
                cohort_id=str(cohort.id),
                student_name=user.full_name,
            )
        )

    return out


class SessionReviewOut(BaseModel):
    id: str
    title: str | None
    description: str | None
    order: int | None
    scheduled_at: str | None
    started_at: str | None = None
    ended_at: str | None = None
    cohort_name: str
    cohort_id: str
    recording_playback_url: str | None
    recording_status: str


@router.get(
    "/sessions/{session_id}/review",
    response_model=SessionReviewOut,
    summary="Session review: metadata + recording URL (any enrolled cohort)",
)
async def get_session_review(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
):
    result = await db.execute(select(Student).where(Student.user_id == user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(404, "Student record not found")

    enr_result = await db.execute(
        select(CohortEnrollment.cohort_id).where(
            CohortEnrollment.student_id == student.id
        )
    )
    enrolled_cohort_ids = {row[0] for row in enr_result.all()}
    if not enrolled_cohort_ids:
        raise HTTPException(403, "Not enrolled in a cohort")

    sess_result = await db.execute(
        select(Session)
        .where(Session.id == session_id)
        .options(selectinload(Session.cohort), selectinload(Session.live_room))
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    if not session.cohort_id or session.cohort_id not in enrolled_cohort_ids:
        raise HTTPException(403, "Session is not in any of your cohorts")

    cohort = session.cohort
    cohort_name = cohort.name if cohort else ""

    recording_url: str | None = None
    status = "none"
    room = session.live_room
    if room and room.hms_room_id:
        try:
            recording_url = await hms_service.get_latest_recording_playback_url(
                room.hms_room_id
            )
            status = "available" if recording_url else "none"
        except Exception:
            status = "error"

    return SessionReviewOut(
        id=str(session.id),
        title=session.title,
        description=session.description,
        order=session.order,
        scheduled_at=session.scheduled_at.isoformat() if session.scheduled_at else None,
        started_at=session.started_at.isoformat() if session.started_at else None,
        ended_at=session.ended_at.isoformat() if session.ended_at else None,
        cohort_name=cohort_name,
        cohort_id=str(session.cohort_id) if session.cohort_id else "",
        recording_playback_url=recording_url,
        recording_status=status,
    )


@router.get(
    "/sessions/{session_id}/view",
    response_model=SessionViewOut,
    summary="Session activities and questions (for recording review)",
    description="Activities in order with full question payloads (template slug + data), same shape as teacher preview.",
)
async def get_my_session_view(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
):
    result = await db.execute(select(Student).where(Student.user_id == user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(404, "Student record not found")

    enr_result = await db.execute(
        select(CohortEnrollment.cohort_id).where(
            CohortEnrollment.student_id == student.id
        )
    )
    enrolled_cohort_ids = {row[0] for row in enr_result.all()}
    if not enrolled_cohort_ids:
        raise HTTPException(403, "Not enrolled in a cohort")

    sess_result = await db.execute(
        select(Session)
        .where(Session.id == session_id)
        .options(selectinload(Session.live_room))
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    if not session.cohort_id or session.cohort_id not in enrolled_cohort_ids:
        raise HTTPException(403, "Session is not in any of your cohorts")

    return await build_session_view(session, db)
