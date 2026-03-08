"""
Live BKT Simulation Server.

Runs the real BKT engine via a tiny FastAPI app.
The frontend submits evidence, the server runs the engine, returns updated state.

Usage:
    cd backend && python -m sim.server
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from collections import defaultdict

from app.engine.bkt import BKTEngine, STAGE_THRESHOLDS
from app.engine.propagation import build_prerequisite_ancestor_map
from app.engine.types import BKTParams, CompetencyState, EvidenceInput

SEED_DIR = Path(__file__).parent.parent / "seed"
SIM_DIR = Path(__file__).parent

# Load seed data
with open(SEED_DIR / "prerequisite_edges.json") as f:
    PREREQ_EDGES = json.load(f)

with open(SEED_DIR / "competencies.json") as f:
    comp_data = json.load(f)
    ALL_COMPETENCIES = {c["id"]: c for c in comp_data["competencies"]}

with open(SEED_DIR / "questions_math.json") as f:
    QUESTIONS = json.load(f)

with open(SEED_DIR / "questions.json") as f:
    QUESTIONS += json.load(f)

engine = BKTEngine()

# Build prereq adjacency: target -> list of source prerequisites
PREREQS_OF: dict[str, list[str]] = defaultdict(list)
for _e in PREREQ_EDGES:
    PREREQS_OF[_e["target_id"]].append(_e["source_id"])

_PREREQ_READY_STAGE = 3  # Developing

# In-memory student states
students: dict[str, dict] = {}  # student_id -> { states, history, created_at, config }


MATH_AREAS = {
    "C4.14": "Number Sense",
    "C4.15": "Fractions",
    "C4.16": "Decimals & Percentages",
    "C4.17": "Ratios & Proportion",
    "C4.18": "Algebra",
    "C4.19": "Geometry",
}


def get_skill_area(cid: str) -> str:
    prefix = ".".join(cid.split(".")[:2])
    return MATH_AREAS.get(prefix, "Other")


def get_grade_skills(grade: int) -> list[str]:
    skills = []
    for c in ALL_COMPETENCIES.values():
        cid = c["id"]
        parts = cid.split(".")
        if len(parts) == 3 and parts[0] == "C4":
            skill_grade = int(parts[-1])
            if skill_grade <= grade:
                skills.append(cid)
        elif cid.startswith("C4.") and len(parts) == 2:
            skills.append(cid)
        elif not cid.startswith("C4"):
            skills.append(cid)
    return skills


# Student profiles: true mastery by grade distance
PROFILES = {
    "weak": {"below_2": 0.45, "below_1": 0.25, "at_grade": 0.15, "non_math": 0.25},
    "average": {"below_2": 0.85, "below_1": 0.65, "at_grade": 0.45, "non_math": 0.55},
    "strong": {"below_2": 0.95, "below_1": 0.85, "at_grade": 0.75, "non_math": 0.80},
}


app = FastAPI(title="BKT Simulation")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class CreateStudentReq(BaseModel):
    name: str
    grade: int
    profile: str  # weak, average, strong


class SubmitEvidenceReq(BaseModel):
    student_id: str
    competency_id: str
    outcome: float  # 0.0 or 1.0
    response_time_ms: int = 5000


class AutoPlayReq(BaseModel):
    student_id: str
    num_events: int = 10
    day_offset: int = 0  # simulate N days after creation


@app.get("/")
async def serve_ui():
    return FileResponse(SIM_DIR / "live.html")


@app.get("/api/competencies")
async def get_competencies():
    """Return all competencies grouped by area."""
    result = {}
    for cid, c in sorted(ALL_COMPETENCIES.items()):
        area = get_skill_area(cid)
        if area not in result:
            result[area] = []
        result[area].append({"id": cid, "name": c["name"]})
    return result


@app.get("/api/questions")
async def get_questions(competency_id: str | None = None):
    """Return questions, optionally filtered by competency."""
    qs = QUESTIONS
    if competency_id:
        qs = [q for q in qs if q["competency_id"] == competency_id]
    return qs[:20]


@app.get("/api/prereq-graph")
async def get_prereq_graph():
    """Return prerequisite edges for visualization."""
    return PREREQ_EDGES


@app.post("/api/students")
async def create_student(req: CreateStudentReq):
    """Create a simulated student with initial BKT state."""
    sid = f"{req.name}-{req.grade}-{req.profile}"
    params = BKTParams()
    skills = get_grade_skills(req.grade)
    profile = PROFILES.get(req.profile, PROFILES["average"])

    states = {}
    true_mastery = {}
    for skill_id in skills:
        states[skill_id] = engine.init_state(skill_id, params)
        parts = skill_id.split(".")
        if len(parts) == 3:
            skill_grade = int(parts[-1])
            diff = req.grade - skill_grade
            if diff >= 2:
                true_mastery[skill_id] = profile["below_2"]
            elif diff == 1:
                true_mastery[skill_id] = profile["below_1"]
            else:
                true_mastery[skill_id] = profile["at_grade"]
        else:
            true_mastery[skill_id] = profile["non_math"]

    students[sid] = {
        "states": states,
        "history": [],
        "true_mastery": true_mastery,
        "config": {"name": req.name, "grade": req.grade, "profile": req.profile},
        "created_at": datetime.utcnow(),
        "event_count": 0,
    }

    return {"student_id": sid, "skill_count": len(skills), "config": students[sid]["config"]}


@app.get("/api/students/{student_id}/state")
async def get_student_state(student_id: str):
    """Return current state of all competencies for a student."""
    if student_id not in students:
        return JSONResponse({"error": "Student not found"}, 404)

    s = students[student_id]
    state_list = []
    for sid, st in sorted(s["states"].items()):
        comp = ALL_COMPETENCIES.get(sid, {})
        state_list.append({
            "id": sid,
            "name": comp.get("name", sid),
            "area": get_skill_area(sid),
            "p_learned": round(st.p_learned, 4),
            "stage": st.stage,
            "confidence": round(st.confidence, 4),
            "is_stuck": st.is_stuck,
            "total_evidence": st.total_evidence,
            "stability": round(st.stability, 1),
            "consecutive_failures": st.consecutive_failures,
            "last_evidence_at": st.last_evidence_at.isoformat() if st.last_evidence_at else None,
        })
    return {
        "config": s["config"],
        "event_count": s["event_count"],
        "states": state_list,
        "history_count": len(s["history"]),
    }


@app.get("/api/students/{student_id}/history")
async def get_student_history(student_id: str, last: int = 50):
    if student_id not in students:
        return JSONResponse({"error": "Student not found"}, 404)
    return students[student_id]["history"][-last:]


@app.post("/api/evidence")
async def submit_evidence(req: SubmitEvidenceReq):
    """Submit a single evidence event, run BKT, return result."""
    if req.student_id not in students:
        return JSONResponse({"error": "Student not found"}, 404)

    s = students[req.student_id]
    state = s["states"].get(req.competency_id)
    if state is None:
        return JSONResponse({"error": f"Competency {req.competency_id} not tracked for this student"}, 400)

    s["event_count"] += 1
    # Simulate time progression: each event is ~2 hours after the last
    if s["history"]:
        last_time = datetime.fromisoformat(s["history"][-1]["time"])
        now = last_time + timedelta(hours=2, minutes=random.randint(0, 60))
    else:
        now = s["created_at"] + timedelta(hours=1)

    ancestor_links = build_prerequisite_ancestor_map(PREREQ_EDGES, req.competency_id)

    evidence = EvidenceInput(
        student_id=req.student_id,
        competency_id=req.competency_id,
        outcome=req.outcome,
        source="mcq",
        weight=1.0,
        response_time_ms=req.response_time_ms,
        timestamp=now,
    )

    updated_state, results = engine.process_evidence(
        state, evidence, [], s["states"],
        prerequisite_links=ancestor_links,
    )
    s["states"][req.competency_id] = updated_state

    event_record = {
        "time": now.isoformat(),
        "event_num": s["event_count"],
        "competency_id": req.competency_id,
        "competency_name": ALL_COMPETENCIES.get(req.competency_id, {}).get("name", req.competency_id),
        "outcome": req.outcome,
        "p_learned_before": round(results[0].p_learned_before, 4),
        "p_learned_after": round(results[0].p_learned_after, 4),
        "stage_before": results[0].stage_before,
        "stage_after": results[0].stage_after,
        "is_stuck": results[0].is_stuck,
        "fire_refreshed": [
            {
                "competency_id": cid,
                "competency_name": ALL_COMPETENCIES.get(cid, {}).get("name", cid),
            }
            for cid in results[0].fire_refreshed
        ],
    }
    s["history"].append(event_record)

    return event_record


@app.post("/api/autoplay")
async def autoplay(req: AutoPlayReq):
    """Auto-simulate N evidence events based on student's true mastery profile."""
    if req.student_id not in students:
        return JSONResponse({"error": "Student not found"}, 404)

    s = students[req.student_id]
    grade = s["config"]["grade"]
    grade_skills = [sid for sid in s["states"] if len(sid.split(".")) == 3 and int(sid.split(".")[-1]) >= grade - 1]
    if not grade_skills:
        grade_skills = list(s["states"].keys())

    rng = random.Random()
    events = []

    for i in range(req.num_events):
        skill_id = rng.choice(grade_skills)
        true_p = s["true_mastery"].get(skill_id, 0.3)
        outcome = 1.0 if rng.random() < true_p else 0.0
        rt = rng.randint(3000, 15000)

        result = await submit_evidence(SubmitEvidenceReq(
            student_id=req.student_id,
            competency_id=skill_id,
            outcome=outcome,
            response_time_ms=rt,
        ))
        events.append(result)

    return {"events_played": len(events), "last_event": events[-1] if events else None}


@app.get("/api/students/{student_id}/frontier")
async def get_frontier(student_id: str, limit: int = 15):
    """Find the student's learning frontier using the prerequisite graph."""
    if student_id not in students:
        return JSONResponse({"error": "Student not found"}, 404)

    s = students[student_id]
    now = datetime.utcnow()
    if s["history"]:
        now = datetime.fromisoformat(s["history"][-1]["time"])

    frontier = []
    for cid, state in s["states"].items():
        # Skip mastered
        if state.stage >= 5:
            continue

        # Check prereqs met
        prereq_ids = PREREQS_OF.get(cid, [])
        prereqs_met = True
        for pid in prereq_ids:
            pstate = s["states"].get(pid)
            if pstate is None or pstate.stage < _PREREQ_READY_STAGE:
                prereqs_met = False
                break
        if not prereqs_met:
            continue

        # Compute priority
        reasons = []
        priority = 0.0
        p_l = state.p_learned

        # Factor 1: ZPD targeting
        if 0.20 <= p_l <= 0.70:
            priority += 2.0
            reasons.append(f"in learning zone (P(L)={p_l:.0%})")
        elif p_l < 0.20 and state.total_evidence > 0:
            priority += 1.5
            reasons.append(f"struggling (P(L)={p_l:.0%}, {state.total_evidence} attempts)")
        elif p_l < 0.20:
            priority += 0.5
            reasons.append("not started yet")
        else:
            priority += 1.0
            reasons.append(f"close to mastery (P(L)={p_l:.0%})")

        # Factor 2: Stuck
        if state.is_stuck:
            priority += 3.0
            reasons.append("stuck (4+ consecutive failures)")

        # Factor 3: Decay urgency
        if state.last_evidence_at:
            days_since = (now - state.last_evidence_at).total_seconds() / 86400.0
            if days_since > state.stability:
                priority += 1.5
                reasons.append(f"decaying ({days_since:.0f}d, half-life={state.stability:.0f}d)")
            elif days_since > state.stability * 0.5:
                priority += 0.5
                reasons.append(f"needs review ({days_since:.0f}d)")

        # Factor 4: Graph depth
        if prereq_ids:
            priority += len(prereq_ids) * 0.2

        comp = ALL_COMPETENCIES.get(cid, {})
        frontier.append({
            "competency_id": cid,
            "competency_name": comp.get("name", cid),
            "area": get_skill_area(cid),
            "p_learned": round(p_l, 4),
            "stage": state.stage,
            "priority": round(priority, 3),
            "reasons": reasons,
            "total_evidence": state.total_evidence,
        })

    frontier.sort(key=lambda x: x["priority"], reverse=True)
    return frontier[:limit]


if __name__ == "__main__":
    import uvicorn
    print("Starting BKT Simulation Server on http://localhost:8899")
    print("Open http://localhost:8899 in your browser\n")
    uvicorn.run(app, host="0.0.0.0", port=8899, log_level="warning")
