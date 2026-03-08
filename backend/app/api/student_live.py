"""Student-facing live session endpoint — returns sessions from the student's enrolled batch."""
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_role
from app.database import get_db
from app.models.batch_enrollment import BatchStudentEnrollment
from app.models.live_batch import LiveBatch, LiveBatchSession
from app.models.student import Student
from app.models.user import User

router = APIRouter(prefix="/students/me", tags=["student-live"])


class StudentLiveSessionOut(BaseModel):
    id: str
    title: str
    description: str | None
    day: int
    order: int
    scheduled_date: str | None
    daily_timing: str | None
    is_live: bool
    hms_room_code_host: str | None
    hms_room_code_guest: str | None
    batch_name: str
    batch_id: str
    student_name: str


@router.get(
    "/live-sessions",
    response_model=list[StudentLiveSessionOut],
    summary="Get live sessions for the student's enrolled batch",
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
        select(BatchStudentEnrollment)
        .where(BatchStudentEnrollment.student_id == student.id)
        .order_by(BatchStudentEnrollment.enrolled_at.desc())
    )
    enrollment = enr_result.scalar_one_or_none()
    if not enrollment:
        return []  # Not enrolled in any batch

    # Get the batch with sessions
    batch = await db.get(LiveBatch, enrollment.batch_id)
    if not batch:
        return []

    sessions_result = await db.execute(
        select(LiveBatchSession)
        .where(LiveBatchSession.batch_id == batch.id)
        .order_by(LiveBatchSession.day, LiveBatchSession.order)
    )
    sessions = sessions_result.scalars().all()

    out = []
    for sess in sessions:
        # Resolve title from template if linked
        title = sess.title
        description = sess.description
        day = sess.day

        scheduled_date = None
        if batch.start_date:
            sd = batch.start_date + timedelta(days=day - 1)
            scheduled_date = sd.isoformat()

        out.append(
            StudentLiveSessionOut(
                id=str(sess.id),
                title=title,
                description=description,
                day=day,
                order=sess.order,
                scheduled_date=scheduled_date,
                daily_timing=sess.daily_timing or batch.daily_timing,
                is_live=sess.is_live,
                hms_room_code_host=sess.hms_room_code_host,
                hms_room_code_guest=sess.hms_room_code_guest,
                batch_name=batch.name,
                batch_id=str(batch.id),
                student_name=user.full_name,
            )
        )

    return out
