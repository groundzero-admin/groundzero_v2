"""Pure dataclasses used by the mastery engine. No SQLAlchemy, no DB, no async."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal


@dataclass
class BKTParams:
    """Default BKT parameters for a competency."""

    p_l0: float = 0.10
    p_guess: float = 0.25
    p_slip: float = 0.10
    p_transit: float = 0.15


@dataclass
class CompetencyState:
    """Per-student, per-competency BKT state."""

    competency_id: str
    p_learned: float = 0.10
    p_guess: float = 0.25
    p_slip: float = 0.10
    p_transit: float = 0.15

    total_evidence: int = 0
    positive_evidence: int = 0
    consecutive_failures: int = 0
    is_stuck: bool = False

    last_evidence_at: datetime | None = None
    stability: float = 7.0  # forgetting half-life in days
    avg_response_time_ms: float | None = None

    stage: int = 1  # 1-5
    confidence: float = 0.0  # 0-1

    # For trend computation: store last N p_learned values
    p_learned_history: list[float] = field(default_factory=list)


@dataclass
class EvidenceInput:
    """Input to the BKT engine for a single evidence event."""

    student_id: str
    competency_id: str
    outcome: float  # 0.0-1.0
    source: str  # mcq, llm_transcript, llm_spark, facilitator, artifact, diagnostic
    weight: float  # source reliability weight

    response_time_ms: int | None = None
    confidence_report: Literal["got_it", "kinda", "lost"] | None = None
    ai_interaction: Literal["none", "hint", "conversation"] = "none"
    timestamp: datetime | None = None

    is_propagated: bool = False  # if True, skip co-development propagation


@dataclass
class BKTUpdateResult:
    """Output of a single BKT update step."""

    competency_id: str
    p_learned_before: float
    p_learned_after: float
    stage_before: int
    stage_after: int
    is_stuck: bool
    propagated_updates: list["BKTUpdateResult"] = field(default_factory=list)
    delta_transferred: float | None = None  # actual P(L) delta applied (for propagated updates)


@dataclass
class CodevelopmentLink:
    """A co-development edge between two competencies."""

    linked_competency_id: str
    transfer_weight: float
