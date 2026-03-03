"""Process evidence events → run BKT engine → persist updated state."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.bkt import BKTEngine, SOURCE_WEIGHTS
from app.engine.propagation import build_codevelopment_map
from app.engine.types import BKTUpdateResult, CompetencyState, CodevelopmentLink, EvidenceInput
from app.models.evidence import EvidenceEvent
from app.models.skill_graph import CodevelopmentEdge
from app.models.student import StudentCompetencyState
from app.schemas.evidence import EvidenceCreate

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
) -> tuple[EvidenceEvent, list[BKTUpdateResult]]:
    """
    Process an evidence event:
    1. Persist the event
    2. Load student state + co-development links
    3. Run BKT engine
    4. Persist updated state(s)
    """
    # Determine weight
    weight = data.weight if data.weight is not None else SOURCE_WEIGHTS.get(data.source, 0.7)

    # Build meta dict from optional fields
    meta = {}
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

    # 3. Load co-development links for this competency
    codev_result = await db.execute(
        select(CodevelopmentEdge).where(
            (CodevelopmentEdge.source_id == data.competency_id)
            | (CodevelopmentEdge.target_id == data.competency_id)
        )
    )
    codev_edges = codev_result.scalars().all()

    # Build links list (bidirectional)
    links: list[CodevelopmentLink] = []
    for edge in codev_edges:
        if edge.source_id == data.competency_id:
            links.append(CodevelopmentLink(linked_competency_id=edge.target_id, transfer_weight=edge.transfer_weight))
        else:
            links.append(CodevelopmentLink(linked_competency_id=edge.source_id, transfer_weight=edge.transfer_weight))

    # Load all linked states for propagation
    all_states_engine: dict[str, CompetencyState] = {}
    if links:
        linked_ids = [l.linked_competency_id for l in links]
        linked_result = await db.execute(
            select(StudentCompetencyState).where(
                StudentCompetencyState.student_id == data.student_id,
                StudentCompetencyState.competency_id.in_(linked_ids),
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
        primary_engine_state, evidence_input, links, all_states_engine
    )

    # 5. Persist updated primary state
    _apply_engine_state_to_db(primary_state_db, updated_state)

    # 6. Persist propagated state updates + create propagated evidence events
    if links:
        linked_result2 = await db.execute(
            select(StudentCompetencyState).where(
                StudentCompetencyState.student_id == data.student_id,
                StudentCompetencyState.competency_id.in_([l.linked_competency_id for l in links]),
            )
        )
        linked_db_map = {s.competency_id: s for s in linked_result2.scalars().all()}

        for cid, engine_st in all_states_engine.items():
            db_st = linked_db_map.get(cid)
            if db_st:
                _apply_engine_state_to_db(db_st, engine_st)
                # Find the actual delta transferred from update results
                prop_result = next(
                    (r for r in update_results if r.competency_id == cid and r.competency_id != data.competency_id),
                    None,
                )
                actual_delta = (prop_result.p_learned_after - prop_result.p_learned_before) if prop_result else 0.0
                transfer_w = next(
                    (l.transfer_weight for l in links if l.linked_competency_id == cid), 0.5
                )
                # Create propagated evidence event for audit trail
                prop_event = EvidenceEvent(
                    student_id=data.student_id,
                    competency_id=cid,
                    source=data.source,
                    module_id=data.module_id,
                    outcome=data.outcome,
                    weight=transfer_w,
                    meta={
                        "propagation_type": "delta_transfer",
                        "delta_transferred": round(actual_delta, 6),
                        "source_competency": data.competency_id,
                        "transfer_weight": transfer_w,
                    },
                    is_propagated=True,
                    source_event_id=event.id,
                )
                db.add(prop_event)

    await db.commit()
    await db.refresh(event)
    return event, update_results


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
