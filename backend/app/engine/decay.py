"""Batch forgetting decay — applies temporal decay to all student-competency states."""

from datetime import datetime

from app.engine.bkt import BKTEngine
from app.engine.types import CompetencyState


def apply_decay_to_all(
    engine: BKTEngine,
    all_states: list[CompetencyState],
    now: datetime | None = None,
) -> list[CompetencyState]:
    """
    Apply forgetting decay to a list of competency states.
    Returns only the states that actually changed (for efficient DB writes).
    """
    now = now or datetime.utcnow()
    changed = []
    for state in all_states:
        updated = engine.apply_decay(state, now)
        if updated is not state:  # apply_decay returns same object if no change
            changed.append(updated)
    return changed
