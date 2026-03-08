"""
Teacher-specific API routes — cohort students, live pulse, session scores, class analytics.

All routes here require role="teacher" (enforced by require_role dependency).
"""
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.competency import Competency
from app.models.evidence import EvidenceEvent
from app.models.student import Student, StudentCompetencyState
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


# ── Class Analytics ──────────────────────────────────────────────


class StudentMasteryRow(BaseModel):
    student_id: str
    student_name: str
    grade: int
    competencies: dict[str, dict]  # competency_id → { p_learned, stage, is_stuck, ... }
    overall: float
    total_evidence: int
    last_active: str | None


class InterventionAlert(BaseModel):
    student_id: str
    student_name: str
    alert_type: str  # "stuck" | "inactive" | "declining"
    detail: str
    competency_id: str | None = None
    competency_name: str | None = None
    severity: int  # 1=low, 2=medium, 3=high


class ClassSummaryOut(BaseModel):
    students: list[StudentMasteryRow]
    interventions: list[InterventionAlert]
    competency_ids: list[str]
    competency_names: dict[str, str]


@router.get(
    "/cohorts/{cohort_id}/class-summary",
    response_model=ClassSummaryOut,
    summary="Class Analytics Summary",
    description="Full mastery heatmap data + intervention alerts for all students in a cohort.",
)
async def get_class_summary(
    cohort_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("teacher")),
):
    # 1. Get students in cohort
    students_result = await db.execute(
        select(Student).where(Student.cohort_id == cohort_id).order_by(Student.name)
    )
    students = students_result.scalars().all()
    if not students:
        return ClassSummaryOut(students=[], interventions=[], competency_ids=[], competency_names={})

    student_ids = [s.id for s in students]

    # 2. Get all competency states for these students
    states_result = await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id.in_(student_ids)
        )
    )
    all_states = states_result.scalars().all()

    # 3. Load competency names
    comp_result = await db.execute(select(Competency).order_by(Competency.id))
    comp_map = {c.id: c.name for c in comp_result.scalars().all()}

    # Find which competencies have any evidence (skip untouched ones)
    active_comp_ids = sorted({
        st.competency_id for st in all_states if st.total_evidence > 0
    })

    # Group states by student
    states_by_student: dict[uuid.UUID, list[StudentCompetencyState]] = {}
    for st in all_states:
        states_by_student.setdefault(st.student_id, []).append(st)

    now = datetime.utcnow()
    rows: list[StudentMasteryRow] = []
    interventions: list[InterventionAlert] = []

    for student in students:
        student_states = states_by_student.get(student.id, [])
        comps: dict[str, dict] = {}
        total_p = 0.0
        total_ev = 0
        last_active: datetime | None = None

        practiced_count = 0
        for st in student_states:
            if st.competency_id in active_comp_ids:
                comps[st.competency_id] = {
                    "p_learned": round(st.p_learned, 3),
                    "stage": st.stage,
                    "is_stuck": st.is_stuck,
                    "total_evidence": st.total_evidence,
                    "consecutive_failures": st.consecutive_failures,
                }
            if st.total_evidence > 0:
                total_p += st.p_learned
                practiced_count += 1
            total_ev += st.total_evidence
            if st.last_evidence_at:
                if not last_active or st.last_evidence_at > last_active:
                    last_active = st.last_evidence_at

        overall = total_p / practiced_count if practiced_count > 0 else 0.0

        rows.append(StudentMasteryRow(
            student_id=str(student.id),
            student_name=student.name,
            grade=student.grade,
            competencies=comps,
            overall=round(overall, 3),
            total_evidence=total_ev,
            last_active=last_active.isoformat() if last_active else None,
        ))

        # Generate intervention alerts
        for st in student_states:
            if st.is_stuck:
                interventions.append(InterventionAlert(
                    student_id=str(student.id),
                    student_name=student.name,
                    alert_type="stuck",
                    detail=f"{st.consecutive_failures} consecutive failures",
                    competency_id=st.competency_id,
                    competency_name=comp_map.get(st.competency_id),
                    severity=3,
                ))

        # Inactive check: no evidence in 3+ days
        if last_active and (now - last_active) > timedelta(days=3):
            days = (now - last_active).days
            interventions.append(InterventionAlert(
                student_id=str(student.id),
                student_name=student.name,
                alert_type="inactive",
                detail=f"No activity for {days} days",
                severity=2,
            ))
        elif not last_active and total_ev == 0:
            interventions.append(InterventionAlert(
                student_id=str(student.id),
                student_name=student.name,
                alert_type="inactive",
                detail="Never practiced",
                severity=2,
            ))

    # Sort interventions: highest severity first
    interventions.sort(key=lambda a: (-a.severity, a.student_name))

    return ClassSummaryOut(
        students=rows,
        interventions=interventions,
        competency_ids=active_comp_ids,
        competency_names={cid: comp_map.get(cid, cid) for cid in active_comp_ids},
    )
