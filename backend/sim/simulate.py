"""
BKT Engine Simulator — creates student profiles, runs evidence sequences, outputs JSON.

Usage:
    cd backend && python -m sim.simulate

Outputs: sim/results.json (consumed by sim/viewer.html)
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

from app.engine.bkt import BKTEngine
from app.engine.propagation import build_prerequisite_ancestor_map, build_postrequisite_map
from app.engine.types import BKTParams, CompetencyState, EvidenceInput, PrerequisiteLink

engine = BKTEngine()

SEED_DIR = Path(__file__).parent.parent / "seed"

# Load real prerequisite edges
with open(SEED_DIR / "prerequisite_edges.json") as f:
    PREREQ_EDGES = json.load(f)

# Load real competencies
with open(SEED_DIR / "competencies.json") as f:
    comp_data = json.load(f)
    ALL_COMPETENCIES = {c["id"]: c["name"] for c in comp_data["competencies"]}

# Load co-dev edges
with open(SEED_DIR / "codevelopment_edges.json") as f:
    CODEV_EDGES = json.load(f)

# Math competency IDs by grade
MATH_SKILLS = {
    "number_sense": ["C4.14.4", "C4.14.5", "C4.14.6", "C4.14.7", "C4.14.8", "C4.14.9"],
    "fractions": ["C4.15.4", "C4.15.5", "C4.15.6", "C4.15.7"],
    "decimals": ["C4.16.5", "C4.16.6", "C4.16.7"],
    "ratios": ["C4.17.6", "C4.17.7", "C4.17.8"],
    "algebra": ["C4.18.5", "C4.18.6", "C4.18.7", "C4.18.8", "C4.18.9"],
    "geometry": ["C4.19.4", "C4.19.5", "C4.19.6", "C4.19.7", "C4.19.8", "C4.19.9"],
}

# Non-math skills (subset for simulation)
REASONING_SKILLS = ["C4.1", "C4.2", "C4.3", "C4.4", "C4.6", "C4.7", "C4.8"]
COMM_SKILLS = ["C1.1", "C1.3", "C1.5"]

# Flatten math skills
ALL_MATH_IDS = []
for ids in MATH_SKILLS.values():
    ALL_MATH_IDS.extend(ids)


def get_grade_skills(grade: int) -> list[str]:
    """Get math skills relevant for a given grade."""
    skills = []
    for area_ids in MATH_SKILLS.values():
        for sid in area_ids:
            skill_grade = int(sid.split(".")[-1])
            if skill_grade <= grade:
                skills.append(sid)
    return skills


def build_codev_links(competency_id: str):
    """Build co-development links for a competency from real edges."""
    from app.engine.types import CodevelopmentLink
    links = []
    for e in CODEV_EDGES:
        if e["source_id"] == competency_id:
            links.append(CodevelopmentLink(linked_competency_id=e["target_id"], transfer_weight=e["transfer_weight"]))
        elif e["target_id"] == competency_id:
            links.append(CodevelopmentLink(linked_competency_id=e["source_id"], transfer_weight=e["transfer_weight"]))
    return links


class SimStudent:
    """A simulated student with a skill profile."""

    def __init__(self, name: str, grade: int, profile: str, true_mastery: dict[str, float]):
        self.name = name
        self.grade = grade
        self.profile = profile
        self.true_mastery = true_mastery  # simulated "real" skill level (drives correct/wrong)
        self.states: dict[str, CompetencyState] = {}
        self.history: list[dict] = []  # timeline of events

        # Init BKT state for all skills this student might encounter
        all_skill_ids = set(get_grade_skills(grade) + REASONING_SKILLS + COMM_SKILLS)
        params = BKTParams()
        for sid in all_skill_ids:
            self.states[sid] = engine.init_state(sid, params)

    def simulate_answer(self, competency_id: str, rng: random.Random) -> float:
        """Simulate whether the student gets it right, based on their true mastery."""
        true_p = self.true_mastery.get(competency_id, 0.1)
        return 1.0 if rng.random() < true_p else 0.0

    def submit_evidence(self, competency_id: str, outcome: float, timestamp: datetime,
                        response_time_ms: int = 5000) -> dict:
        """Run the BKT pipeline for one evidence event."""
        state = self.states.get(competency_id)
        if state is None:
            return {}

        # Build propagation data
        ancestor_links = build_prerequisite_ancestor_map(PREREQ_EDGES, competency_id)
        postreq_links = build_postrequisite_map(PREREQ_EDGES, competency_id)
        codev_links = build_codev_links(competency_id)

        evidence = EvidenceInput(
            student_id=self.name,
            competency_id=competency_id,
            outcome=outcome,
            source="mcq",
            weight=1.0,
            response_time_ms=response_time_ms,
            timestamp=timestamp,
        )

        updated_state, results = engine.process_evidence(
            state, evidence, codev_links, self.states,
            prerequisite_links=ancestor_links,
            postrequisite_links=postreq_links,
        )

        self.states[competency_id] = updated_state

        # Record in history
        event = {
            "time": timestamp.isoformat(),
            "competency_id": competency_id,
            "competency_name": ALL_COMPETENCIES.get(competency_id, competency_id),
            "outcome": outcome,
            "p_learned_before": results[0].p_learned_before,
            "p_learned_after": results[0].p_learned_after,
            "stage_before": results[0].stage_before,
            "stage_after": results[0].stage_after,
            "is_stuck": results[0].is_stuck,
            "propagated": [
                {
                    "competency_id": r.competency_id,
                    "competency_name": ALL_COMPETENCIES.get(r.competency_id, r.competency_id),
                    "delta": round(r.delta_transferred or 0, 4),
                    "p_learned_after": round(r.p_learned_after, 4),
                }
                for r in results[1:]
            ],
        }
        self.history.append(event)
        return event

    def snapshot(self) -> dict:
        """Current state of all competencies."""
        return {
            sid: {
                "p_learned": round(s.p_learned, 4),
                "stage": s.stage,
                "confidence": round(s.confidence, 4),
                "is_stuck": s.is_stuck,
                "total_evidence": s.total_evidence,
                "stability": round(s.stability, 1),
                "last_evidence_at": s.last_evidence_at.isoformat() if s.last_evidence_at else None,
                "name": ALL_COMPETENCIES.get(sid, sid),
            }
            for sid, s in sorted(self.states.items())
        }


def create_weak_student(grade: int) -> SimStudent:
    """Weak student: low true mastery, especially on current grade skills."""
    true_mastery = {}
    for sid in get_grade_skills(grade) + REASONING_SKILLS + COMM_SKILLS:
        parts = sid.split(".")
        if len(parts) == 3:  # grade-level math
            skill_grade = int(parts[-1])
            if skill_grade <= grade - 2:
                true_mastery[sid] = 0.5  # okay at stuff 2+ grades below
            elif skill_grade == grade - 1:
                true_mastery[sid] = 0.3  # struggles at one grade below
            else:
                true_mastery[sid] = 0.15  # almost guessing at grade level
        else:
            true_mastery[sid] = 0.3  # generally weak on reasoning/comm
    return SimStudent(f"Weak-Gr{grade}", grade, "weak", true_mastery)


def create_average_student(grade: int) -> SimStudent:
    """Average student: solid on below-grade, developing at grade level."""
    true_mastery = {}
    for sid in get_grade_skills(grade) + REASONING_SKILLS + COMM_SKILLS:
        parts = sid.split(".")
        if len(parts) == 3:
            skill_grade = int(parts[-1])
            if skill_grade <= grade - 2:
                true_mastery[sid] = 0.85
            elif skill_grade == grade - 1:
                true_mastery[sid] = 0.7
            else:
                true_mastery[sid] = 0.5
        else:
            true_mastery[sid] = 0.6
    return SimStudent(f"Avg-Gr{grade}", grade, "average", true_mastery)


def create_strong_student(grade: int) -> SimStudent:
    """Strong student: high mastery across the board."""
    true_mastery = {}
    for sid in get_grade_skills(grade) + REASONING_SKILLS + COMM_SKILLS:
        parts = sid.split(".")
        if len(parts) == 3:
            skill_grade = int(parts[-1])
            if skill_grade <= grade - 1:
                true_mastery[sid] = 0.95
            else:
                true_mastery[sid] = 0.8
        else:
            true_mastery[sid] = 0.85
    return SimStudent(f"Strong-Gr{grade}", grade, "strong", true_mastery)


def run_simulation(student: SimStudent, weeks: int = 6, sessions_per_week: int = 3,
                   questions_per_session: int = 8, rng: random.Random | None = None) -> dict:
    """Simulate N weeks of practice for a student."""
    if rng is None:
        rng = random.Random(42)

    start_date = datetime(2026, 1, 5, 10, 0, 0)  # Monday morning
    grade_skills = get_grade_skills(student.grade)
    all_skills = grade_skills + REASONING_SKILLS

    snapshots = []
    # Take initial snapshot
    snapshots.append({"week": 0, "day": 0, "label": "Start", "states": student.snapshot()})

    for week in range(weeks):
        for session in range(sessions_per_week):
            day_offset = week * 7 + session * 2 + rng.randint(0, 1)
            session_time = start_date + timedelta(days=day_offset, hours=rng.randint(0, 3))

            # Pick skills to practice this session
            # Bias toward grade-level skills with some below-grade review
            session_skills = []
            for _ in range(questions_per_session):
                if rng.random() < 0.7:
                    # Grade level or one below
                    candidates = [s for s in grade_skills
                                  if len(s.split(".")) == 3 and
                                  int(s.split(".")[-1]) >= student.grade - 1]
                    if not candidates:
                        candidates = grade_skills
                else:
                    # Any skill (including reasoning)
                    candidates = all_skills
                session_skills.append(rng.choice(candidates))

            for i, skill_id in enumerate(session_skills):
                t = session_time + timedelta(minutes=i * 2)
                outcome = student.simulate_answer(skill_id, rng)
                rt = rng.randint(3000, 15000)
                student.submit_evidence(skill_id, outcome, t, rt)

        # Snapshot at end of each week
        snapshots.append({
            "week": week + 1,
            "day": (week + 1) * 7,
            "label": f"Week {week + 1}",
            "states": student.snapshot(),
        })

    return {
        "student": {
            "name": student.name,
            "grade": student.grade,
            "profile": student.profile,
        },
        "config": {
            "weeks": weeks,
            "sessions_per_week": sessions_per_week,
            "questions_per_session": questions_per_session,
        },
        "history": student.history,
        "snapshots": snapshots,
    }


def main():
    print("Running BKT Engine Simulations...\n")

    students = [
        create_weak_student(6),
        create_average_student(6),
        create_strong_student(6),
        create_weak_student(8),
        create_average_student(8),
        create_strong_student(8),
    ]

    results = []
    for student in students:
        print(f"  Simulating {student.name} ({student.profile}, Grade {student.grade})...")
        rng = random.Random(hash(student.name) % 2**32)
        result = run_simulation(student, weeks=6, sessions_per_week=3,
                                questions_per_session=8, rng=rng)

        # Summary
        final = result["snapshots"][-1]["states"]
        math_skills = {k: v for k, v in final.items() if k.startswith("C4.1")}
        avg_pl = sum(v["p_learned"] for v in math_skills.values()) / len(math_skills) if math_skills else 0
        stuck_count = sum(1 for v in final.values() if v["is_stuck"])
        print(f"    → {len(result['history'])} events, avg math P(L)={avg_pl:.2f}, stuck={stuck_count}")

        results.append(result)

    output_path = Path(__file__).parent / "results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\nResults written to {output_path}")
    print(f"Open sim/viewer.html in a browser to visualize.")


if __name__ == "__main__":
    main()
