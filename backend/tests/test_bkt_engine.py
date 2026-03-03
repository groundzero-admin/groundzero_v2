"""
Comprehensive unit tests for the BKT mastery engine.
Tests all 10 steps of the algorithm.
"""

from datetime import datetime, timedelta

import pytest

from app.engine.bkt import BKTEngine, _derive_stage
from app.engine.types import BKTParams, CodevelopmentLink, CompetencyState, EvidenceInput


@pytest.fixture
def engine():
    return BKTEngine()


@pytest.fixture
def default_state():
    """A student with default BKT params and some learning progress."""
    return CompetencyState(
        competency_id="C4.7",
        p_learned=0.30,
        p_guess=0.25,
        p_slip=0.10,
        p_transit=0.15,
        total_evidence=5,
        positive_evidence=2,
        stability=7.0,
        last_evidence_at=datetime.utcnow(),
    )


@pytest.fixture
def now():
    return datetime.utcnow()


def _make_evidence(competency_id="C4.7", outcome=1.0, source="mcq", weight=1.0, **kwargs):
    return EvidenceInput(
        student_id="student-1",
        competency_id=competency_id,
        outcome=outcome,
        source=source,
        weight=weight,
        timestamp=datetime.utcnow(),
        **kwargs,
    )


class TestPositiveEvidence:
    def test_correct_answer_increases_p_learned(self, engine, default_state):
        evidence = _make_evidence(outcome=1.0)
        updated, results = engine.process_evidence(default_state, evidence, [])
        assert updated.p_learned > default_state.p_learned

    def test_multiple_correct_answers_approach_mastery(self, engine):
        state = CompetencyState(competency_id="C4.7", p_learned=0.10, p_guess=0.25, p_slip=0.10, p_transit=0.15)
        for _ in range(20):
            evidence = _make_evidence(outcome=1.0)
            state, _ = engine.process_evidence(state, evidence, [])
        assert state.p_learned > 0.85  # should approach mastery after 20 correct


class TestNegativeEvidence:
    def test_wrong_answer_decreases_p_learned(self, engine, default_state):
        evidence = _make_evidence(outcome=0.0)
        updated, results = engine.process_evidence(default_state, evidence, [])
        assert updated.p_learned < default_state.p_learned

    def test_p_learned_stays_bounded(self, engine):
        state = CompetencyState(competency_id="C4.7", p_learned=0.05, p_guess=0.25, p_slip=0.10, p_transit=0.15)
        for _ in range(10):
            evidence = _make_evidence(outcome=0.0)
            state, _ = engine.process_evidence(state, evidence, [])
        assert state.p_learned >= 0.001  # never goes below clamp
        assert state.p_learned <= 0.999


class TestStuckDetection:
    def test_stuck_after_4_consecutive_failures(self, engine, default_state):
        state = default_state
        for _ in range(4):
            evidence = _make_evidence(outcome=0.0)
            state, _ = engine.process_evidence(state, evidence, [])
        assert state.is_stuck is True
        assert state.consecutive_failures == 4

    def test_not_stuck_after_3_failures(self, engine, default_state):
        state = default_state
        for _ in range(3):
            evidence = _make_evidence(outcome=0.0)
            state, _ = engine.process_evidence(state, evidence, [])
        assert state.is_stuck is False
        assert state.consecutive_failures == 3

    def test_stuck_clears_on_success(self, engine, default_state):
        state = default_state
        for _ in range(4):
            evidence = _make_evidence(outcome=0.0)
            state, _ = engine.process_evidence(state, evidence, [])
        assert state.is_stuck is True
        # Now correct answer
        evidence = _make_evidence(outcome=1.0)
        state, _ = engine.process_evidence(state, evidence, [])
        assert state.is_stuck is False
        assert state.consecutive_failures == 0


class TestDecay:
    def test_decay_reduces_p_learned(self, engine):
        past = datetime.utcnow() - timedelta(days=14)
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.80,
            stability=7.0,
            last_evidence_at=past,
        )
        decayed = engine.apply_decay(state, datetime.utcnow())
        assert decayed.p_learned < 0.80
        assert decayed.p_learned > 0.10  # shouldn't decay all the way to prior

    def test_no_decay_when_recent(self, engine):
        recent = datetime.utcnow() - timedelta(minutes=5)
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.80,
            stability=7.0,
            last_evidence_at=recent,
        )
        decayed = engine.apply_decay(state, datetime.utcnow())
        assert decayed is state  # same object returned, no change

    def test_no_decay_without_last_evidence(self, engine):
        state = CompetencyState(competency_id="C4.7", p_learned=0.80, last_evidence_at=None)
        decayed = engine.apply_decay(state, datetime.utcnow())
        assert decayed is state

    def test_high_stability_decays_slower(self, engine):
        past = datetime.utcnow() - timedelta(days=14)
        low_stability = CompetencyState(competency_id="C4.7", p_learned=0.80, stability=3.0, last_evidence_at=past)
        high_stability = CompetencyState(competency_id="C4.7", p_learned=0.80, stability=30.0, last_evidence_at=past)
        now = datetime.utcnow()
        decayed_low = engine.apply_decay(low_stability, now)
        decayed_high = engine.apply_decay(high_stability, now)
        assert decayed_high.p_learned > decayed_low.p_learned  # high stability decays slower


class TestStability:
    def test_stability_increases_on_mastery(self, engine):
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.75,
            stability=7.0,
            last_evidence_at=datetime.utcnow(),
        )
        evidence = _make_evidence(outcome=1.0)
        updated, _ = engine.process_evidence(state, evidence, [])
        assert updated.stability > 7.0

    def test_stability_capped_at_60(self, engine):
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.90,
            stability=55.0,
            last_evidence_at=datetime.utcnow(),
        )
        evidence = _make_evidence(outcome=1.0)
        updated, _ = engine.process_evidence(state, evidence, [])
        assert updated.stability <= 60.0


class TestStageDerivation:
    @pytest.mark.parametrize(
        "p_l, expected_stage",
        [
            (0.05, 1),  # Novice
            (0.10, 1),
            (0.19, 1),
            (0.20, 2),  # Emerging
            (0.30, 2),
            (0.39, 2),
            (0.40, 3),  # Developing
            (0.50, 3),
            (0.64, 3),
            (0.65, 4),  # Proficient
            (0.75, 4),
            (0.84, 4),
            (0.85, 5),  # Mastered
            (0.95, 5),
            (0.999, 5),
        ],
    )
    def test_stage_thresholds(self, p_l, expected_stage):
        assert _derive_stage(p_l) == expected_stage


class TestSpeedModifiers:
    def test_fast_correct_boosts(self, engine):
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.30,
            avg_response_time_ms=8000.0,
            last_evidence_at=datetime.utcnow(),
        )
        fast_evidence = _make_evidence(outcome=1.0, response_time_ms=3000)  # fast
        slow_evidence = _make_evidence(outcome=1.0, response_time_ms=15000)  # slow

        fast_updated, _ = engine.process_evidence(state, fast_evidence, [])
        slow_updated, _ = engine.process_evidence(state, slow_evidence, [])

        # Fast + correct should boost more than slow + correct
        assert fast_updated.p_learned > slow_updated.p_learned

    def test_speed_modifier_only_for_mcq(self, engine):
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.30,
            avg_response_time_ms=8000.0,
            last_evidence_at=datetime.utcnow(),
        )
        # Transcript evidence should ignore response time
        evidence = _make_evidence(outcome=1.0, source="llm_transcript", weight=0.7, response_time_ms=1000)
        evidence_no_rt = _make_evidence(outcome=1.0, source="llm_transcript", weight=0.7)

        updated_with_rt, _ = engine.process_evidence(state, evidence, [])
        updated_no_rt, _ = engine.process_evidence(state, evidence_no_rt, [])

        # Should be identical since speed modifier doesn't apply to non-MCQ
        assert abs(updated_with_rt.p_learned - updated_no_rt.p_learned) < 0.001


class TestConfidenceModifier:
    def test_confident_wrong_amplifies_negative(self, engine):
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.50,
            last_evidence_at=datetime.utcnow(),
        )
        wrong_confident = _make_evidence(outcome=0.0, confidence_report="got_it")
        wrong_normal = _make_evidence(outcome=0.0)

        updated_confident, _ = engine.process_evidence(state, wrong_confident, [])
        updated_normal, _ = engine.process_evidence(state, wrong_normal, [])

        # Confident + wrong should decrease P(L) more
        assert updated_confident.p_learned < updated_normal.p_learned

    def test_unconfident_right_dampens_positive(self, engine):
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.50,
            last_evidence_at=datetime.utcnow(),
        )
        right_lost = _make_evidence(outcome=1.0, confidence_report="lost")
        right_normal = _make_evidence(outcome=1.0)

        updated_lost, _ = engine.process_evidence(state, right_lost, [])
        updated_normal, _ = engine.process_evidence(state, right_normal, [])

        # Unconfident + right should increase P(L) less
        assert updated_lost.p_learned < updated_normal.p_learned


class TestAIInteraction:
    def test_hint_boosts_p_transit(self, engine):
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.30,
            p_transit=0.15,
            last_evidence_at=datetime.utcnow(),
        )
        with_hint = _make_evidence(outcome=0.0, ai_interaction="hint")
        without_hint = _make_evidence(outcome=0.0)

        updated_hint, _ = engine.process_evidence(state, with_hint, [])
        updated_normal, _ = engine.process_evidence(state, without_hint, [])

        # Hint should result in higher P(L) even on wrong answer (more learning)
        assert updated_hint.p_learned > updated_normal.p_learned

    def test_conversation_boosts_more_than_hint(self, engine):
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.30,
            p_transit=0.15,
            last_evidence_at=datetime.utcnow(),
        )
        with_conversation = _make_evidence(outcome=0.0, ai_interaction="conversation")
        with_hint = _make_evidence(outcome=0.0, ai_interaction="hint")

        updated_conv, _ = engine.process_evidence(state, with_conversation, [])
        updated_hint, _ = engine.process_evidence(state, with_hint, [])

        assert updated_conv.p_learned > updated_hint.p_learned


class TestCodevelopmentPropagation:
    def test_propagation_delta_transfer(self, engine):
        """Propagation should transfer delta * transfer_weight, NOT run full BKT."""
        state_c1_5 = CompetencyState(competency_id="C1.5", p_learned=0.30, last_evidence_at=datetime.utcnow())
        state_c4_4 = CompetencyState(competency_id="C4.4", p_learned=0.30, last_evidence_at=datetime.utcnow())

        links = [CodevelopmentLink(linked_competency_id="C4.4", transfer_weight=0.30)]
        all_states = {"C1.5": state_c1_5, "C4.4": state_c4_4}

        evidence = EvidenceInput(
            student_id="student-1",
            competency_id="C1.5",
            outcome=1.0,
            source="mcq",
            weight=1.0,
            timestamp=datetime.utcnow(),
        )

        updated_c1_5, results = engine.process_evidence(state_c1_5, evidence, links, all_states)

        primary_delta = updated_c1_5.p_learned - 0.30
        linked_delta = all_states["C4.4"].p_learned - 0.30

        # Delta transfer: linked gain = primary_delta * transfer_weight
        assert abs(linked_delta - primary_delta * 0.30) < 0.01, (
            f"Expected linked delta ~{primary_delta * 0.30:.4f}, got {linked_delta:.4f}"
        )
        assert updated_c1_5.p_learned > 0.30
        assert all_states["C4.4"].p_learned > 0.30
        assert all_states["C4.4"].p_learned < updated_c1_5.p_learned

    def test_propagation_does_not_compound(self, engine):
        """Over 15 events, linked gain should be ~transfer_weight * primary gain, NOT ~100%."""
        state_primary = CompetencyState(competency_id="C2.10", p_learned=0.10, last_evidence_at=datetime.utcnow())
        state_linked = CompetencyState(competency_id="C3.11", p_learned=0.10, last_evidence_at=datetime.utcnow())

        links = [CodevelopmentLink(linked_competency_id="C3.11", transfer_weight=0.40)]
        all_states = {"C2.10": state_primary, "C3.11": state_linked}

        for _ in range(15):
            evidence = EvidenceInput(
                student_id="s1", competency_id="C2.10", outcome=1.0,
                source="mcq", weight=1.0, timestamp=datetime.utcnow(),
            )
            state_primary, _ = engine.process_evidence(state_primary, evidence, links, all_states)

        primary_gain = state_primary.p_learned - 0.10
        linked_gain = all_states["C3.11"].p_learned - 0.10
        ratio = linked_gain / primary_gain if primary_gain > 0 else 0

        assert 0.35 <= ratio <= 0.45, f"Expected ~0.40 ratio, got {ratio:.3f}"
        assert all_states["C3.11"].p_learned < 0.60, (
            f"Linked P(L)={all_states['C3.11'].p_learned:.4f}, should be < 0.60 with 0.40 transfer"
        )

    def test_propagation_negative_delta(self, engine):
        """Wrong answers should propagate a negative delta to linked competencies."""
        state_primary = CompetencyState(competency_id="A", p_learned=0.60, last_evidence_at=datetime.utcnow())
        state_linked = CompetencyState(competency_id="B", p_learned=0.60, last_evidence_at=datetime.utcnow())

        links = [CodevelopmentLink(linked_competency_id="B", transfer_weight=0.30)]
        all_states = {"A": state_primary, "B": state_linked}

        evidence = EvidenceInput(
            student_id="s1", competency_id="A", outcome=0.0,
            source="mcq", weight=1.0, timestamp=datetime.utcnow(),
        )
        updated_a, _ = engine.process_evidence(state_primary, evidence, links, all_states)

        # Both should decrease
        assert updated_a.p_learned < 0.60
        assert all_states["B"].p_learned < 0.60
        # Linked decrease should be ~30% of primary decrease
        primary_drop = 0.60 - updated_a.p_learned
        linked_drop = 0.60 - all_states["B"].p_learned
        assert abs(linked_drop - primary_drop * 0.30) < 0.01

    def test_propagation_does_not_affect_stuck(self, engine):
        """Propagated events should NOT increment consecutive_failures on linked state."""
        state_primary = CompetencyState(competency_id="A", p_learned=0.50, last_evidence_at=datetime.utcnow())
        state_linked = CompetencyState(
            competency_id="B", p_learned=0.50,
            consecutive_failures=3, last_evidence_at=datetime.utcnow(),
        )

        links = [CodevelopmentLink(linked_competency_id="B", transfer_weight=0.30)]
        all_states = {"A": state_primary, "B": state_linked}

        evidence = EvidenceInput(
            student_id="s1", competency_id="A", outcome=0.0,
            source="mcq", weight=1.0, timestamp=datetime.utcnow(),
        )
        engine.process_evidence(state_primary, evidence, links, all_states)

        # Linked state's stuck counters should be unchanged
        assert all_states["B"].consecutive_failures == 3
        assert all_states["B"].is_stuck is False

    def test_propagation_max_one_hop(self, engine):
        """Propagated events should NOT further propagate."""
        state_a = CompetencyState(competency_id="A", p_learned=0.30, last_evidence_at=datetime.utcnow())
        state_b = CompetencyState(competency_id="B", p_learned=0.30, last_evidence_at=datetime.utcnow())
        state_c = CompetencyState(competency_id="C", p_learned=0.30, last_evidence_at=datetime.utcnow())

        links_a = [CodevelopmentLink(linked_competency_id="B", transfer_weight=0.30)]
        # B links to C, but propagated events from A→B should NOT further propagate to C
        all_states = {"A": state_a, "B": state_b, "C": state_c}

        evidence = EvidenceInput(
            student_id="s1",
            competency_id="A",
            outcome=1.0,
            source="mcq",
            weight=1.0,
            timestamp=datetime.utcnow(),
        )

        engine.process_evidence(state_a, evidence, links_a, all_states)

        # B should have been updated (direct propagation from A)
        assert all_states["B"].p_learned > 0.30
        # C should NOT have been updated (no second hop)
        assert all_states["C"].p_learned == 0.30

    def test_no_propagation_when_propagated_flag_set(self, engine):
        state = CompetencyState(competency_id="C1.5", p_learned=0.30, last_evidence_at=datetime.utcnow())
        state_linked = CompetencyState(competency_id="C4.4", p_learned=0.30, last_evidence_at=datetime.utcnow())

        links = [CodevelopmentLink(linked_competency_id="C4.4", transfer_weight=0.30)]
        all_states = {"C1.5": state, "C4.4": state_linked}

        evidence = EvidenceInput(
            student_id="s1",
            competency_id="C1.5",
            outcome=1.0,
            source="mcq",
            weight=1.0,
            is_propagated=True,  # already propagated
            timestamp=datetime.utcnow(),
        )

        _, results = engine.process_evidence(state, evidence, links, all_states)

        # Should NOT propagate further
        assert all_states["C4.4"].p_learned == 0.30


class TestSourceWeights:
    def test_mcq_has_higher_weight_than_transcript(self, engine):
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.30,
            last_evidence_at=datetime.utcnow(),
        )
        mcq_evidence = _make_evidence(outcome=1.0, source="mcq", weight=1.0)
        transcript_evidence = _make_evidence(outcome=1.0, source="llm_transcript", weight=0.7)

        updated_mcq, _ = engine.process_evidence(state, mcq_evidence, [])
        updated_transcript, _ = engine.process_evidence(state, transcript_evidence, [])

        assert updated_mcq.p_learned > updated_transcript.p_learned


class TestPredictPerformance:
    def test_predict_formula(self, engine):
        state = CompetencyState(
            competency_id="C4.7",
            p_learned=0.60,
            p_guess=0.25,
            p_slip=0.10,
            confidence=0.5,
        )
        p_correct, confidence = engine.predict_performance(state)
        # P(correct) = P(L)(1-P(S)) + (1-P(L))P(G)
        expected = 0.60 * 0.90 + 0.40 * 0.25
        assert abs(p_correct - expected) < 0.001
        assert confidence == 0.5


class TestInitState:
    def test_init_with_defaults(self, engine):
        params = BKTParams()
        state = engine.init_state("C4.7", params)
        assert state.competency_id == "C4.7"
        assert state.p_learned == 0.10
        assert state.stage == 1

    def test_init_with_custom_p_l(self, engine):
        params = BKTParams()
        state = engine.init_state("C4.7", params, initial_p_l=0.50)
        assert state.p_learned == 0.50
        assert state.stage == 3  # Developing


class TestEvidenceCounters:
    def test_evidence_counters_increment(self, engine, default_state):
        evidence = _make_evidence(outcome=1.0)
        updated, _ = engine.process_evidence(default_state, evidence, [])
        assert updated.total_evidence == default_state.total_evidence + 1
        assert updated.positive_evidence == default_state.positive_evidence + 1

    def test_negative_evidence_doesnt_increment_positive(self, engine, default_state):
        evidence = _make_evidence(outcome=0.0)
        updated, _ = engine.process_evidence(default_state, evidence, [])
        assert updated.total_evidence == default_state.total_evidence + 1
        assert updated.positive_evidence == default_state.positive_evidence  # unchanged
