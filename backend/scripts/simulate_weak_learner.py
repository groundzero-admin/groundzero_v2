"""
Simulation: A weak student who learns on the go.

Profile:
- Starts as a Novice (P(L) = 0.10 everywhere)
- Takes MCQ quizzes for C4.7 (Basic probability) over ~30 evidence events
- Early on: mostly wrong answers (70% wrong), slow response times
- Gradually improves: by the end, 80% correct, faster responses
- Also gets some AI hints along the way
- Some facilitator observations too

This shows how BKT tracks a real learning journey.
"""

import json
import random
import sys

import requests

BASE = "http://localhost:8000/api/v1"
random.seed(42)  # reproducible


def api(method, path, data=None):
    url = f"{BASE}{path}"
    if method == "GET":
        r = requests.get(url)
    else:
        r = requests.post(url, json=data)
    r.raise_for_status()
    return r.json()


def main():
    # 1. Create a weak student
    student = api("POST", "/students", {
        "name": "Rohan (weak learner)",
        "grade": 6,
        "grade_band": "6-7",
    })
    sid = student["id"]
    print(f"Created student: {student['name']} ({sid})")
    print(f"Initial state: P(L)=0.10, Stage=1 (Novice) for all 56 competencies\n")

    # We'll track C4.7 (Basic probability) as the primary competency
    competency = "C4.7"

    # Define the learning journey: 30 events over ~4 weeks
    # Phase 1 (events 1-8): Struggling — 25% correct, slow
    # Phase 2 (events 9-16): Getting hints, starting to click — 40% correct
    # Phase 3 (events 17-24): Improving — 65% correct, faster
    # Phase 4 (events 25-30): Near mastery — 85% correct, fast

    journey = []

    # Phase 1: Struggling
    for i in range(8):
        correct = random.random() < 0.25
        journey.append({
            "outcome": 1.0 if correct else 0.0,
            "source": "mcq",
            "response_time_ms": random.randint(12000, 20000),  # slow
            "ai_interaction": "none",
            "phase": "Struggling",
        })

    # Phase 2: Getting AI hints, starting to understand
    for i in range(8):
        correct = random.random() < 0.40
        ai = random.choice(["hint", "hint", "none", "conversation"])
        journey.append({
            "outcome": 1.0 if correct else 0.0,
            "source": "mcq",
            "response_time_ms": random.randint(8000, 15000),
            "ai_interaction": ai,
            "phase": "Getting hints",
        })

    # Phase 3: Improving
    for i in range(8):
        correct = random.random() < 0.65
        journey.append({
            "outcome": 1.0 if correct else 0.0,
            "source": "mcq",
            "response_time_ms": random.randint(5000, 10000),
            "ai_interaction": "none",
            "phase": "Improving",
        })

    # Phase 4: Near mastery
    for i in range(6):
        correct = random.random() < 0.85
        journey.append({
            "outcome": 1.0 if correct else 0.0,
            "source": "mcq",
            "response_time_ms": random.randint(3000, 7000),  # fast
            "ai_interaction": "none",
            "phase": "Near mastery",
        })

    # Run the simulation
    print(f"{'#':>3} | {'Phase':<15} | {'Answer':<8} | {'RT(ms)':>7} | {'AI':>12} | {'P(L) Before':>11} | {'P(L) After':>10} | {'Stage':>5} | {'Stuck':>5}")
    print("-" * 110)

    prev_stage = 1
    milestones = []

    for i, event in enumerate(journey, 1):
        result = api("POST", "/evidence", {
            "student_id": sid,
            "competency_id": competency,
            "outcome": event["outcome"],
            "source": event["source"],
            "response_time_ms": event["response_time_ms"],
            "ai_interaction": event["ai_interaction"],
        })

        update = result["updates"][0]
        answer = "Correct" if event["outcome"] == 1.0 else "Wrong"
        ai_str = event["ai_interaction"] if event["ai_interaction"] != "none" else ""
        stage_str = f"{update['stage_before']}→{update['stage_after']}" if update['stage_before'] != update['stage_after'] else str(update['stage_after'])
        stuck_str = "STUCK" if update["is_stuck"] else ""

        print(f"{i:>3} | {event['phase']:<15} | {answer:<8} | {event['response_time_ms']:>7} | {ai_str:>12} | {update['p_learned_before']:>11.4f} | {update['p_learned_after']:>10.4f} | {stage_str:>5} | {stuck_str:>5}")

        # Track milestones
        if update["stage_after"] != prev_stage:
            milestones.append((i, prev_stage, update["stage_after"], update["p_learned_after"]))
            prev_stage = update["stage_after"]
        if update["is_stuck"] and (not milestones or milestones[-1][2] != "STUCK"):
            milestones.append((i, "→", "STUCK", update["p_learned_after"]))

    # Final state
    final = api("GET", f"/students/{sid}/state/{competency}")
    print(f"\n{'='*110}")
    print(f"FINAL STATE for {competency} (Basic probability):")
    print(f"  P(Learned):          {final['p_learned']:.4f}")
    print(f"  Stage:               {final['stage']} ({'Novice' if final['stage']==1 else 'Emerging' if final['stage']==2 else 'Developing' if final['stage']==3 else 'Proficient' if final['stage']==4 else 'Mastered'})")
    print(f"  Confidence:          {final['confidence']:.3f}")
    print(f"  Total evidence:      {final['total_evidence']}")
    print(f"  Consecutive fails:   {final['consecutive_failures']}")
    print(f"  Is stuck:            {final['is_stuck']}")
    print(f"  Avg response time:   {final['avg_response_time_ms']:.0f} ms")

    if milestones:
        print(f"\nMILESTONES:")
        for event_num, from_stage, to_stage, p_l in milestones:
            print(f"  Event #{event_num}: Stage {from_stage} → {to_stage} (P(L)={p_l:.4f})")

    # Also show co-development effect on C4.8 (conditional probability, linked to C4.7 via prereq)
    c48 = api("GET", f"/students/{sid}/state/C4.8")
    print(f"\nCO-DEVELOPMENT CHECK:")
    print(f"  C4.8 (Conditional probability): P(L)={c48['p_learned']:.4f}, Stage={c48['stage']}")
    print(f"  (C4.8 has prerequisite on C4.7, and C4.7→C4.8 is a prerequisite edge)")

    # Show evidence history count
    history = api("GET", f"/evidence?student_id={sid}&limit=200")
    prop = [e for e in history if e["is_propagated"]]
    print(f"\n  Total evidence events: {len(history)} (including {len(prop)} propagated)")


if __name__ == "__main__":
    main()
