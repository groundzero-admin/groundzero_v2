"""Benchmark orchestration: score conversation, save result, seed BKT states."""

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.plugins.benchmark.models import BenchmarkResult, BenchmarkSession, BenchmarkTurn
from app.plugins.benchmark.services import claude_service
from app.services.diagnostic_service import apply_diagnostic

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


async def run_benchmark(session_id: UUID, db: AsyncSession) -> BenchmarkResult:
    result = await db.execute(select(BenchmarkSession).where(BenchmarkSession.id == session_id))
    session = result.scalar_one()

    turns_result = await db.execute(
        select(BenchmarkTurn)
        .where(BenchmarkTurn.session_id == session_id)
        .order_by(BenchmarkTurn.turn_number)
    )
    turns = turns_result.scalars().all()

    conversation_history = [
        {"role": "user" if turn.speaker == "student" else "assistant", "content": turn.text}
        for turn in turns
    ]

    student = session.student
    student_name = student.name if student else "Student"
    student_age = (student.grade + 5) if student else 10
    student_grade = str(student.grade) if student else ""

    benchmark_data = await claude_service.generate_benchmark(
        student_name=student_name,
        age=student_age,
        grade=student_grade,
        character=session.character,
        conversation_history=conversation_history,
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
        conversation_snapshot=conversation_history,
        bkt_seeded="pending",
    )

    session.status = "benchmark_ready"
    session.ended_at = datetime.now(timezone.utc)

    db.add(benchmark)
    await db.commit()
    await db.refresh(benchmark)

    # Seed BKT states from benchmark results
    if student:
        try:
            overrides = {}
            for cap_id, stage in capability_stages.items():
                if stage is None:
                    continue
                competency_ids = CAPABILITY_TO_COMPETENCY_PREFIX.get(cap_id, [])
                for cid in competency_ids:
                    overrides[cid] = stage

            diagnostic_profile = {
                "pillar_stages": pillar_stages,
                "overrides": overrides,
            }

            await apply_diagnostic(db, student.id, diagnostic_profile)
            benchmark.bkt_seeded = "done"
            await db.commit()
            logger.info("BKT states seeded from benchmark for student %s", student.id)
        except Exception as e:
            logger.error("Failed to seed BKT from benchmark: %s", e)
            benchmark.bkt_seeded = "failed"
            await db.commit()

    return benchmark
