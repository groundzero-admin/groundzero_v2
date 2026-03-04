from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.plugins.benchmark.models import BenchmarkResult, BenchmarkSession, BenchmarkTurn
from app.plugins.benchmark.services import claude_service


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

    benchmark_data = await claude_service.generate_benchmark(
        student_name=session.student_name,
        age=session.student_age or 10,
        grade=session.student_grade or "",
        character=session.character,
        conversation_history=conversation_history,
    )

    scores = benchmark_data.get("scores", {})
    insights = benchmark_data.get("insights", {})

    benchmark = BenchmarkResult(
        session_id=session_id,
        score_curiosity=scores.get("curiosity", 0),
        score_critical_thinking=scores.get("critical_thinking", 0),
        score_mathematical_thinking=scores.get("mathematical_thinking", 0),
        score_knowledge_depth=scores.get("knowledge_depth", 0),
        score_communication=scores.get("communication", 0),
        score_creativity=scores.get("creativity", 0),
        score_emotional_intelligence=scores.get("emotional_intelligence", 0),
        score_leadership=scores.get("leadership", 0),
        strongest_areas=insights.get("strongest_areas", []),
        growth_areas=insights.get("growth_areas", []),
        dominant_interests=insights.get("dominant_interests", []),
        learning_style=insights.get("learning_style"),
        engagement_level=insights.get("engagement_level"),
        notable_observations=insights.get("notable_observations", []),
        curriculum_signals=benchmark_data.get("curriculum_signals", {}),
        summary=benchmark_data.get("summary", ""),
        conversation_snapshot=conversation_history,
    )

    session.status = "benchmark_ready"
    session.ended_at = datetime.now(timezone.utc)

    db.add(benchmark)
    await db.commit()
    await db.refresh(benchmark)
    return benchmark
