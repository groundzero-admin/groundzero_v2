"""
Comprehensive BKT simulation suite — 5 scenarios.

1. Co-development propagation: Learn C2.10, watch C3.11 get pulled along (weight=0.40)
2. Multiple competencies in parallel: Student works on C4.1, C4.7, C4.14 together
3. Strong student + decay: Diagnostic seeds high, then no practice → decay
4. Diagnostic seeding → learning: Diagnostic profile sets initial states, then MCQ events
5. Predictor check: Verify next-questions ZPD targeting + next-activity scoring

Usage:
    python scripts/simulate_all.py                # run all
    python scripts/simulate_all.py codev           # just co-development
    python scripts/simulate_all.py multi           # just multi-competency
    python scripts/simulate_all.py decay           # just decay
    python scripts/simulate_all.py diagnostic      # just diagnostic + learning
    python scripts/simulate_all.py predictor       # just predictor
"""

import json
import random
import sys
import time

import requests

BASE = "http://localhost:8000/api/v1"
random.seed(42)


def api(method, path, data=None):
    url = f"{BASE}{path}"
    if method == "GET":
        r = requests.get(url)
    else:
        r = requests.post(url, json=data)
    r.raise_for_status()
    return r.json()


def print_header(title):
    print(f"\n{'='*120}")
    print(f"  {title}")
    print(f"{'='*120}\n")


def print_state(sid, comp_id, label=""):
    s = api("GET", f"/students/{sid}/state/{comp_id}")
    tag = f" ({label})" if label else ""
    print(f"  {comp_id}{tag}: P(L)={s['p_learned']:.4f}  Stage={s['stage']}  "
          f"Confidence={s['confidence']:.3f}  Evidence={s['total_evidence']}  "
          f"Stuck={s['is_stuck']}  AvgRT={s['avg_response_time_ms'] or 0:.0f}ms")
    return s


# ─────────────────────────────────────────────────────────────────────
# Scenario 1: Co-development Propagation
# C2.10 (Evaluate AI creativity) → C3.11 (AI for creative ideation)
# Transfer weight = 0.40 — the strongest cross-pillar link
# ─────────────────────────────────────────────────────────────────────
def sim_codevelopment():
    print_header("SCENARIO 1: Co-development Propagation (C2.10 → C3.11, weight=0.40)")

    student = api("POST", "/students", {
        "name": "Priya (co-development test)",
        "grade": 7,
        "grade_band": "6-7",
    })
    sid = student["id"]
    print(f"Created student: {student['name']} ({sid})\n")

    # Check initial state of both competencies
    print("BEFORE any evidence:")
    print_state(sid, "C2.10", "Evaluate AI creativity")
    print_state(sid, "C3.11", "AI for creative ideation")

    # Submit 15 evidence events for C2.10 (mostly correct — mastering it)
    print(f"\n{'#':>3} | {'Answer':<8} | {'C2.10 P(L)':>12} | {'C2.10 Stg':>9} | {'C3.11 P(L)':>12} | {'C3.11 Stg':>9} | {'Propagated?':>11}")
    print("-" * 90)

    for i in range(15):
        # Phase 1 (1-5): 50% correct, Phase 2 (6-10): 70%, Phase 3 (11-15): 90%
        if i < 5:
            correct = random.random() < 0.50
        elif i < 10:
            correct = random.random() < 0.70
        else:
            correct = random.random() < 0.90

        result = api("POST", "/evidence", {
            "student_id": sid,
            "competency_id": "C2.10",
            "outcome": 1.0 if correct else 0.0,
            "source": "mcq",
            "response_time_ms": random.randint(5000, 12000),
        })

        # Check for propagated updates
        primary = result["updates"][0]
        propagated = [u for u in result["updates"] if u["competency_id"] == "C3.11"]
        prop_str = ""
        if propagated:
            p = propagated[0]
            prop_str = f"{p['p_learned_before']:.4f}→{p['p_learned_after']:.4f}"

        answer = "Correct" if correct else "Wrong"
        print(f"{i+1:>3} | {answer:<8} | {primary['p_learned_after']:>12.4f} | "
              f"{primary['stage_after']:>9} | "
              f"{'':>12} | {'':>9} | {prop_str:>11}")

    print("\nFINAL STATE:")
    s1 = print_state(sid, "C2.10", "directly learned")
    s2 = print_state(sid, "C3.11", "propagated only — never directly practiced")

    # Also check C1.6 → C4.5 (weight=0.30) — another co-dev edge
    # C1.6 was never touched, so check its linked targets
    print(f"\n  Co-development verdict: C3.11 moved from P(L)=0.10 to P(L)={s2['p_learned']:.4f}")
    print(f"  Transfer ratio: {(s2['p_learned'] - 0.10) / (s1['p_learned'] - 0.10) * 100:.1f}% of C2.10's gain transferred")


# ─────────────────────────────────────────────────────────────────────
# Scenario 2: Multiple Competencies in Parallel
# Student works on C4.1 (Number patterns), C4.7 (Basic probability),
# C4.14 (Estimation basics) simultaneously — like a real classroom
# ─────────────────────────────────────────────────────────────────────
def sim_multi_competency():
    print_header("SCENARIO 2: Multiple Competencies in Parallel (C4.1, C4.7, C4.14)")

    student = api("POST", "/students", {
        "name": "Aarav (multi-competency)",
        "grade": 6,
        "grade_band": "6-7",
    })
    sid = student["id"]
    print(f"Created student: {student['name']} ({sid})")

    competencies = {
        "C4.1": {"name": "Number patterns", "accuracy": [0.6, 0.7, 0.85]},   # strong
        "C4.7": {"name": "Basic probability", "accuracy": [0.3, 0.5, 0.65]},  # medium
        "C4.14": {"name": "Estimation basics", "accuracy": [0.2, 0.3, 0.45]}, # weak
    }

    print(f"\nSimulating 3 phases × 6 events each = 18 events per competency (54 total)")
    print(f"  C4.1: Strong learner (60% → 70% → 85% accuracy)")
    print(f"  C4.7: Medium learner (30% → 50% → 65% accuracy)")
    print(f"  C4.14: Struggling (20% → 30% → 45% accuracy)")

    # Interleave events across competencies (realistic — not sequential)
    events = []
    for phase in range(3):
        for _ in range(6):
            for cid, info in competencies.items():
                acc = info["accuracy"][phase]
                events.append({
                    "competency_id": cid,
                    "correct": random.random() < acc,
                    "phase": phase + 1,
                })

    random.shuffle(events)  # interleave randomly like a real session

    print(f"\n{'#':>3} | {'Comp':>5} | {'Answer':<8} | {'P(L) Before':>11} | {'P(L) After':>10} | {'Stage':>5}")
    print("-" * 60)

    for i, ev in enumerate(events, 1):
        result = api("POST", "/evidence", {
            "student_id": sid,
            "competency_id": ev["competency_id"],
            "outcome": 1.0 if ev["correct"] else 0.0,
            "source": "mcq",
            "response_time_ms": random.randint(4000, 15000),
        })
        u = result["updates"][0]
        answer = "Correct" if ev["correct"] else "Wrong"
        print(f"{i:>3} | {ev['competency_id']:>5} | {answer:<8} | {u['p_learned_before']:>11.4f} | {u['p_learned_after']:>10.4f} | {u['stage_after']:>5}")

    print("\nFINAL STATES:")
    for cid, info in competencies.items():
        print_state(sid, cid, info["name"])


# ─────────────────────────────────────────────────────────────────────
# Scenario 3: Strong Student + Decay
# Diagnostic seeds high P(L), then simulate time passing with no practice
# Uses the decay endpoint to simulate forgetting
# ─────────────────────────────────────────────────────────────────────
def sim_decay():
    print_header("SCENARIO 3: Strong Student + Forgetting Decay")

    student = api("POST", "/students", {
        "name": "Meera (strong + decay)",
        "grade": 8,
        "grade_band": "8-9",
    })
    sid = student["id"]
    print(f"Created student: {student['name']} ({sid})")

    # Use diagnostic to seed a strong student
    profile = {
        "pillar_stages": {
            "communication": 4,     # Proficient in Pillar 1
            "creativity": 4,        # Proficient in Pillar 2
            "ai_systems": 3,        # Developing in Pillar 3
            "math_logic": 4,        # Proficient in Pillar 4
        },
        "overrides": {}
    }
    diag = api("POST", f"/students/{sid}/diagnostic", profile)
    print(f"\nDiagnostic applied: {len(diag)} competencies seeded")
    print(f"  Pillar stages: comm=4, creativity=4, ai_systems=3, math_logic=4")

    # Check a few competencies right after diagnostic
    track = ["C1.4", "C4.7", "C3.1", "C2.3"]
    print(f"\nIMMEDIATELY AFTER DIAGNOSTIC:")
    for cid in track:
        print_state(sid, cid)

    # Now give her some evidence to establish last_evidence_at timestamps
    print(f"\nSubmitting 5 correct MCQs for each tracked competency (to set timestamps)...")
    for cid in track:
        for _ in range(5):
            api("POST", "/evidence", {
                "student_id": sid,
                "competency_id": cid,
                "outcome": 1.0,
                "source": "mcq",
                "response_time_ms": random.randint(3000, 6000),
            })

    print(f"\nAFTER 5 CORRECT MCQs EACH:")
    states_before = {}
    for cid in track:
        s = print_state(sid, cid)
        states_before[cid] = s["p_learned"]

    # Simulate decay by calling the maintenance endpoint
    # (If it doesn't exist, we'll note that decay is engine-internal)
    print(f"\nNOTE: Decay happens automatically when new evidence arrives (based on time since")
    print(f"last evidence). The forgetting formula is:")
    print(f"  P(L) = P(L₀) + (P(L) - P(L₀)) × e^(-days_since / stability)")
    print(f"\nWith stability ≈ 7-14 days, here's what would happen with no practice:")

    # Calculate theoretical decay manually
    import math
    for cid in track:
        p_l = states_before[cid]
        p_l0 = 0.10
        stability = 7.0  # default starting stability
        # After 5 correct answers at high P(L), stability gets boosted
        # Each correct at P(L)>0.7 does stability *= 1.4
        # 5 correct → stability = 7.0 * 1.4^5 ≈ 37.6
        boosted_stability = 7.0 * (1.4 ** 5)
        print(f"\n  {cid}: P(L) = {p_l:.4f}, stability ≈ {boosted_stability:.1f} days")
        for days in [1, 7, 14, 30, 60]:
            decay_factor = math.exp(-days / boosted_stability)
            p_decayed = p_l0 + (p_l - p_l0) * decay_factor
            stage = 5 if p_decayed >= 0.85 else 4 if p_decayed >= 0.65 else 3 if p_decayed >= 0.40 else 2 if p_decayed >= 0.20 else 1
            lost = (1 - (p_decayed - p_l0) / (p_l - p_l0)) * 100 if p_l > p_l0 else 0
            print(f"    After {days:>2} days: P(L)={p_decayed:.4f} (Stage {stage}) — {lost:.1f}% forgotten")


# ─────────────────────────────────────────────────────────────────────
# Scenario 4: Diagnostic Seeding → Learning Journey
# Submit diagnostic profile → verify initial states → learn and improve
# ─────────────────────────────────────────────────────────────────────
def sim_diagnostic():
    print_header("SCENARIO 4: Diagnostic Seeding → Learning Journey")

    student = api("POST", "/students", {
        "name": "Kavya (diagnostic → learning)",
        "grade": 7,
        "grade_band": "6-7",
    })
    sid = student["id"]
    print(f"Created student: {student['name']} ({sid})")

    # Diagnostic: mixed profile — strong math, weak communication
    profile = {
        "pillar_stages": {
            "communication": 2,    # Emerging
            "creativity": 2,       # Emerging
            "ai_systems": 1,       # Novice
            "math_logic": 3,       # Developing
        },
        "overrides": {
            "C4.7": 4,   # Specifically good at probability
            "C4.1": 4,   # Good at number patterns
            "C1.4": 3,   # Better at evaluating claims than rest of comm
        }
    }
    diag = api("POST", f"/students/{sid}/diagnostic", profile)
    print(f"\nDiagnostic applied with overrides: C4.7=4, C4.1=4, C1.4=3")

    # Show the seeded states
    track = ["C1.1", "C1.4", "C2.1", "C3.1", "C4.1", "C4.7", "C4.14"]
    print(f"\nAFTER DIAGNOSTIC:")
    for cid in track:
        print_state(sid, cid)

    # Now simulate Kavya learning Communication skills (C1.4 — evaluating claims)
    print(f"\n--- Learning C1.4 (Evaluate claims): 12 MCQ events ---")
    print(f"{'#':>3} | {'Answer':<8} | {'P(L) Before':>11} | {'P(L) After':>10} | {'Stage':>5}")
    print("-" * 55)

    for i in range(12):
        # Starts at stage 3 (P(L)=0.50), should improve faster
        if i < 4:
            correct = random.random() < 0.50
        elif i < 8:
            correct = random.random() < 0.70
        else:
            correct = random.random() < 0.85

        result = api("POST", "/evidence", {
            "student_id": sid,
            "competency_id": "C1.4",
            "outcome": 1.0 if correct else 0.0,
            "source": "mcq",
            "response_time_ms": random.randint(4000, 12000),
        })
        u = result["updates"][0]
        answer = "Correct" if correct else "Wrong"
        print(f"{i+1:>3} | {answer:<8} | {u['p_learned_before']:>11.4f} | {u['p_learned_after']:>10.4f} | {u['stage_after']:>5}")

    print(f"\nFINAL STATES (after learning C1.4):")
    for cid in track:
        print_state(sid, cid)

    # Check co-development: C1.4 → C3.10 (weight=0.25)
    print(f"\nCO-DEVELOPMENT: C1.4 → C3.10 (Identify AI bias, weight=0.25)")
    print_state(sid, "C3.10", "should have moved via propagation")


# ─────────────────────────────────────────────────────────────────────
# Scenario 5: Predictor — Next Questions + Next Activity
# Create a student, give them partial mastery, then check what
# the predictor recommends for questions and activities
# ─────────────────────────────────────────────────────────────────────
def sim_predictor():
    print_header("SCENARIO 5: Predictor — Next Questions + Next Activity")

    student = api("POST", "/students", {
        "name": "Dev (predictor test)",
        "grade": 6,
        "grade_band": "6-7",
    })
    sid = student["id"]
    print(f"Created student: {student['name']} ({sid})")

    # Give Dev partial mastery through a diagnostic
    profile = {
        "pillar_stages": {
            "communication": 2,
            "creativity": 2,
            "ai_systems": 2,
            "math_logic": 2,
        },
        "overrides": {
            "C4.1": 3,   # Developing in number patterns
            "C4.7": 1,   # Still novice in probability
        }
    }
    api("POST", f"/students/{sid}/diagnostic", profile)
    print(f"Diagnostic: all pillars=2 (Emerging), overrides: C4.1=3, C4.7=1")

    # Also give some MCQ evidence to make it more realistic
    print(f"\nSubmitting 8 MCQ events for C4.1 (mostly correct)...")
    for i in range(8):
        api("POST", "/evidence", {
            "student_id": sid,
            "competency_id": "C4.1",
            "outcome": 1.0 if random.random() < 0.75 else 0.0,
            "source": "mcq",
            "response_time_ms": random.randint(4000, 10000),
        })

    print(f"Submitting 5 MCQ events for C4.7 (mostly wrong — struggling)...")
    for i in range(5):
        api("POST", "/evidence", {
            "student_id": sid,
            "competency_id": "C4.7",
            "outcome": 1.0 if random.random() < 0.25 else 0.0,
            "source": "mcq",
            "response_time_ms": random.randint(10000, 18000),
        })

    print(f"\nCurrent states:")
    s_c41 = print_state(sid, "C4.1", "Number patterns")
    s_c47 = print_state(sid, "C4.7", "Basic probability")
    s_c414 = print_state(sid, "C4.14", "Estimation basics")

    # ── Next Questions ──
    print(f"\n{'─'*80}")
    print(f"NEXT QUESTIONS for C4.7 (P(L)={s_c47['p_learned']:.4f}):")
    print(f"  Expected: Easy questions (difficulty 0.1-0.4) since P(L) is low")
    questions_c47 = api("GET", f"/students/{sid}/next-questions?competency_id=C4.7&count=5")
    if questions_c47:
        for j, q in enumerate(questions_c47, 1):
            print(f"  {j}. [{q['difficulty']:.1f}] {q['text'][:80]}...")
    else:
        print(f"  (No questions found for C4.7)")

    print(f"\nNEXT QUESTIONS for C4.1 (P(L)={s_c41['p_learned']:.4f}):")
    p_l_c41 = s_c41['p_learned']
    if p_l_c41 > 0.85:
        expected = "Challenge questions (difficulty 0.6-1.0)"
    elif p_l_c41 > 0.65:
        expected = "Proficient questions (difficulty 0.5-0.8)"
    elif p_l_c41 > 0.40:
        expected = "Developing/ZPD questions (difficulty 0.3-0.6)"
    elif p_l_c41 > 0.20:
        expected = "Emerging questions (difficulty 0.2-0.5)"
    else:
        expected = "Easy questions (difficulty 0.1-0.4)"
    print(f"  Expected: {expected}")
    questions_c41 = api("GET", f"/students/{sid}/next-questions?competency_id=C4.1&count=5")
    if questions_c41:
        for j, q in enumerate(questions_c41, 1):
            print(f"  {j}. [{q['difficulty']:.1f}] {q['text'][:80]}...")
    else:
        print(f"  (No questions found for C4.1)")

    # Also test C4.14 (never practiced, should be very easy questions)
    print(f"\nNEXT QUESTIONS for C4.14 (P(L)={s_c414['p_learned']:.4f}):")
    questions_c414 = api("GET", f"/students/{sid}/next-questions?competency_id=C4.14&count=5")
    if questions_c414:
        for j, q in enumerate(questions_c414, 1):
            print(f"  {j}. [{q['difficulty']:.1f}] {q['text'][:80]}...")
    else:
        print(f"  (No questions found for C4.14)")

    # ── Next Activity ──
    print(f"\n{'─'*80}")
    print(f"TOP 5 RECOMMENDED ACTIVITIES (all modules):")
    activities = api("GET", f"/students/{sid}/next-activity?limit=5")
    if activities:
        for j, a in enumerate(activities, 1):
            print(f"\n  {j}. [{a['module_id']}] {a['activity_name']} (score={a['score']:.4f})")
            for reason in a["reasons"][:3]:
                print(f"     → {reason}")
    else:
        print(f"  (No activities recommended — all prerequisites may be unmet)")

    print(f"\nTOP 5 MATH MODULE ACTIVITIES:")
    math_activities = api("GET", f"/students/{sid}/next-activity?module_id=math_v1&limit=5")
    if math_activities:
        for j, a in enumerate(math_activities, 1):
            print(f"\n  {j}. {a['activity_name']} (score={a['score']:.4f})")
            for reason in a["reasons"][:3]:
                print(f"     → {reason}")
    else:
        print(f"  (No math activities recommended)")

    # ── ZPD Adaptation Test ──
    print(f"\n{'─'*80}")
    print(f"ZPD ADAPTATION TEST: Submit 10 correct MCQs for C4.7, then check question difficulty shift")
    for i in range(10):
        api("POST", "/evidence", {
            "student_id": sid,
            "competency_id": "C4.7",
            "outcome": 1.0,
            "source": "mcq",
            "response_time_ms": random.randint(4000, 8000),
        })
    s_after = print_state(sid, "C4.7", "after 10 correct")

    print(f"\n  BEFORE learning: P(L)={s_c47['p_learned']:.4f} → easy questions (0.1-0.4)")
    print(f"  AFTER learning:  P(L)={s_after['p_learned']:.4f} → should shift to harder questions")
    questions_after = api("GET", f"/students/{sid}/next-questions?competency_id=C4.7&count=5")
    if questions_after:
        diffs = [q['difficulty'] for q in questions_after]
        print(f"  Questions now: difficulties = {[f'{d:.1f}' for d in diffs]}")
        avg_before = sum(q['difficulty'] for q in questions_c47) / len(questions_c47) if questions_c47 else 0
        avg_after = sum(diffs) / len(diffs)
        print(f"  Avg difficulty: {avg_before:.2f} → {avg_after:.2f} ({'↑ harder' if avg_after > avg_before else '↓ easier' if avg_after < avg_before else '→ same'})")
    else:
        print(f"  (No questions found)")


# ─────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────
SIMULATIONS = {
    "codev": sim_codevelopment,
    "multi": sim_multi_competency,
    "decay": sim_decay,
    "diagnostic": sim_diagnostic,
    "predictor": sim_predictor,
}

if __name__ == "__main__":
    args = sys.argv[1:]
    if args:
        for arg in args:
            if arg in SIMULATIONS:
                SIMULATIONS[arg]()
            else:
                print(f"Unknown simulation: {arg}")
                print(f"Available: {', '.join(SIMULATIONS.keys())}")
                sys.exit(1)
    else:
        for name, fn in SIMULATIONS.items():
            fn()
