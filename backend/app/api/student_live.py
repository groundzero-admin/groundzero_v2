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
    is_live: bool
    room_code_guest: str | None
    cohort_name: str
    cohort_id: str
    student_name: str


@router.get(
    "/live-sessions",
    response_model=list[StudentLiveSessionOut],
    summary="Get live sessions for the student's enrolled cohort",
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

    # Find enrollment(s) — take the most recent one
    enr_result = await db.execute(
        select(CohortEnrollment)
        .where(CohortEnrollment.student_id == student.id)
        .order_by(CohortEnrollment.enrolled_at.desc())
        .limit(1)
    )
    enrollment = enr_result.scalar_one_or_none()
    if not enrollment:
        return []

    # Get the cohort with sessions + live rooms
    cohort_result = await db.execute(
        select(Cohort)
        .where(Cohort.id == enrollment.cohort_id)
        .options(selectinload(Cohort.sessions).selectinload(Session.live_room))
    )
    cohort = cohort_result.scalar_one_or_none()
    if not cohort:
        return []

    # Only return sessions that are currently live (started and not ended)
    out = []
    for sess in cohort.sessions:
        if sess.started_at is None or sess.ended_at is not None:
            continue
        room = sess.live_room
        out.append(
            StudentLiveSessionOut(
                id=str(sess.id),
                title=sess.title,
                description=sess.description,
                order=sess.order,
                scheduled_at=sess.scheduled_at.isoformat() if sess.scheduled_at else None,
                is_live=True,
                room_code_guest=room.room_code_guest if room else None,
                cohort_name=cohort.name,
                cohort_id=str(cohort.id),
                student_name=user.full_name,
            )
        )

    return out
