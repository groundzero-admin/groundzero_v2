"""Admin diagnostic APIs for skill graph drill-down and class aggregation."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.evidence import EvidenceEvent
from app.models.activity_question import ActivityQuestion
from app.models.question_template import QuestionTemplate
from app.models.student import Student, StudentCompetencyState
from app.models.user import User

router = APIRouter(prefix="/admin/diagnostics", tags=["admin-diagnostics"])


# ── Per-student competency drill-down ──

class EvidenceDetail(BaseModel):
    id: uuid.UUID
    outcome: float
    response_time_ms: float | None
    misconception: dict | None
    created_at: datetime

class CompetencyDrilldown(BaseModel):
    competency_id: str
    student_id: uuid.UUID
    p_learned: float
    stage: int
    total_evidence: int
    is_stuck: bool
    evidence: list[EvidenceDetail]

@router.get("/students/{student_id}/competency/{competency_id}")
async def get_competency_drilldown(
    student_id: uuid.UUID,
    competency_id: str,
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
) -> CompetencyDrilldown:
    # Get state
    state_row = (await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id == student_id,
            StudentCompetencyState.competency_id == competency_id,
        )
    )).scalar_one_or_none()

    # Get recent evidence events
    events = (await db.execute(
        select(EvidenceEvent)
        .where(
            EvidenceEvent.student_id == student_id,
            EvidenceEvent.competency_id == competency_id,
        )
        .order_by(EvidenceEvent.created_at.desc())
        .limit(limit)
    )).scalars().all()

    return CompetencyDrilldown(
        competency_id=competency_id,
        student_id=student_id,
        p_learned=state_row.p_learned if state_row else 0.0,
        stage=state_row.stage if state_row else 0,
        total_evidence=state_row.total_evidence if state_row else 0,
        is_stuck=state_row.is_stuck if state_row else False,
        evidence=[
            EvidenceDetail(
                id=e.id,
                outcome=e.outcome,
                response_time_ms=e.meta.get("responseTimeMs") if e.meta else None,
                misconception=e.misconception,
                created_at=e.created_at,
            )
            for e in events
        ],
    )


# ── Class aggregation — all students for a session ──

class StudentMasteryRow(BaseModel):
    student_id: uuid.UUID
    student_name: str
    p_learned: float
    stage: int
    total_evidence: int
    is_stuck: bool
    dominant_misconception_type: str | None  # conceptual/procedural/careless/guessing
    dominant_misconception: str | None  # the actual text

class CompetencyClassReport(BaseModel):
    competency_id: str
    competency_name: str
    students: list[StudentMasteryRow]
    # Aggregates
    attempted_count: int
    mastered_count: int  # p_learned >= 0.8
    struggling_count: int  # p_learned < 0.4 and total_evidence > 0
    not_started_count: int
    misconception_breakdown: dict  # {type: count}

@router.get("/sessions/{session_id}/class-report")
async def get_class_report(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
) -> list[CompetencyClassReport]:
    from app.models.session import Session
    from app.models.batch_enrollment import CohortEnrollment
    from app.models.competency import Competency
    from app.models.curriculum import Activity

    # Get session + its current activity's competencies
    session = await db.get(Session, session_id)
    if not session or not session.current_activity_id:
        return []

    activity = await db.get(Activity, session.current_activity_id)
    if not activity:
        return []

    primary_competencies = activity.primary_competencies or []
    competency_ids = [c["competency_id"] for c in primary_competencies if "competency_id" in c]
    if not competency_ids:
        # Try alternate key
        competency_ids = [c["competencyId"] for c in primary_competencies if "competencyId" in c]
    if not competency_ids:
        return []

    # Get all students in this session's cohort
    cohort_id = session.cohort_id
    if not cohort_id:
        return []

    enrollments = (await db.execute(
        select(CohortEnrollment).where(CohortEnrollment.cohort_id == cohort_id)
    )).scalars().all()
    student_ids = [e.student_id for e in enrollments]
    if not student_ids:
        return []

    # Get student names
    students_rows = (await db.execute(
        select(Student).where(Student.id.in_(student_ids))
    )).scalars().all()
    student_name_map = {s.id: s.name for s in students_rows}

    # Get competency names
    comps = (await db.execute(
        select(Competency).where(Competency.id.in_(competency_ids))
    )).scalars().all()
    comp_name_map = {c.id: c.name for c in comps}

    reports = []
    for comp_id in competency_ids:
        # Get all states for this competency across students
        states = (await db.execute(
            select(StudentCompetencyState).where(
                StudentCompetencyState.competency_id == comp_id,
                StudentCompetencyState.student_id.in_(student_ids),
            )
        )).scalars().all()
        state_map = {s.student_id: s for s in states}

        # Get latest misconception per student for this competency
        recent_evidence = (await db.execute(
            select(EvidenceEvent)
            .where(
                EvidenceEvent.competency_id == comp_id,
                EvidenceEvent.student_id.in_(student_ids),
                EvidenceEvent.outcome < 0.5,
                EvidenceEvent.misconception.isnot(None),
            )
            .order_by(EvidenceEvent.created_at.desc())
        )).scalars().all()

        # Latest misconception per student
        student_misconception: dict[uuid.UUID, dict] = {}
        for ev in recent_evidence:
            if ev.student_id not in student_misconception:
                student_misconception[ev.student_id] = ev.misconception

        student_rows = []
        misconception_counts: dict[str, int] = {}

        for sid in student_ids:
            state = state_map.get(sid)
            misc = student_misconception.get(sid)
            misc_type = misc.get("type") if misc else None
            misc_text = misc.get("misconception") if misc else None

            if misc_type:
                misconception_counts[misc_type] = misconception_counts.get(misc_type, 0) + 1

            student_rows.append(StudentMasteryRow(
                student_id=sid,
                student_name=student_name_map.get(sid, "Unknown"),
                p_learned=state.p_learned if state else 0.0,
                stage=state.stage if state else 0,
                total_evidence=state.total_evidence if state else 0,
                is_stuck=state.is_stuck if state else False,
                dominant_misconception_type=misc_type,
                dominant_misconception=misc_text,
            ))

        attempted = sum(1 for r in student_rows if r.total_evidence > 0)
        mastered = sum(1 for r in student_rows if r.p_learned >= 0.8)
        struggling = sum(1 for r in student_rows if r.p_learned < 0.4 and r.total_evidence > 0)
        not_started = sum(1 for r in student_rows if r.total_evidence == 0)

        reports.append(CompetencyClassReport(
            competency_id=comp_id,
            competency_name=comp_name_map.get(comp_id, comp_id),
            students=student_rows,
            attempted_count=attempted,
            mastered_count=mastered,
            struggling_count=struggling,
            not_started_count=not_started,
            misconception_breakdown=misconception_counts,
        ))

    return reports
