"""
10-step BKT (Bayesian Knowledge Tracing) engine.

Ported from bkt-simulation.jsx. This is the core intellectual property of the system.
Pure Python — no database, no async, no SQLAlchemy. Takes dataclasses in, returns dataclasses out.

Steps:
    1. Decay (forgetting)
    2. Bayesian posterior update
    3. Source weighting + response time modifier
    4. Learning transition P(T) with AI interaction boost
    5. Confidence modifier
    6. Stuck detection
    7. Stability update
    8. Co-development propagation (max 1 hop)
    9. Stage derivation
    10. Confidence estimation
"""

import math
from datetime import datetime

from app.engine.interface import MasteryEngine
from app.engine.types import BKTParams, BKTUpdateResult, CompetencyState, EvidenceInput, PrerequisiteLink

# Source reliability weights (from technical design)
SOURCE_WEIGHTS: dict[str, float] = {
    "mcq": 1.0,
    "llm_transcript": 0.7,
    "llm_spark": 0.6,
    "facilitator": 0.5,
    "artifact": 0.9,
    "diagnostic": 0.8,
}

# Speed modifiers for MCQ only (from technical design)
SPEED_MODIFIERS = {
    "fast_correct": 1.3,  # confident mastery
    "slow_correct": 0.6,  # effortful, maybe guessing
    "fast_wrong": 0.7,  # careless slip
    "slow_wrong": 1.2,  # genuine gap
}

# Confidence report modifiers
CONFIDENCE_MODIFIERS: dict[tuple[str, bool], float] = {
    ("got_it", False): 1.3,  # confident + wrong → amplify negative
    ("lost", True): 0.8,  # unconfident + right → dampen positive
}

# Stage thresholds: P(L) → stage (check from highest first)
STAGE_THRESHOLDS = [
    (0.85, 5),  # Mastered
    (0.65, 4),  # Proficient
    (0.40, 3),  # Developing
    (0.20, 2),  # Emerging
    (0.00, 1),  # Novice
]

STUCK_THRESHOLD = 4  # consecutive failures before stuck alert

# Default prior for decay target
DEFAULT_P_L0 = 0.10


class BKTEngine(MasteryEngine):
    """10-step BKT implementation as specified in the technical design document."""

    def init_state(self, competency_id: str, params: BKTParams, initial_p_l: float = 0.10) -> CompetencyState:
        return CompetencyState(
            competency_id=competency_id,
            p_learned=initial_p_l,
            p_guess=params.p_guess,
            p_slip=params.p_slip,
            p_transit=params.p_transit,
            stage=_derive_stage(initial_p_l),
        )

    def process_evidence(
        self,
        state: CompetencyState,
        evidence: EvidenceInput,
        codevelopment_links: list = (),
        all_states: dict[str, CompetencyState] | None = None,
        prerequisite_links: list[PrerequisiteLink] | None = None,
    ) -> tuple[CompetencyState, list[BKTUpdateResult]]:
        p_l_original = state.p_learned
        stage_before = state.stage
        now = evidence.timestamp or datetime.utcnow()
        is_positive = evidence.outcome >= 0.5

        # ── Step 1: DECAY ──
        p_l = _apply_decay_internal(state, now)

        # ── Step 2: BAYESIAN POSTERIOR UPDATE ──
        if is_positive:
            p_correct_given_l = 1.0 - state.p_slip
            p_correct_given_not_l = state.p_guess
            p_correct = p_l * p_correct_given_l + (1 - p_l) * p_correct_given_not_l
            p_l_posterior = (p_l * p_correct_given_l) / p_correct if p_correct > 0 else p_l
        else:
            p_wrong_given_l = state.p_slip
            p_wrong_given_not_l = 1.0 - state.p_guess
            p_wrong = p_l * p_wrong_given_l + (1 - p_l) * p_wrong_given_not_l
            p_l_posterior = (p_l * p_wrong_given_l) / p_wrong if p_wrong > 0 else p_l

        # ── Step 3: SOURCE WEIGHTING + RESPONSE TIME ──
        source_weight = evidence.weight if evidence.weight else SOURCE_WEIGHTS.get(evidence.source, 0.7)
        speed_modifier = _compute_speed_modifier(evidence, state, is_positive)
        p_l_weighted = p_l + (p_l_posterior - p_l) * source_weight * speed_modifier
        p_l_weighted = _clamp(p_l_weighted)

        # ── Step 4: LEARNING TRANSITION P(T) ──
        # Only apply learning transition on positive evidence, OR when AI helped
        # Getting an MCQ wrong with no AI doesn't teach you anything
        if is_positive or evidence.ai_interaction != "none":
            p_t_adjusted = state.p_transit
            if evidence.ai_interaction == "hint":
                p_t_adjusted = min(0.4, p_t_adjusted * 1.5)
            elif evidence.ai_interaction == "conversation":
                p_t_adjusted = min(0.5, p_t_adjusted * 2.0)
            p_l_new = p_l_weighted + (1 - p_l_weighted) * p_t_adjusted
        else:
            p_l_new = p_l_weighted

        # ── Step 5: CONFIDENCE MODIFIER ──
        if evidence.confidence_report:
            key = (evidence.confidence_report, is_positive)
            if key in CONFIDENCE_MODIFIERS:
                modifier = CONFIDENCE_MODIFIERS[key]
                delta = p_l_new - p_l
                p_l_new = p_l + delta * modifier

        p_l_new = _clamp(p_l_new)

        # ── Step 6: STUCK DETECTION ──
        if is_positive:
            consecutive_failures = 0
        else:
            consecutive_failures = state.consecutive_failures + 1
        is_stuck = consecutive_failures >= STUCK_THRESHOLD

        # ── Step 7: STABILITY UPDATE ──
        stability = state.stability
        if is_positive and p_l_new > 0.7:
            stability = min(60.0, stability * 1.4)

        # ── Step 8: FIRe — DECAY CLOCK RESET FOR PREREQUISITES (on success) ──
        # When a student succeeds at an advanced skill, reset the decay clock for
        # prerequisite ancestors. This prevents unnecessary decay of skills that are
        # implicitly being exercised. P(L) is NOT modified — only direct evidence
        # changes mastery estimates. This matches Math Academy's FIRe approach.
        fire_refreshed: list[str] = []
        if is_positive and not evidence.is_propagated and prerequisite_links and all_states:
            for link in prerequisite_links:
                linked_state = all_states.get(link.linked_competency_id)
                if linked_state is None:
                    continue

                updated_linked = CompetencyState(
                    competency_id=linked_state.competency_id,
                    p_learned=linked_state.p_learned,
                    p_guess=linked_state.p_guess,
                    p_slip=linked_state.p_slip,
                    p_transit=linked_state.p_transit,
                    total_evidence=linked_state.total_evidence,
                    positive_evidence=linked_state.positive_evidence,
                    consecutive_failures=linked_state.consecutive_failures,
                    is_stuck=linked_state.is_stuck,
                    last_evidence_at=now,  # THE core FIRe benefit — prevents decay
                    stability=linked_state.stability,
                    avg_response_time_ms=linked_state.avg_response_time_ms,
                    stage=linked_state.stage,
                    confidence=linked_state.confidence,
                    p_learned_history=linked_state.p_learned_history,
                )

                all_states[link.linked_competency_id] = updated_linked
                fire_refreshed.append(link.linked_competency_id)

        # ── Step 9: DERIVE STAGE ──
        stage = _derive_stage(p_l_new)

        # ── Step 10: DERIVE CONFIDENCE ──
        total_evidence = state.total_evidence + 1
        positive_evidence = state.positive_evidence + (1 if is_positive else 0)
        p_learned_history = (state.p_learned_history + [p_l_new])[-10:]  # keep last 10
        trend = _derive_trend(p_learned_history)
        confidence = _derive_confidence(total_evidence, p_learned_history)

        # Update avg response time
        avg_rt = state.avg_response_time_ms
        if evidence.response_time_ms is not None:
            if avg_rt is not None:
                avg_rt = avg_rt * 0.8 + evidence.response_time_ms * 0.2
            else:
                avg_rt = float(evidence.response_time_ms)

        # Build updated state
        updated_state = CompetencyState(
            competency_id=state.competency_id,
            p_learned=p_l_new,
            p_guess=state.p_guess,
            p_slip=state.p_slip,
            p_transit=state.p_transit,
            total_evidence=total_evidence,
            positive_evidence=positive_evidence,
            consecutive_failures=consecutive_failures,
            is_stuck=is_stuck,
            last_evidence_at=now,
            stability=stability,
            avg_response_time_ms=avg_rt,
            stage=stage,
            confidence=confidence,
            p_learned_history=p_learned_history,
        )

        primary_result = BKTUpdateResult(
            competency_id=state.competency_id,
            p_learned_before=p_l_original,
            p_learned_after=p_l_new,
            stage_before=stage_before,
            stage_after=stage,
            is_stuck=is_stuck,
            fire_refreshed=fire_refreshed,
        )

        return updated_state, [primary_result]

    def apply_decay(self, state: CompetencyState, now: datetime) -> CompetencyState:
        p_l_decayed = _apply_decay_internal(state, now)
        if abs(p_l_decayed - state.p_learned) < 0.001:
            return state
        new_stage = _derive_stage(p_l_decayed)
        new_history = (state.p_learned_history + [p_l_decayed])[-10:]
        return CompetencyState(
            competency_id=state.competency_id,
            p_learned=p_l_decayed,
            p_guess=state.p_guess,
            p_slip=state.p_slip,
            p_transit=state.p_transit,
            total_evidence=state.total_evidence,
            positive_evidence=state.positive_evidence,
            consecutive_failures=state.consecutive_failures,
            is_stuck=state.is_stuck,
            last_evidence_at=state.last_evidence_at,
            stability=state.stability,
            avg_response_time_ms=state.avg_response_time_ms,
            stage=new_stage,
            confidence=state.confidence,
            p_learned_history=new_history,
        )

    def predict_performance(self, state: CompetencyState) -> tuple[float, float]:
        p_correct = state.p_learned * (1 - state.p_slip) + (1 - state.p_learned) * state.p_guess
        return (p_correct, state.confidence)


# ── Private helper functions ──


def _clamp(value: float, low: float = 0.001, high: float = 0.999) -> float:
    """Clamp P(L) to valid range."""
    return max(low, min(high, value))


def _apply_decay_internal(state: CompetencyState, now: datetime) -> float:
    """Exponential forgetting decay toward the prior."""
    if state.last_evidence_at is None:
        return state.p_learned
    delta = (now - state.last_evidence_at).total_seconds()
    days_since = delta / 86400.0
    if days_since < 0.01:  # less than ~15 minutes, no decay
        return state.p_learned
    decay_factor = math.exp(-days_since / state.stability)
    return DEFAULT_P_L0 + (state.p_learned - DEFAULT_P_L0) * decay_factor


def _compute_speed_modifier(evidence: EvidenceInput, state: CompetencyState, is_positive: bool) -> float:
    """Response time modifier for MCQ only."""
    if evidence.source != "mcq" or evidence.response_time_ms is None:
        return 1.0

    # Use rolling average as baseline if available, otherwise use absolute thresholds
    baseline = state.avg_response_time_ms or 8000.0
    speed_ratio = evidence.response_time_ms / baseline

    if is_positive:
        if speed_ratio < 0.7:
            return SPEED_MODIFIERS["fast_correct"]
        elif speed_ratio > 1.5:
            return SPEED_MODIFIERS["slow_correct"]
    else:
        if speed_ratio < 0.5:
            return SPEED_MODIFIERS["fast_wrong"]
        elif speed_ratio > 1.5:
            return SPEED_MODIFIERS["slow_wrong"]
    return 1.0


def _derive_stage(p_l: float) -> int:
    """Map P(L) to stage 1-5 using threshold table."""
    for threshold, stage in STAGE_THRESHOLDS:
        if p_l >= threshold:
            return stage
    return 1


def _derive_trend(history: list[float]) -> str:
    """Compare recent P(L) history to determine trend."""
    if len(history) < 5:
        return "stable"
    recent = history[-5:]
    delta = recent[-1] - recent[0]
    if delta > 0.05:
        return "improving"
    elif delta < -0.05:
        return "declining"
    return "stable"


def _derive_confidence(total_evidence: int, history: list[float]) -> float:
    """Estimate confidence in the P(L) estimate based on evidence count and variance."""
    # More evidence → higher confidence (logistic curve)
    evidence_factor = 1.0 - math.exp(-total_evidence / 5.0)

    # Low variance → higher confidence
    if len(history) >= 3:
        mean = sum(history) / len(history)
        variance = sum((x - mean) ** 2 for x in history) / len(history)
        variance_factor = 1.0 - min(1.0, variance * 10)
    else:
        variance_factor = 0.3

    return round(min(1.0, evidence_factor * 0.7 + variance_factor * 0.3), 3)
