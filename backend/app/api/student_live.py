"""Student-facing live session endpoint — returns sessions from the student's enrolled cohort."""
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

router = APIRouter(prefix="/students/me", tags=["student-live"])


class StudentLiveSessionOut(BaseModel):
    id: str
    title: str | None
    description: str | None
    order: int | None
    scheduled_at: str | None
    started_at: str | None
    ended_at: str | None
    is_live: bool
    room_code_guest: str | None
    cohort_name: str
    cohort_id: str
    student_name: str


@router.get(
    "/live-sessions",
    response_model=list[StudentLiveSessionOut],
    summary="Get scheduled sessions for the student's enrolled cohorts",
)
async def get_my_live_sessions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("student")),
):
    # Find the student record
    result = await db.execute(
        select(Student).where(Student.user_id == user.id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(404, "Student record not found")

    # Find all cohort enrollments for this student
    enr_result = await db.execute(
        select(CohortEnrollment)
        .where(CohortEnrollment.student_id == student.id)
        .order_by(CohortEnrollment.enrolled_at.desc())
    )
    enrollments = enr_result.scalars().all()
    if not enrollments:
        return []

    cohort_ids = [e.cohort_id for e in enrollments]

    # Get all cohorts with their sessions + live rooms
    cohort_result = await db.execute(
        select(Cohort)
        .where(Cohort.id.in_(cohort_ids))
        .options(selectinload(Cohort.sessions).selectinload(Session.live_room))
    )
    cohorts = cohort_result.scalars().all()

    out: list[StudentLiveSessionOut] = []
    for cohort in cohorts:
        for sess in cohort.sessions:
            # We want timeline + next class, so include anything that has a schedule
            if not (sess.scheduled_at or sess.started_at or sess.ended_at):
                continue

            is_live = sess.started_at is not None and sess.ended_at is None
            room = sess.live_room
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
                    room_code_guest=room.room_code_guest if room else None,
                    cohort_name=cohort.name,
                    cohort_id=str(cohort.id),
                    student_name=user.full_name,
                )
            )

    return out
