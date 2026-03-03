"""
Teacher-specific API routes — cohort students, live pulse, session scores.

All routes here require role="teacher" (enforced by require_role dependency).
"""
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.competency import Competency
from app.models.evidence import EvidenceEvent
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentOut

router = APIRouter(prefix="/teacher", tags=["teacher"])


@router.get(
    "/cohorts/{cohort_id}/students",
    response_model=list[StudentOut],
    summary="Get Students in Cohort",
)
async def get_cohort_students(
    cohort_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("teacher")),
):
    result = await db.execute(
        select(Student).where(Student.cohort_id == cohort_id).order_by(Student.name)
    )
    return result.scalars().all()


@router.get(
    "/cohorts/{cohort_id}/live-pulse",
    summary="Get Live Pulse Feed",
    description="Recent evidence events for students in this cohort, filtered to the active session. Used for the real-time teacher dashboard feed.",
)
async def get_live_pulse(
    cohort_id: uuid.UUID,
    session_id: uuid.UUID | None = Query(None),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("teacher")),
):
    # Get student IDs in this cohort
    student_ids_q = select(Student.id).where(Student.cohort_id == cohort_id)

    # Get recent evidence events joined with competency names
    stmt = (
        select(EvidenceEvent, Competency.name.label("competency_name"))
        .outerjoin(Competency, EvidenceEvent.competency_id == Competency.id)
        .where(EvidenceEvent.student_id.in_(student_ids_q))
        .order_by(EvidenceEvent.created_at.desc())
        .limit(limit)
    )

    # Filter to current session if provided
    if session_id:
        stmt = stmt.where(EvidenceEvent.session_id == session_id)

    result = await db.execute(stmt)
    rows = result.all()

    # Join student names for display
    student_result = await db.execute(
        select(Student.id, Student.name).where(Student.cohort_id == cohort_id)
    )
    name_map = {row.id: row.name for row in student_result}

    return [
        {
            "id": str(e.id),
            "student_id": str(e.student_id),
            "student_name": name_map.get(e.student_id, "Unknown"),
            "competency_id": e.competency_id,
            "competency_name": comp_name,
            "source": e.source,
            "outcome": e.outcome,
            "meta": e.meta,
            "created_at": e.created_at.isoformat(),
        }
        for e, comp_name in rows
    ]


@router.get(
    "/cohorts/{cohort_id}/session-scores",
    summary="Per-Student Session Scores",
    description="Aggregated correct/total per student for the given session.",
)
async def get_session_scores(
    cohort_id: uuid.UUID,
    session_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("teacher")),
):
    stmt = (
        select(
            EvidenceEvent.student_id,
            func.count().label("total"),
            func.sum(case((EvidenceEvent.outcome >= 0.5, 1), else_=0)).label("correct"),
        )
        .where(
            EvidenceEvent.session_id == session_id,
            EvidenceEvent.student_id.in_(
                select(Student.id).where(Student.cohort_id == cohort_id)
            ),
        )
        .group_by(EvidenceEvent.student_id)
    )
    result = await db.execute(stmt)
    score_rows = {row.student_id: row for row in result.all()}

    student_result = await db.execute(
        select(Student.id, Student.name).where(Student.cohort_id == cohort_id).order_by(Student.name)
    )

    return [
        {
            "student_id": str(sid),
            "student_name": name,
            "correct": int(score_rows[sid].correct) if sid in score_rows else 0,
            "total": int(score_rows[sid].total) if sid in score_rows else 0,
        }
        for sid, name in student_result
    ]
