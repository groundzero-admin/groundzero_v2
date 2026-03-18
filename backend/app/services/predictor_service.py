"""
Graph-aware curriculum predictor.

Uses the prerequisite graph to find the student's learning frontier —
skills where prerequisites are met but the skill itself needs work.
Also provides ZPD-based question selection and topic recommendations.
"""

import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_question import ActivityQuestion
from app.models.competency import Competency
from app.models.curriculum import Activity, Question
from app.models.curriculum_topic import CurriculumTopic, TopicCompetencyMap
from app.models.question_template import QuestionTemplate
from app.models.skill_graph import PrerequisiteEdge
from app.models.student import Student, StudentCompetencyState


@dataclass
class ScoredActivity:
    activity_id: str
    activity_name: str
    module_id: str
    score: float
    reasons: list[str]


@dataclass
class FrontierSkill:
    competency_id: str
    competency_name: str
    p_learned: float
    stage: int
    priority: float  # higher = should work on this first
    reasons: list[str] = field(default_factory=list)


# Minimum stage a prerequisite needs to be at before the dependent is "ready"
_PREREQ_READY_STAGE = 3  # Developing


async def get_skill_frontier(
    db: AsyncSession,
    student_id: uuid.UUID,
    limit: int = 10,
) -> list[FrontierSkill]:
    """
    Find the student's learning frontier using the prerequisite graph.

    A skill is on the frontier if:
    1. It's not yet mastered (stage < 5)
    2. All its prerequisites are at least Developing (stage >= 3)

    Skills are prioritized by:
    - Decaying skills (haven't been practiced recently, P(L) dropping)
    - Stuck skills (consecutive failures >= 4)
    - Skills closest to the next stage transition
    - Skills with more prerequisites met (deeper in the graph = more advanced)

    Skills with unmet prerequisites are excluded — the student isn't ready.
    """
    # Load student + states
    student = (await db.execute(
        select(Student).where(Student.id == student_id)
    )).scalar_one_or_none()
    if not student:
        return []

    result = await db.execute(
        select(StudentCompetencyState).where(StudentCompetencyState.student_id == student_id)
    )
    states = {s.competency_id: s for s in result.scalars().all()}
    if not states:
        return []

    # Load competency names
    comp_result = await db.execute(select(Competency))
    comp_names = {c.id: c.name for c in comp_result.scalars().all()}

    # Load prerequisite graph
    edge_result = await db.execute(select(PrerequisiteEdge))
    edges = edge_result.scalars().all()

    # Build adjacency: target -> list of source (prerequisites)
    prereqs_of: dict[str, list[str]] = defaultdict(list)
    # Build reverse: source -> list of targets (dependents)
    dependents_of: dict[str, list[str]] = defaultdict(list)
    for e in edges:
        prereqs_of[e.target_id].append(e.source_id)
        dependents_of[e.source_id].append(e.target_id)

    now = datetime.utcnow()
    frontier: list[FrontierSkill] = []

    for cid, state in states.items():
        # Skip already mastered
        if state.stage >= 5:
            continue

        # Check if all prerequisites are met
        prereq_ids = prereqs_of.get(cid, [])
        prereqs_met = True
        unmet = []
        for pid in prereq_ids:
            pstate = states.get(pid)
            if pstate is None or pstate.stage < _PREREQ_READY_STAGE:
                prereqs_met = False
                pstage = pstate.stage if pstate else 0
                unmet.append(f"{pid} at stage {pstage}")

        if not prereqs_met:
            continue

        # This skill is on the frontier — compute priority
        reasons = []
        priority = 0.0

        # Factor 1: ZPD targeting
        # Skills in the learning zone (0.20-0.70) get highest priority.
        # Below 0.20 with no evidence = not started yet (lower priority).
        # Above 0.70 = almost there, less urgent.
        p_l = state.p_learned
        if 0.20 <= p_l <= 0.70:
            # Sweet spot — actively learning
            priority += 2.0
            reasons.append(f"in learning zone (P(L)={p_l:.0%})")
        elif p_l < 0.20 and state.total_evidence > 0:
            # Tried but struggling — needs help
            priority += 1.5
            reasons.append(f"struggling (P(L)={p_l:.0%} with {state.total_evidence} attempts)")
        elif p_l < 0.20:
            # Not started — available but not urgent
            priority += 0.5
            reasons.append("not started yet")
        else:
            # 0.70-0.85 — close to mastery, small push
            priority += 1.0

        # Factor 2: Stuck bonus (urgent — needs intervention)
        if state.is_stuck:
            priority += 3.0
            reasons.append("stuck (4+ consecutive failures)")

        # Factor 3: Decay urgency (skill is fading)
        if state.last_evidence_at:
            days_since = (now - state.last_evidence_at).total_seconds() / 86400.0
            if days_since > state.stability:
                # Decayed past half-life — urgent
                priority += 1.5
                reasons.append(f"decaying ({days_since:.0f}d since last practice, half-life={state.stability:.0f}d)")
            elif days_since > state.stability * 0.5:
                priority += 0.5
                reasons.append(f"needs review ({days_since:.0f}d since last practice)")

        # Factor 4: Graph depth bonus (prefer skills with more met prereqs)
        # Skills deeper in the graph are more advanced and more impactful
        if len(prereq_ids) > 0:
            priority += len(prereq_ids) * 0.2

        frontier.append(FrontierSkill(
            competency_id=cid,
            competency_name=comp_names.get(cid, cid),
            p_learned=round(state.p_learned, 4),
            stage=state.stage,
            priority=round(priority, 3),
            reasons=reasons,
        ))

    frontier.sort(key=lambda x: x.priority, reverse=True)
    return frontier[:limit]


async def get_next_activity(
    db: AsyncSession,
    student_id: uuid.UUID,
    module_id: str | None = None,
    limit: int = 5,
) -> list[ScoredActivity]:
    """
    Score all available activities for a student and return top recommendations.

    Uses both activity-level prerequisites AND the skill graph to ensure
    the student is ready for the activity's target competencies.
    """
    # Load student states
    result = await db.execute(
        select(StudentCompetencyState).where(StudentCompetencyState.student_id == student_id)
    )
    states = {s.competency_id: s for s in result.scalars().all()}
    if not states:
        return []

    # Load prerequisite graph for graph-level gating
    edge_result = await db.execute(select(PrerequisiteEdge))
    prereqs_of: dict[str, list[str]] = defaultdict(list)
    for e in edge_result.scalars().all():
        prereqs_of[e.target_id].append(e.source_id)

    # Load activities
    query = select(Activity)
    if module_id:
        query = query.where(Activity.module_id == module_id)
    activities = (await db.execute(query)).scalars().all()

    scored: list[ScoredActivity] = []
    for activity in activities:
        score, reasons = _score_activity(activity, states, prereqs_of)
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
    prereqs_of: dict[str, list[str]] | None = None,
) -> tuple[float, list[str]]:
    """Compute activity score for a given student's state.

    Two levels of prerequisite checking:
    1. Activity-level: explicit prerequisites on the activity record
    2. Graph-level: prerequisite edges for the activity's target competencies
    """
    total_score = 0.0
    reasons: list[str] = []

    # Check activity-level prerequisites
    prereqs = activity.prerequisites or []
    for prereq in prereqs:
        cid = prereq.get("competency_id") or prereq.get("competencyId")
        min_stage = prereq.get("min_stage") or prereq.get("minStage", 2)
        if cid and cid in states:
            if states[cid].stage < min_stage:
                reasons.append(f"Prereq not met: {cid} at stage {states[cid].stage} (needs {min_stage})")
                return 0.0, reasons

    # Check graph-level prerequisites for target competencies
    if prereqs_of:
        all_targets = []
        for comp in (activity.primary_competencies or []):
            cid = comp.get("competency_id") or comp.get("competencyId")
            if cid:
                all_targets.append(cid)
        for target_cid in all_targets:
            for prereq_cid in prereqs_of.get(target_cid, []):
                pstate = states.get(prereq_cid)
                if pstate and pstate.stage < _PREREQ_READY_STAGE:
                    reasons.append(f"Graph prereq not ready: {prereq_cid} at stage {pstate.stage} (needs {_PREREQ_READY_STAGE})")
                    return 0.0, reasons

    # Score primary competencies
    primary = activity.primary_competencies or []
    for comp in primary:
        cid = comp.get("competency_id") or comp.get("competencyId")
        gain = comp.get("expected_gain") or comp.get("expectedGain", 0.1)
        if cid and cid in states:
            state = states[cid]
            gap = 1.0 - state.p_learned
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
    count: int = 1,
    module_id: str | None = None,
) -> list[Question]:
    """
    Pick the next question(s) for a student in the zone of proximal development.

    1. Read student's P(L) for the competency
    2. Map P(L) to a difficulty range (ZPD targeting)
    3. Exclude questions the student already answered (via evidence_events)
    4. Pick randomly from the ZPD range
    5. Fallback to closest-difficulty if ZPD range is exhausted
    """
    from app.models.evidence import EvidenceEvent

    # 1. Get student's mastery for this competency
    result = await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id == student_id,
            StudentCompetencyState.competency_id == competency_id,
        )
    )
    state = result.scalar_one_or_none()
    p_l = state.p_learned if state else 0.10

    # 2. Map P(L) to target difficulty range
    if p_l > 0.85:
        diff_min, diff_max = 0.6, 1.0
    elif p_l > 0.65:
        diff_min, diff_max = 0.5, 0.8
    elif p_l > 0.40:
        diff_min, diff_max = 0.3, 0.6
    elif p_l > 0.20:
        diff_min, diff_max = 0.2, 0.5
    else:
        diff_min, diff_max = 0.1, 0.4

    # 3. Find question IDs the student already answered for this competency
    answered_result = await db.execute(
        select(EvidenceEvent.meta["questionId"].astext)
        .where(
            EvidenceEvent.student_id == student_id,
            EvidenceEvent.competency_id == competency_id,
            EvidenceEvent.source == "mcq",
            EvidenceEvent.meta["questionId"].astext.isnot(None),
        )
    )
    answered_ids = []
    for row in answered_result.scalars().all():
        if row:
            try:
                answered_ids.append(uuid.UUID(row))
            except ValueError:
                pass

    # 4. Query questions in ZPD range, excluding answered, randomized
    query = (
        select(Question)
        .where(
            Question.competency_id == competency_id,
            Question.difficulty >= diff_min,
            Question.difficulty <= diff_max,
        )
        .order_by(func.random())
        .limit(count)
    )
    if module_id:
        query = query.where(Question.module_id == module_id)
    if answered_ids:
        query = query.where(Question.id.notin_(answered_ids))

    result = await db.execute(query)
    questions = list(result.scalars().all())

    # 5. Fallback: if ZPD range exhausted, pick closest unanswered question
    if len(questions) < count:
        target_center = (diff_min + diff_max) / 2.0
        already = [q.id for q in questions] + answered_ids
        fallback = (
            select(Question)
            .where(
                Question.competency_id == competency_id,
                Question.id.notin_(already) if already else True,
            )
            .order_by(func.abs(Question.difficulty - target_center))
            .limit(count - len(questions))
        )
        if module_id:
            fallback = fallback.where(Question.module_id == module_id)
        more = (await db.execute(fallback)).scalars().all()
        questions.extend(more)

    return questions


@dataclass
class NextQuestionResult:
    question: Question
    competency_id: str
    competency_name: str
    p_learned: float
    stage: int


@dataclass
class NextActivityQuestionResult:
    activity_question_id: uuid.UUID
    template_slug: str
    title: str
    data: dict
    competency_id: str
    competency_name: str
    difficulty: float
    p_learned: float
    stage: int


async def _auto_promote(
    db: AsyncSession,
    student_id: uuid.UUID,
    comp_ids: list[str],
    states: dict[str, StudentCompetencyState],
) -> list[str]:
    """
    For each mastered competency, follow prerequisite edges to find the next
    grade-level node in the same skill family (e.g. C4.14.6 -> C4.14.7).
    Returns additional competency IDs to include as candidates.
    """
    mastered = [cid for cid in comp_ids if cid in states and states[cid].stage >= 5]
    if not mastered:
        return []

    # Load outgoing edges from mastered nodes
    edge_result = await db.execute(
        select(PrerequisiteEdge).where(PrerequisiteEdge.source_id.in_(mastered))
    )
    edges = edge_result.scalars().all()

    promoted: list[str] = []
    for edge in edges:
        target = edge.target_id
        # Only promote within same skill family (e.g. C4.14.x -> C4.14.y)
        source_family = edge.source_id.rsplit(".", 1)[0]  # "C4.14"
        target_family = target.rsplit(".", 1)[0]
        if source_family != target_family:
            continue
        if target in comp_ids:
            continue  # already in the pool
        promoted.append(target)

    if not promoted:
        return []

    # Load states for promoted competencies (may not exist yet)
    promoted_states_result = await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id == student_id,
            StudentCompetencyState.competency_id.in_(promoted),
        )
    )
    for s in promoted_states_result.scalars().all():
        states[s.competency_id] = s

    return promoted


async def get_next_question_for_activity(
    db: AsyncSession,
    student_id: uuid.UUID,
    activity_id: str,
) -> NextQuestionResult | None:
    """
    Pick the single best next question for a student in an activity.

    1. Load the activity's target competencies
    2. Auto-promote: if a competency is mastered, add next grade-level node
    3. Load student's state for each
    4. Pick the best competency (lowest mastery that isn't mastered)
    5. Pick a ZPD question for that competency (excluding already answered)
    6. Return question + context
    """
    from app.models.evidence import EvidenceEvent

    # 1. Load activity
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        return None

    # Collect primary target competency IDs only
    comp_ids = []
    for comp in (activity.primary_competencies or []):
        cid = comp.get("competency_id") or comp.get("competencyId")
        if cid:
            comp_ids.append(cid)

    if not comp_ids:
        return None

    # 2. Load student states for these competencies
    states_result = await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id == student_id,
            StudentCompetencyState.competency_id.in_(comp_ids),
        )
    )
    states = {s.competency_id: s for s in states_result.scalars().all()}

    # 3. Auto-promote: for mastered competencies, add next grade-level node
    promoted = await _auto_promote(db, student_id, comp_ids, states)
    comp_ids = comp_ids + promoted

    # Load competency names for all (original + promoted)
    comp_result = await db.execute(
        select(Competency).where(Competency.id.in_(comp_ids))
    )
    comp_names = {c.id: c.name for c in comp_result.scalars().all()}

    # 4. Pick the best competency: lowest P(L) that isn't mastered (stage < 5)
    #    Round-robin tiebreaker: use evidence count to spread practice
    best_cid = None
    best_score = float("inf")
    for cid in comp_ids:
        state = states.get(cid)
        if state and state.stage >= 5:
            continue  # skip mastered
        p_l = state.p_learned if state else 0.10
        evidence_count = state.total_evidence if state else 0
        # Lower P(L) = higher priority. Tiebreak by fewer attempts.
        score = p_l + (evidence_count * 0.001)
        if score < best_score:
            best_score = score
            best_cid = cid

    if not best_cid:
        # All mastered — pick the one with lowest P(L) anyway for maintenance
        best_cid = min(comp_ids, key=lambda c: (states[c].p_learned if c in states else 0.10))

    # 5. Pick a ZPD question for this competency
    questions = await get_next_questions(db, student_id, best_cid, count=1)
    if not questions:
        # Try other competencies as fallback
        for cid in comp_ids:
            if cid == best_cid:
                continue
            questions = await get_next_questions(db, student_id, cid, count=1)
            if questions:
                best_cid = cid
                break

    if not questions:
        return None

    state = states.get(best_cid)
    return NextQuestionResult(
        question=questions[0],
        competency_id=best_cid,
        competency_name=comp_names.get(best_cid, best_cid),
        p_learned=round(state.p_learned, 4) if state else 0.10,
        stage=state.stage if state else 1,
    )


async def get_next_activity_question(
    db: AsyncSession,
    student_id: uuid.UUID,
    activity_id: str,
) -> "NextActivityQuestionResult | None":
    """
    ZPD-based selection from activity_questions table for a given activity.

    Same competency selection logic as get_next_question_for_activity,
    but queries activity_questions instead of questions.
    """
    from app.models.evidence import EvidenceEvent

    # Load activity + target competencies
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        return None

    comp_ids = []
    for comp in (activity.primary_competencies or []):
        cid = comp.get("competency_id") or comp.get("competencyId")
        if cid:
            comp_ids.append(cid)
    if not comp_ids:
        return None

    # Load student states
    states_result = await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id == student_id,
            StudentCompetencyState.competency_id.in_(comp_ids),
        )
    )
    states = {s.competency_id: s for s in states_result.scalars().all()}

    # Auto-promote mastered competencies
    promoted = await _auto_promote(db, student_id, comp_ids, states)
    comp_ids = comp_ids + promoted

    # ── ZPD Prerequisite Gate ──
    # For each candidate competency, check if direct prerequisites have p_learned >= 0.5.
    # If not met, remove the competency from candidates and add the blocking prereq instead.
    # This ensures the system serves the right level automatically.
    prereq_edge_result = await db.execute(
        select(PrerequisiteEdge).where(PrerequisiteEdge.target_id.in_(comp_ids))
    )
    prereq_edges_for_gate = prereq_edge_result.scalars().all()

    # Build map: target_id -> [source_ids]
    prereqs_of_candidate: dict[str, list[str]] = defaultdict(list)
    for edge in prereq_edges_for_gate:
        prereqs_of_candidate[edge.target_id].append(edge.source_id)

    # Collect all prereq IDs we might need states for
    all_prereq_ids = [pid for pids in prereqs_of_candidate.values() for pid in pids]
    missing_ids = [pid for pid in all_prereq_ids if pid not in states]
    if missing_ids:
        missing_result = await db.execute(
            select(StudentCompetencyState).where(
                StudentCompetencyState.student_id == student_id,
                StudentCompetencyState.competency_id.in_(missing_ids),
            )
        )
        for s in missing_result.scalars().all():
            states[s.competency_id] = s

    gated_out: set[str] = set()
    gate_replacements: list[str] = []
    for cid in comp_ids:
        for prereq_id in prereqs_of_candidate.get(cid, []):
            prereq_state = states.get(prereq_id)
            prereq_p_l = prereq_state.p_learned if prereq_state else 0.0
            if prereq_p_l < 0.5:
                gated_out.add(cid)
                if prereq_id not in comp_ids and prereq_id not in gate_replacements:
                    gate_replacements.append(prereq_id)
                break  # one unmet prereq is enough to gate

    if gated_out:
        comp_ids = [cid for cid in comp_ids if cid not in gated_out] + gate_replacements
        # Load states and names for newly added prereq replacements
        new_ids = [pid for pid in gate_replacements if pid not in states]
        if new_ids:
            new_states_result = await db.execute(
                select(StudentCompetencyState).where(
                    StudentCompetencyState.student_id == student_id,
                    StudentCompetencyState.competency_id.in_(new_ids),
                )
            )
            for s in new_states_result.scalars().all():
                states[s.competency_id] = s

    if not comp_ids:
        return None

    # Load competency names
    comp_result = await db.execute(select(Competency).where(Competency.id.in_(comp_ids)))
    comp_names = {c.id: c.name for c in comp_result.scalars().all()}

    # Pick best competency (lowest P(L), not mastered)
    best_cid = None
    best_score = float("inf")
    for cid in comp_ids:
        state = states.get(cid)
        if state and state.stage >= 5:
            continue
        p_l = state.p_learned if state else 0.10
        evidence_count = state.total_evidence if state else 0
        score = p_l + (evidence_count * 0.001)
        if score < best_score:
            best_score = score
            best_cid = cid

    if not best_cid:
        best_cid = min(comp_ids, key=lambda c: (states[c].p_learned if c in states else 0.10))

    # ZPD difficulty range from P(L)
    state = states.get(best_cid)
    p_l = state.p_learned if state else 0.10
    if p_l > 0.85:
        diff_min, diff_max = 0.6, 1.0
    elif p_l > 0.65:
        diff_min, diff_max = 0.5, 0.8
    elif p_l > 0.40:
        diff_min, diff_max = 0.3, 0.6
    elif p_l > 0.20:
        diff_min, diff_max = 0.2, 0.5
    else:
        diff_min, diff_max = 0.1, 0.4

    # Already-answered activity question IDs
    answered_result = await db.execute(
        select(EvidenceEvent.meta["activityQuestionId"].astext)
        .where(
            EvidenceEvent.student_id == student_id,
            EvidenceEvent.competency_id == best_cid,
            EvidenceEvent.meta["activityQuestionId"].astext.isnot(None),
        )
    )
    answered_ids = []
    for row in answered_result.scalars().all():
        if row:
            try:
                answered_ids.append(uuid.UUID(row))
            except ValueError:
                pass

    # Query activity_questions with ZPD difficulty, excluding answered
    query = (
        select(ActivityQuestion, QuestionTemplate.slug.label("slug"))
        .outerjoin(QuestionTemplate, ActivityQuestion.template_id == QuestionTemplate.id)
        .where(
            ActivityQuestion.competency_id == best_cid,
            ActivityQuestion.is_published == True,
            ActivityQuestion.difficulty >= diff_min,
            ActivityQuestion.difficulty <= diff_max,
        )
        .order_by(func.random())
        .limit(1)
    )
    if answered_ids:
        query = query.where(ActivityQuestion.id.notin_(answered_ids))

    row = (await db.execute(query)).first()

    # Fallback: any published question for this competency
    if not row:
        fallback = (
            select(ActivityQuestion, QuestionTemplate.slug.label("slug"))
            .outerjoin(QuestionTemplate, ActivityQuestion.template_id == QuestionTemplate.id)
            .where(
                ActivityQuestion.competency_id == best_cid,
                ActivityQuestion.is_published == True,
            )
            .order_by(func.random())
            .limit(1)
        )
        row = (await db.execute(fallback)).first()

    if not row:
        return None

    aq, slug = row
    return NextActivityQuestionResult(
        activity_question_id=aq.id,
        template_slug=slug or "mcq_single",
        title=aq.title,
        data=aq.data,
        competency_id=best_cid,
        competency_name=comp_names.get(best_cid, best_cid),
        difficulty=aq.difficulty,
        p_learned=round(p_l, 4),
        stage=state.stage if state else 1,
    )


async def get_next_question_for_topic(
    db: AsyncSession,
    student_id: uuid.UUID,
    topic_id: str,
) -> NextQuestionResult | None:
    """
    Pick the single best next question for a student practicing a curriculum topic.

    Same logic as activity-based, but competencies come from topic-competency mappings
    instead of activity targets.
    """
    # Load topic's competency mappings (sorted by relevance)
    maps_result = await db.execute(
        select(TopicCompetencyMap)
        .where(TopicCompetencyMap.topic_id == topic_id)
        .order_by(TopicCompetencyMap.relevance.desc())
    )
    mappings = maps_result.scalars().all()
    if not mappings:
        return None

    comp_ids = [m.competency_id for m in mappings]

    # Load student states
    states_result = await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id == student_id,
            StudentCompetencyState.competency_id.in_(comp_ids),
        )
    )
    states = {s.competency_id: s for s in states_result.scalars().all()}

    # Load competency names
    comp_result = await db.execute(
        select(Competency).where(Competency.id.in_(comp_ids))
    )
    comp_names = {c.id: c.name for c in comp_result.scalars().all()}

    # Pick best competency: lowest P(L), not mastered
    best_cid = None
    best_score = float("inf")
    for cid in comp_ids:
        state = states.get(cid)
        if state and state.stage >= 5:
            continue
        p_l = state.p_learned if state else 0.10
        evidence_count = state.total_evidence if state else 0
        score = p_l + (evidence_count * 0.001)
        if score < best_score:
            best_score = score
            best_cid = cid

    if not best_cid:
        best_cid = min(comp_ids, key=lambda c: (states[c].p_learned if c in states else 0.10))

    # Pick ZPD question
    questions = await get_next_questions(db, student_id, best_cid, count=1)
    if not questions:
        for cid in comp_ids:
            if cid == best_cid:
                continue
            questions = await get_next_questions(db, student_id, cid, count=1)
            if questions:
                best_cid = cid
                break

    if not questions:
        return None

    state = states.get(best_cid)
    return NextQuestionResult(
        question=questions[0],
        competency_id=best_cid,
        competency_name=comp_names.get(best_cid, best_cid),
        p_learned=round(state.p_learned, 4) if state else 0.10,
        stage=state.stage if state else 1,
    )
