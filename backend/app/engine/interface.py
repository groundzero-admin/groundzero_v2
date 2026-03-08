"""
MasteryEngine interface — the stable contract.

BKT implements this today. DKT, transformer, or ensemble implements it tomorrow.
The interface never changes. What sits behind it can be swapped without affecting
the evidence pipeline, curriculum predictor, or dashboards.
"""

from abc import ABC, abstractmethod
from datetime import datetime

from app.engine.types import BKTParams, BKTUpdateResult, CompetencyState, EvidenceInput, PrerequisiteLink


class MasteryEngine(ABC):

    @abstractmethod
    def init_state(self, competency_id: str, params: BKTParams, initial_p_l: float = 0.10) -> CompetencyState:
        """Create initial competency state for a student."""
        ...

    @abstractmethod
    def process_evidence(
        self,
        state: CompetencyState,
        evidence: EvidenceInput,
        codevelopment_links: list = (),
        all_states: dict[str, CompetencyState] | None = None,
        prerequisite_links: list[PrerequisiteLink] | None = None,
    ) -> tuple[CompetencyState, list[BKTUpdateResult]]:
        """Process a single evidence event. Returns updated state + update result with FIRe info."""
        ...

    @abstractmethod
    def apply_decay(self, state: CompetencyState, now: datetime) -> CompetencyState:
        """Apply forgetting decay based on time since last evidence."""
        ...

    @abstractmethod
    def predict_performance(self, state: CompetencyState) -> tuple[float, float]:
        """Return (probability_correct, confidence)."""
        ...
