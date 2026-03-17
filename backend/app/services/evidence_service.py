"""Process evidence events → run BKT engine → persist updated state."""

import uuid
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.bkt import BKTEngine, SOURCE_WEIGHTS
from app.engine.propagation import build_prerequisite_ancestor_map
from app.engine.types import BKTUpdateResult, CompetencyState, EvidenceInput
from app.models.activity_question import ActivityQuestion
from app.models.evidence import EvidenceEvent
from app.models.question_template import QuestionTemplate
from app.models.skill_graph import PrerequisiteEdge
from app.models.student import StudentCompetencyState
from app.schemas.evidence import EvidenceCreate
from app.services import question_evaluator

logger = logging.getLogger(__name__)

engine = BKTEngine()


def _db_state_to_engine(s: StudentCompetencyState) -> CompetencyState:
    """Convert DB model → engine dataclass."""
    return CompetencyState(
        competency_id=s.competency_id,
        p_learned=s.p_learned,
        p_guess=s.p_guess,
        p_slip=s.p_slip,
        p_transit=s.p_transit,
        total_evidence=s.total_evidence,
        positive_evidence=0,  # not tracked in DB currently
        consecutive_failures=s.consecutive_failures,
        is_stuck=s.is_stuck,
        last_evidence_at=s.last_evidence_at,
        stability=s.stability,
        avg_response_time_ms=s.avg_response_time_ms,
        stage=s.stage,
        confidence=s.confidence,
    )


def _apply_engine_state_to_db(db_state: StudentCompetencyState, engine_state: CompetencyState) -> None:
    """Copy engine state back to DB model."""
    db_state.p_learned = engine_state.p_learned
    db_state.p_guess = engine_state.p_guess
    db_state.p_slip = engine_state.p_slip
    db_state.p_transit = engine_state.p_transit
    db_state.total_evidence = engine_state.total_evidence
    db_state.consecutive_failures = engine_state.consecutive_failures
    db_state.is_stuck = engine_state.is_stuck
    db_state.last_evidence_at = engine_state.last_evidence_at
    db_state.stability = engine_state.stability
    db_state.avg_response_time_ms = engine_state.avg_response_time_ms
    db_state.stage = engine_state.stage
    db_state.confidence = engine_state.confidence


async def process_evidence(
    db: AsyncSession, data: EvidenceCreate
) -> tuple[EvidenceEvent, list[BKTUpdateResult], str | None]:
    """
    Process an evidence event:
    1. If activity_question_id provided, evaluate response → derive outcome + source
    2. Persist the event
    3. Load student state + prerequisite edges
    4. Run BKT engine (includes FIRe decay clock reset)
    5. Persist updated state(s)
    """
    feedback: str | None = None

    # ── Evaluate activity question response if provided ──
    if data.activity_question_id and data.response is not None:
        aq = await db.get(ActivityQuestion, data.activity_question_id)
        if aq:
            tmpl = await db.get(QuestionTemplate, aq.template_id)
            slug = tmpl.slug if tmpl else "mcq_single"
            try:
                from app.config import Settings
                from openai import AsyncOpenAI
                settings = Settings()
                spark_client = AsyncOpenAI(
                    api_key=settings.SPARK_API_KEY,
                    base_url=settings.SPARK_BASE_URL,
                )
                outcome, source, feedback = await question_evaluator.evaluate(
                    slug, aq.data, data.response,
                    spark_client=spark_client,
                    spark_model=settings.SPARK_MODEL,
                )
            except Exception:
                logger.exception("Evaluator failed for aq=%s", data.activity_question_id)
                outcome, source, feedback = 0.5, "mcq", "Answer recorded."
            # Override outcome + source from evaluation
            data = data.model_copy(update={"outcome": outcome, "source": source})

    # Determine weight
    weight = data.weight if data.weight is not None else SOURCE_WEIGHTS.get(data.source, 0.7)

    # Build meta dict from optional fields
    meta = {}
    if data.question_id is not None:
        meta["questionId"] = str(data.question_id)
    if data.activity_question_id is not None:
        meta["activityQuestionId"] = str(data.activity_question_id)
    if data.response_time_ms is not None:
        meta["responseTimeMs"] = data.response_time_ms
    if data.confidence_report is not None:
        meta["confidence"] = data.confidence_report
    if data.ai_interaction != "none":
        meta["aiInteraction"] = data.ai_interaction

    # 1. Persist the evidence event
    event = EvidenceEvent(
        student_id=data.student_id,
        competency_id=data.competency_id,
        source=data.source,
        module_id=data.module_id,
        session_id=data.session_id,
        outcome=data.outcome,
        weight=weight,
        meta=meta or None,
    )
    db.add(event)
    await db.flush()

    # 2. Load the primary competency state
    result = await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id == data.student_id,
            StudentCompetencyState.competency_id == data.competency_id,
        )
    )
    primary_state_db = result.scalar_one_or_none()
    if primary_state_db is None:
        await db.commit()
        return event, []

    # 3. Load prerequisite edges for FIRe decay clock reset
    prereq_result = await db.execute(select(PrerequisiteEdge))
    prereq_edges_raw = [
        {
            "source_id": e.source_id,
            "target_id": e.target_id,
            "encompassing_weight": e.encompassing_weight,
        }
        for e in prereq_result.scalars().all()
    ]

    # Build ancestor map for FIRe
    ancestor_links = build_prerequisite_ancestor_map(prereq_edges_raw, data.competency_id)

    # Load ancestor states (FIRe only resets their decay clock)
    ancestor_ids = [l.linked_competency_id for l in ancestor_links]
    all_states_engine: dict[str, CompetencyState] = {}
    if ancestor_ids:
        linked_result = await db.execute(
            select(StudentCompetencyState).where(
                StudentCompetencyState.student_id == data.student_id,
                StudentCompetencyState.competency_id.in_(ancestor_ids),
            )
        )
        linked_db_states = {s.competency_id: s for s in linked_result.scalars().all()}
        all_states_engine = {cid: _db_state_to_engine(s) for cid, s in linked_db_states.items()}

    # 4. Run BKT engine
    evidence_input = EvidenceInput(
        student_id=str(data.student_id),
        competency_id=data.competency_id,
        outcome=data.outcome,
        source=data.source,
        weight=weight,
        response_time_ms=data.response_time_ms,
        confidence_report=data.confidence_report,
        ai_interaction=data.ai_interaction,
        timestamp=None,  # engine will use utcnow
    )

    primary_engine_state = _db_state_to_engine(primary_state_db)
    updated_state, update_results = engine.process_evidence(
        primary_engine_state, evidence_input,
        codevelopment_links=[],
        all_states=all_states_engine,
        prerequisite_links=ancestor_links,
    )

    # 5. Persist updated primary state
    _apply_engine_state_to_db(primary_state_db, updated_state)

    # 6. Persist FIRe decay clock resets for ancestors
    fire_refreshed = update_results[0].fire_refreshed if update_results else []
    if fire_refreshed:
        linked_result2 = await db.execute(
            select(StudentCompetencyState).where(
                StudentCompetencyState.student_id == data.student_id,
                StudentCompetencyState.competency_id.in_(fire_refreshed),
            )
        )
        for db_st in linked_result2.scalars().all():
            engine_st = all_states_engine.get(db_st.competency_id)
            if engine_st:
                db_st.last_evidence_at = engine_st.last_evidence_at

    await db.commit()
    await db.refresh(event)
    return event, update_results, feedback


async def get_evidence_history(
    db: AsyncSession,
    student_id: uuid.UUID | None = None,
    competency_id: str | None = None,
    limit: int = 50,
) -> list[EvidenceEvent]:
    query = select(EvidenceEvent).order_by(EvidenceEvent.created_at.desc()).limit(limit)
    if student_id:
        query = query.where(EvidenceEvent.student_id == student_id)
    if competency_id:
        query = query.where(EvidenceEvent.competency_id == competency_id)
    result = await db.execute(query)
    return list(result.scalars().all())
