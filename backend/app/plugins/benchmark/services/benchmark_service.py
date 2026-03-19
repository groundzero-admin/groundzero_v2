"""Benchmark orchestration: evaluate Q&A answers, save result, seed BKT states.

Two paths for seeding student skill scores:
  1. First-time (no prior evidence): apply_diagnostic() sets P(L) directly from stages.
  2. Returning student (has evidence): process_evidence() per competency so the BKT
     engine does a proper Bayesian update — right answer pushes P(L) up, wrong pushes down.
"""

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competency import Competency
from app.models.student import StudentCompetencyState
from app.plugins.benchmark.models import BenchmarkQuestion, BenchmarkResult, BenchmarkSession, BenchmarkTurn
from app.plugins.benchmark.seed_questions import get_grade_band
from app.plugins.benchmark.services import claude_service
from app.schemas.evidence import EvidenceCreate
from app.services.diagnostic_service import apply_diagnostic
from app.services.evidence_service import process_evidence

logger = logging.getLogger(__name__)

CAPABILITY_TO_PILLAR = {
    "A": "communication", "B": "communication", "C": "communication", "D": "communication",
    "E": "creativity", "F": "creativity", "G": "creativity", "H": "creativity",
    "I": "ai_systems", "J": "ai_systems", "K": "ai_systems", "L": "ai_systems",
    "M": "math_logic", "N": "math_logic", "O": "math_logic", "P": "math_logic",
}

CAPABILITY_TO_COMPETENCY_PREFIX = {
    "A": ["C1.1", "C1.2"], "B": ["C1.3", "C1.4", "C1.5", "C1.6"],
    "C": ["C1.7", "C1.8", "C1.9"], "D": ["C1.10", "C1.11", "C1.12"],
    "E": ["C2.1", "C2.2", "C2.3"], "F": ["C2.4", "C2.5", "C2.6"],
    "G": ["C2.7", "C2.8", "C2.9"], "H": ["C2.10", "C2.11", "C2.12"],
    "I": ["C3.1", "C3.2", "C3.3", "C3.4"], "J": ["C3.5", "C3.6", "C3.7"],
    "K": ["C3.8", "C3.9", "C3.10"], "L": ["C3.11", "C3.12", "C3.13"],
    "M": ["C4.1", "C4.2", "C4.3", "C4.4", "C4.5"],
    "N": ["C4.6", "C4.7", "C4.8", "C4.9", "C4.10"],
    "O": ["C4.11", "C4.12", "C4.13"],
    "P": ["C4.14", "C4.15", "C4.16", "C4.17", "C4.18", "C4.19"],
}

STAGE_TO_OUTCOME: dict[int, float] = {
    1: 0.0,
    2: 0.25,
    3: 0.50,
    4: 0.80,
    5: 1.0,
}


async def run_benchmark(session_id: UUID, db: AsyncSession) -> BenchmarkResult:
    result = await db.execute(select(BenchmarkSession).where(BenchmarkSession.id == session_id))
    session = result.scalar_one()

    student = session.student
    student_name = student.name if student else "Student"
    student_grade = student.grade if student else 6
    student_age = student_grade + 5

    grade_band = get_grade_band(student_grade)

    turns_result = await db.execute(
        select(BenchmarkTurn)
        .where(
            BenchmarkTurn.session_id == session_id,
            BenchmarkTurn.speaker == "student",
            BenchmarkTurn.question_id.isnot(None),
        )
        .order_by(BenchmarkTurn.turn_number)
    )
    turns = turns_result.scalars().all()

    question_ids = [t.question_id for t in turns]
    q_result = await db.execute(
        select(BenchmarkQuestion).where(BenchmarkQuestion.id.in_(question_ids))
    )
    questions_map = {q.id: q for q in q_result.scalars().all()}

    qa_pairs = []
    conversation_snapshot = []
    for turn in turns:
        question = questions_map.get(turn.question_id)
        if not question:
            continue
        qa_pairs.append({
            "question_number": question.question_number,
            "question_text": question.text,
            "answer_text": turn.text,
            "pillars": question.pillars or [],
            "strong_signals": question.strong_signals or [],
            "watchout_signals": question.watchout_signals or [],
        })
        conversation_snapshot.append({
            "question_number": question.question_number,
            "question": question.text,
            "answer": turn.text,
        })

    if not qa_pairs:
        raise ValueError("No valid Q&A pairs found for session")

    benchmark_data = await claude_service.evaluate_answers(
        student_name=student_name,
        age=student_age,
        grade=str(student_grade),
        character=session.character,
        qa_pairs=qa_pairs,
    )

    pillar_stages = benchmark_data.get("pillar_stages", {})
    capability_stages = benchmark_data.get("capability_stages", {})
    capability_evidence = benchmark_data.get("capability_evidence", {})
    insights = benchmark_data.get("insights", {})

    for p in ["communication", "creativity", "ai_systems", "math_logic"]:
        pillar_stages.setdefault(p, 1)
        pillar_stages[p] = max(1, min(5, int(pillar_stages[p])))

    for cap_id, stage in list(capability_stages.items()):
        if stage is not None:
            capability_stages[cap_id] = max(1, min(5, int(stage)))

    benchmark = BenchmarkResult(
        session_id=session_id,
        pillar_stages=pillar_stages,
        capability_stages=capability_stages,
        capability_evidence=capability_evidence,
        strongest_areas=insights.get("strongest_areas", []),
        growth_areas=insights.get("growth_areas", []),
        dominant_interests=insights.get("dominant_interests", []),
        learning_style=insights.get("learning_style"),
        engagement_level=insights.get("engagement_level"),
        notable_observations=insights.get("notable_observations", []),
        summary=benchmark_data.get("summary", ""),
        conversation_snapshot=conversation_snapshot,
        bkt_seeded="pending",
    )

    session.status = "benchmark_ready"
    session.ended_at = datetime.now(timezone.utc)

    db.add(benchmark)
    await db.commit()
    await db.refresh(benchmark)

    if student:
        try:
            overrides: dict[str, int] = {}
            for cap_id, stage in capability_stages.items():
                if stage is None:
                    continue
                competency_ids = CAPABILITY_TO_COMPETENCY_PREFIX.get(cap_id, [])
                for cid in competency_ids:
                    overrides[cid] = stage

            has_prior = await _student_has_prior_evidence(db, student.id)

            if has_prior:
                await _seed_bkt_via_evidence(
                    db, student.id, overrides, session_id,
                )
            else:
                diagnostic_profile = {
                    "pillar_stages": pillar_stages,
                    "overrides": overrides,
                }
                await apply_diagnostic(db, student.id, diagnostic_profile)

            benchmark.bkt_seeded = "done"
            await db.commit()
            logger.info(
                "BKT states seeded from benchmark for student %s (method=%s)",
                student.id, "evidence" if has_prior else "diagnostic",
            )
        except Exception as e:
            logger.error("Failed to seed BKT from benchmark: %s", e)
            benchmark.bkt_seeded = "failed"
            await db.commit()

    return benchmark


async def _student_has_prior_evidence(db: AsyncSession, student_id: UUID) -> bool:
    """Check if the student has any prior BKT evidence (total_evidence > 0 on any competency)."""
    result = await db.execute(
        select(func.coalesce(func.sum(StudentCompetencyState.total_evidence), 0))
        .where(StudentCompetencyState.student_id == student_id)
    )
    total = result.scalar_one()
    return total > 0


async def _ensure_competency_state_exists(
    db: AsyncSession, student_id: UUID, competency_id: str,
) -> None:
    """Create a StudentCompetencyState row if one doesn't exist for this student+competency."""
    result = await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id == student_id,
            StudentCompetencyState.competency_id == competency_id,
        )
    )
    if result.scalar_one_or_none() is not None:
        return

    comp_result = await db.execute(
        select(Competency).where(Competency.id == competency_id)
    )
    comp = comp_result.scalar_one_or_none()
    params = (comp.default_params or {}) if comp else {}

    state = StudentCompetencyState(
        student_id=student_id,
        competency_id=competency_id,
        p_learned=params.get("p_l0", 0.10),
        p_transit=params.get("p_transit", 0.15),
        p_guess=params.get("p_guess", 0.25),
        p_slip=params.get("p_slip", 0.10),
    )
    db.add(state)
    await db.flush()


async def _seed_bkt_via_evidence(
    db: AsyncSession,
    student_id: UUID,
    overrides: dict[str, int],
    benchmark_session_id: UUID,
) -> list:
    """Submit per-competency evidence through the BKT engine for returning students.

    Each capability stage is converted to an outcome (0-1) and fed through
    process_evidence() so the Bayesian update respects prior learning history.
    """
    all_updates = []

    for competency_id, stage in overrides.items():
        outcome = STAGE_TO_OUTCOME.get(stage, 0.0)

        await _ensure_competency_state_exists(db, student_id, competency_id)

        evidence = EvidenceCreate(
            student_id=student_id,
            competency_id=competency_id,
            outcome=outcome,
            source="diagnostic",
            session_id=benchmark_session_id,
        )

        _event, updates = await process_evidence(db, evidence)
        all_updates.extend(updates)

    return all_updates
