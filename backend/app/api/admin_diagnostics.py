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
    # BKT state (lifetime, current)
    p_learned: float
    stage: int                          # 1-5: Novice→Mastered
    total_evidence: int                 # lifetime attempts
    consecutive_failures: int
    is_stuck: bool
    avg_response_time_ms: float | None
    # Session BKT delta
    p_learned_before: float | None      # p_learned at session start
    stage_before: int | None
    # Session-scoped performance
    session_correct: int
    session_total: int
    # Misconception
    dominant_misconception_type: str | None
    dominant_misconception: str | None

class CompetencyClassReport(BaseModel):
    competency_id: str
    competency_name: str
    students: list[StudentMasteryRow]
    # Aggregates
    attempted_count: int
    mastered_count: int
    struggling_count: int
    not_started_count: int
    avg_p_learned: float                # across attempted students only
    stage_distribution: dict            # {1: N, 2: N, 3: N, 4: N, 5: N}
    session_correct_total: int
    session_attempts_total: int
    misconception_breakdown: dict

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
    from app.models.student import SessionCompetencySnapshot

    # Get session
    session = await db.get(Session, session_id)
    if not session:
        return []

    # Gather competencies from all launched activities (active, paused, or completed)
    from app.models.session import SessionActivity
    launched = (await db.execute(
        select(SessionActivity).where(
            SessionActivity.session_id == session_id,
            SessionActivity.status.in_(["active", "paused", "completed"]),
        )
    )).scalars().all()

    # Also include current_activity_id in case it's pending but already set
    activity_ids_to_check = {sa.activity_id for sa in launched}
    if session.current_activity_id:
        activity_ids_to_check.add(session.current_activity_id)

    if not activity_ids_to_check:
        return []

    competency_ids_set: set[str] = set()
    for act_id in activity_ids_to_check:
        activity = await db.get(Activity, act_id)
        if not activity:
            continue
        primary_competencies = activity.primary_competencies or []
        for c in primary_competencies:
            cid = c.get("competency_id") or c.get("competencyId")
            if cid:
                competency_ids_set.add(cid)

    competency_ids = list(competency_ids_set)
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

    from sqlalchemy import case as sa_case

    reports = []
    for comp_id in competency_ids:
        # BKT states (lifetime)
        states = (await db.execute(
            select(StudentCompetencyState).where(
                StudentCompetencyState.competency_id == comp_id,
                StudentCompetencyState.student_id.in_(student_ids),
            )
        )).scalars().all()
        state_map = {s.student_id: s for s in states}

        # Session BKT snapshots (before/after)
        snapshots = (await db.execute(
            select(SessionCompetencySnapshot).where(
                SessionCompetencySnapshot.session_id == session_id,
                SessionCompetencySnapshot.competency_id == comp_id,
                SessionCompetencySnapshot.student_id.in_(student_ids),
            )
        )).scalars().all()
        snapshot_map = {s.student_id: s for s in snapshots}

        # Session-scoped MCQ evidence: correct + total per student
        # Deduplicate by activity_question_id — only count the last attempt per question.
        from sqlalchemy import text
        session_ev_rows = (await db.execute(
            text("""
                SELECT student_id, count(*) AS total,
                       sum(CASE WHEN outcome >= 0.5 THEN 1 ELSE 0 END) AS correct
                FROM (
                    SELECT DISTINCT ON (student_id, meta->>'activityQuestionId')
                           student_id, outcome
                    FROM evidence_events
                    WHERE competency_id = :comp_id
                      AND student_id = ANY(:student_ids)
                      AND session_id = :session_id
                      AND source = 'mcq'
                      AND meta->>'activityQuestionId' IS NOT NULL
                    ORDER BY student_id, meta->>'activityQuestionId', created_at DESC
                ) latest
                GROUP BY student_id
            """),
            {"comp_id": comp_id, "student_ids": student_ids, "session_id": session_id},
        )).all()
        session_score_map: dict[uuid.UUID, tuple[int, int]] = {
            row.student_id: (int(row.correct), int(row.total)) for row in session_ev_rows
        }

        # Latest misconception per student (session-scoped wrong answers)
        misc_events = (await db.execute(
            select(EvidenceEvent)
            .where(
                EvidenceEvent.competency_id == comp_id,
                EvidenceEvent.student_id.in_(student_ids),
                EvidenceEvent.session_id == session_id,
                EvidenceEvent.outcome < 0.5,
                EvidenceEvent.misconception.isnot(None),
            )
            .order_by(EvidenceEvent.created_at.desc())
        )).scalars().all()
        student_misconception: dict[uuid.UUID, dict] = {}
        for ev in misc_events:
            if ev.student_id not in student_misconception:
                student_misconception[ev.student_id] = ev.misconception

        student_rows = []
        misconception_counts: dict[str, int] = {}

        for sid in student_ids:
            state = state_map.get(sid)
            snap = snapshot_map.get(sid)
            misc = student_misconception.get(sid)
            misc_type = misc.get("type") if misc else None
            misc_text = misc.get("misconception") if misc else None
            sess_correct, sess_total = session_score_map.get(sid, (0, 0))

            if misc_type:
                misconception_counts[misc_type] = misconception_counts.get(misc_type, 0) + 1

            student_rows.append(StudentMasteryRow(
                student_id=sid,
                student_name=student_name_map.get(sid, "Unknown"),
                p_learned=state.p_learned if state else 0.0,
                stage=state.stage if state else 1,
                total_evidence=state.total_evidence if state else 0,
                consecutive_failures=state.consecutive_failures if state else 0,
                is_stuck=state.is_stuck if state else False,
                avg_response_time_ms=state.avg_response_time_ms if state else None,
                p_learned_before=snap.p_learned_before if snap else None,
                stage_before=snap.stage_before if snap else None,
                session_correct=sess_correct,
                session_total=sess_total,
                dominant_misconception_type=misc_type,
                dominant_misconception=misc_text,
            ))

        attempted = sum(1 for r in student_rows if r.session_total > 0)
        mastered = sum(1 for r in student_rows if r.p_learned >= 0.85)
        struggling = sum(1 for r in student_rows if r.p_learned < 0.4 and r.session_total > 0)
        not_started = sum(1 for r in student_rows if r.session_total == 0)
        attempted_students = [r for r in student_rows if r.session_total > 0]
        avg_p = sum(r.p_learned for r in attempted_students) / len(attempted_students) if attempted_students else 0.0
        stage_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for r in attempted_students:
            stage_dist[max(1, min(5, r.stage))] += 1

        reports.append(CompetencyClassReport(
            competency_id=comp_id,
            competency_name=comp_name_map.get(comp_id, comp_id),
            students=student_rows,
            attempted_count=attempted,
            mastered_count=mastered,
            struggling_count=struggling,
            not_started_count=not_started,
            avg_p_learned=round(avg_p, 3),
            stage_distribution=stage_dist,
            session_correct_total=sum(r.session_correct for r in student_rows),
            session_attempts_total=sum(r.session_total for r in student_rows),
            misconception_breakdown=misconception_counts,
        ))

    return reports
