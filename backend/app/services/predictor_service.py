"""
Rule-based curriculum predictor (Phase 1 MVP).

Scoring function:
  Score(activity, student) = Σ(competency_gap × expected_gain × prerequisite_met)
  across all primary + secondary competencies

Also provides BKT-driven question selection targeting the zone of proximal development.
"""

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competency import Competency
from app.models.curriculum import Activity, Question
from app.models.curriculum_topic import CurriculumTopic, TopicCompetencyMap
from app.models.student import StudentCompetencyState


@dataclass
class ScoredActivity:
    activity_id: str
    activity_name: str
    module_id: str
    score: float
    reasons: list[str]


async def get_next_activity(
    db: AsyncSession,
    student_id: uuid.UUID,
    module_id: str | None = None,
    limit: int = 5,
) -> list[ScoredActivity]:
    """
    Score all available activities for a student and return top recommendations.

    Score(activity, student) = Σ(competency_gap × expected_gain × prerequisite_met)
    """
    # Load student states
    result = await db.execute(
        select(StudentCompetencyState).where(StudentCompetencyState.student_id == student_id)
    )
    states = {s.competency_id: s for s in result.scalars().all()}
    if not states:
        return []

    # Load activities
    query = select(Activity)
    if module_id:
        query = query.where(Activity.module_id == module_id)
    activities = (await db.execute(query)).scalars().all()

    scored: list[ScoredActivity] = []
    for activity in activities:
        score, reasons = _score_activity(activity, states)
        if score > 0:
            scored.append(ScoredActivity(
                activity_id=activity.id,
                activity_name=activity.name,
                module_id=activity.module_id,
                score=round(score, 4),
                reasons=reasons,
            ))

    scored.sort(key=lambda x: x.score, reverse=True)
    return scored[:limit]


def _score_activity(
    activity: Activity,
    states: dict[str, StudentCompetencyState],
) -> tuple[float, list[str]]:
    """Compute activity score for a given student's state."""
    total_score = 0.0
    reasons: list[str] = []

    # Check prerequisites
    prereqs = activity.prerequisites or []
    for prereq in prereqs:
        cid = prereq.get("competency_id") or prereq.get("competencyId")
        min_stage = prereq.get("min_stage") or prereq.get("minStage", 2)
        if cid and cid in states:
            if states[cid].stage < min_stage:
                reasons.append(f"Prereq not met: {cid} at stage {states[cid].stage} (needs {min_stage})")
                return 0.0, reasons  # Skip if any prerequisite not met

    # Score primary competencies
    primary = activity.primary_competencies or []
    for comp in primary:
        cid = comp.get("competency_id") or comp.get("competencyId")
        gain = comp.get("expected_gain") or comp.get("expectedGain", 0.1)
        if cid and cid in states:
            state = states[cid]
            gap = 1.0 - state.p_learned  # how far from mastery
            contribution = gap * gain
            total_score += contribution
            if contribution > 0.01:
                reasons.append(f"{cid}: gap={gap:.2f} × gain={gain:.2f} = {contribution:.3f}")

    # Score secondary competencies (half weight)
    secondary = activity.secondary_competencies or []
    for comp in secondary:
        cid = comp.get("competency_id") or comp.get("competencyId")
        gain = comp.get("expected_gain") or comp.get("expectedGain", 0.05)
        if cid and cid in states:
            state = states[cid]
            gap = 1.0 - state.p_learned
            contribution = gap * gain * 0.5
            total_score += contribution

    return total_score, reasons


async def get_recommended_topics(
    db: AsyncSession,
    student_id: uuid.UUID,
    board: str,
    grade: int,
    subject: str | None = None,
    limit: int = 5,
) -> list[dict]:
    """
    BKT-driven topic recommendations.

    Score(topic) = Σ((1 - p_learned) × relevance) across mapped competencies.
    Higher score = topic targets weaker skills = higher priority.
    """
    # Load student's competency states
    result = await db.execute(
        select(StudentCompetencyState).where(StudentCompetencyState.student_id == student_id)
    )
    states = {s.competency_id: s for s in result.scalars().all()}
    if not states:
        return []

    # Load topics for this board + grade
    topic_query = select(CurriculumTopic).where(
        CurriculumTopic.board == board,
        CurriculumTopic.grade == grade,
    )
    if subject:
        topic_query = topic_query.where(CurriculumTopic.subject == subject)
    topics = {t.id: t for t in (await db.execute(topic_query)).scalars().all()}
    if not topics:
        return []

    # Load all mappings for these topics
    maps_result = await db.execute(
        select(TopicCompetencyMap, Competency.name)
        .join(Competency, TopicCompetencyMap.competency_id == Competency.id)
        .where(TopicCompetencyMap.topic_id.in_(topics.keys()))
    )
    mappings = maps_result.all()

    # Group mappings by topic
    topic_mappings: dict[str, list] = {}
    for row in mappings:
        m = row.TopicCompetencyMap
        comp_name = row.name
        topic_mappings.setdefault(m.topic_id, []).append((m, comp_name))

    # Score each topic
    scored = []
    for topic_id, topic in topics.items():
        topic_maps = topic_mappings.get(topic_id, [])
        if not topic_maps:
            continue

        score = 0.0
        weak_comps = []
        for m, comp_name in topic_maps:
            state = states.get(m.competency_id)
            p_l = state.p_learned if state else 0.10
            stage = state.stage if state else 1
            gap = 1.0 - p_l
            contribution = gap * m.relevance
            score += contribution
            if gap > 0.2:  # only show notably weak competencies
                weak_comps.append({
                    "competency_id": m.competency_id,
                    "name": comp_name,
                    "p_learned": round(p_l, 3),
                    "stage": stage,
                    "relevance": m.relevance,
                })

        if score > 0:
            from app.schemas.curriculum_topic import CurriculumTopicOut

            scored.append({
                "topic": CurriculumTopicOut.model_validate(topic),
                "score": round(score, 4),
                "weak_competencies": sorted(weak_comps, key=lambda x: x["p_learned"]),
            })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


async def get_next_questions(
    db: AsyncSession,
    student_id: uuid.UUID,
    competency_id: str,
    count: int = 5,
    module_id: str | None = None,
) -> list[Question]:
    """
    Select questions targeting the student's zone of proximal development.

    - ZPD: P(L) 0.3-0.7 → select questions matching student's level
    - Too easy (P(L) > 0.85) → harder questions
    - Too hard (P(L) < 0.2) → easier questions
    """
    # Get student's state for this competency
    result = await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id == student_id,
            StudentCompetencyState.competency_id == competency_id,
        )
    )
    state = result.scalar_one_or_none()
    p_l = state.p_learned if state else 0.10

    # Map P(L) to target difficulty range
    if p_l > 0.85:
        # Mastered — challenge questions
        diff_min, diff_max = 0.6, 1.0
    elif p_l > 0.65:
        # Proficient
        diff_min, diff_max = 0.5, 0.8
    elif p_l > 0.40:
        # Developing — ZPD sweet spot
        diff_min, diff_max = 0.3, 0.6
    elif p_l > 0.20:
        # Emerging
        diff_min, diff_max = 0.2, 0.5
    else:
        # Novice — easy questions
        diff_min, diff_max = 0.1, 0.4

    # Query questions in the target difficulty range
    query = (
        select(Question)
        .where(
            Question.competency_id == competency_id,
            Question.difficulty >= diff_min,
            Question.difficulty <= diff_max,
        )
        .order_by(Question.difficulty)
        .limit(count)
    )
    if module_id:
        query = query.where(Question.module_id == module_id)

    result = await db.execute(query)
    questions = list(result.scalars().all())

    # If not enough questions in the target range, expand with closest-to-target
    if len(questions) < count:
        target_center = (diff_min + diff_max) / 2.0
        fallback = (
            select(Question)
            .where(
                Question.competency_id == competency_id,
                Question.id.notin_([q.id for q in questions]) if questions else True,
            )
            .order_by(func.abs(Question.difficulty - target_center))
            .limit(count - len(questions))
        )
        if module_id:
            fallback = fallback.where(Question.module_id == module_id)
        more = (await db.execute(fallback)).scalars().all()
        questions.extend(more)

    return questions
