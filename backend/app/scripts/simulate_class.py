"""
Real simulation: creates students and submits answers through the actual /evidence API.

- Fetches real questions from the DB
- For wrong-answer students: picks the wrong MCQ option and submits it
- For correct-answer students: picks the correct option
- The evidence service runs BKT update + fires misconception LLM analysis
- Class report will show real LLM-classified misconceptions

Usage:
    python -m app.scripts.simulate_class [--reset] [--students N]
"""

from __future__ import annotations

import asyncio
import random
import uuid
import os
import sys
import argparse
import httpx

from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

DB_URL = os.environ["DATABASE_URL"].replace("postgresql://", "postgresql+asyncpg://")
API_BASE = "http://localhost:8001/api/v1"
COHORT_ID = "9f1eb50e-b3b3-4ea7-8a59-7de77a0aa86c"
SESSION_ID = "0faec9bf-9d1d-4608-be4a-32b0ff1c3de7"
COMPS = ["C4.14.6", "C4.15.6", "C4.19.6"]

# archetype, n_questions, correct_rate
ARCHETYPES = [
    ("conceptual_gap",  8, 0.15),
    ("conceptual_gap",  6, 0.15),
    ("procedural_slip", 7, 0.45),
    ("procedural_slip", 6, 0.45),
    ("careless",        5, 0.65),
    ("careless",        5, 0.65),
    ("mastered",        4, 0.90),
    ("mastered",        3, 0.90),
]


def get_wrong_option(options: list[dict]) -> int:
    """Return index of a wrong option."""
    wrong = [i for i, o in enumerate(options) if not o.get("is_correct")]
    return random.choice(wrong) if wrong else 0


def get_correct_option(options: list[dict]) -> int:
    """Return index of the correct option."""
    correct = [i for i, o in enumerate(options) if o.get("is_correct")]
    return correct[0] if correct else 0


async def create_student(db: AsyncSession, archetype: str, idx: int) -> tuple[uuid.UUID, uuid.UUID, str]:
    """Create user + student + enrol. Returns (user_id, student_id, token)."""
    name = f"Sim {archetype.replace('_', ' ').title()} {idx}"
    email = f"sim_{archetype}_{idx}@sim.groundzero.in"
    # Use a real bcrypt hash for 'sim123'
    hashed_pw = "$2b$12$9bmC1lyDmXxl0pvpYgZ2guKya6JnAdrDsdPJ7gZpaEYRpoDCdFA7."

    user_id = uuid.uuid4()
    await db.execute(text("""
        INSERT INTO users (id, email, full_name, hashed_password, role, is_active, created_at, updated_at)
        VALUES (:uid, :email, :name, :pw, 'student', true, now(), now())
        ON CONFLICT (email) DO NOTHING
    """), {"uid": user_id, "email": email, "name": name, "pw": hashed_pw})

    row = (await db.execute(text("SELECT id FROM users WHERE email=:e"), {"e": email})).fetchone()
    if not row:
        raise RuntimeError(f"Failed to create user {email}")
    user_id = row[0]

    student_id = uuid.uuid4()
    await db.execute(text("""
        INSERT INTO students (id, user_id, name, grade, grade_band, board, cohort_id, created_at, updated_at)
        VALUES (:sid, :uid, :name, 6, '6-7', 'cbse', :cid, now(), now())
        ON CONFLICT (user_id) DO NOTHING
    """), {"sid": student_id, "uid": user_id, "name": name, "cid": COHORT_ID})

    row2 = (await db.execute(text("SELECT id FROM students WHERE user_id=:u"), {"u": user_id})).fetchone()
    if not row2:
        raise RuntimeError(f"No student for user {user_id}")
    student_id = row2[0]

    await db.execute(text("""
        INSERT INTO cohort_enrollments (id, cohort_id, student_id, enrolled_at)
        VALUES (:eid, :cid, :sid, now())
        ON CONFLICT (cohort_id, student_id) DO NOTHING
    """), {"eid": uuid.uuid4(), "cid": COHORT_ID, "sid": student_id})

    await db.commit()
    return user_id, student_id, name


async def get_admin_token(client: httpx.AsyncClient) -> str:
    """Login as admin and return JWT token for submitting evidence on behalf of students."""
    r = await client.post(f"{API_BASE}/auth/login", json={"email": "admin@groundzero.in", "password": "admin123"})
    if r.status_code != 200:
        raise RuntimeError(f"Admin login failed: {r.text}")
    return r.json()["access_token"]


async def get_questions(db: AsyncSession, comp_id: str, n: int) -> list[dict]:
    """Fetch n real questions for a competency."""
    r = await db.execute(text("""
        SELECT id, competency_id, data
        FROM activity_questions
        WHERE competency_id = :cid AND grade_band = '6-7'
        AND data->'options' IS NOT NULL
        ORDER BY random()
        LIMIT :n
    """), {"cid": comp_id, "n": n})
    return [{"id": row[0], "competency_id": row[1], "data": row[2]} for row in r.fetchall()]


async def submit_answer(
    client: httpx.AsyncClient,
    token: str,
    student_id: uuid.UUID,
    question: dict,
    correct_rate: float,
) -> dict:
    """Submit an answer to /evidence. Picks correct/wrong option based on correct_rate."""
    options = question["data"].get("options", [])
    is_correct = random.random() < correct_rate

    if is_correct:
        selected = get_correct_option(options)
    else:
        selected = get_wrong_option(options)

    payload = {
        "student_id": str(student_id),
        "competency_id": question["competency_id"],
        "session_id": SESSION_ID,
        "activity_question_id": str(question["id"]),
        "response": {"selected": selected},
        "response_time_ms": random.randint(8000, 40000),
        "source": "mcq",
    }

    r = await client.post(
        f"{API_BASE}/evidence",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    if r.status_code not in (200, 201):
        print(f"    ⚠ Evidence submit failed: {r.status_code} {r.text[:300]}")
        return {}
    result = r.json()
    outcome = result.get("event", {}).get("outcome", 0)
    return {"outcome": outcome, "correct": outcome >= 0.5}


async def reset_sim_students(db: AsyncSession) -> None:
    sim_user_ids = (await db.execute(text(
        "SELECT id FROM users WHERE email LIKE 'sim_%@sim.groundzero.in'"
    ))).fetchall()
    sim_uids = [r[0] for r in sim_user_ids]
    if sim_uids:
        sim_student_ids = (await db.execute(text(
            "SELECT id FROM students WHERE user_id = ANY(:ids)"
        ), {"ids": sim_uids})).fetchall()
        sids = [r[0] for r in sim_student_ids]
        if sids:
            await db.execute(text("DELETE FROM evidence_events WHERE student_id = ANY(:ids)"), {"ids": sids})
            await db.execute(text("DELETE FROM student_competency_states WHERE student_id = ANY(:ids)"), {"ids": sids})
            await db.execute(text("DELETE FROM cohort_enrollments WHERE student_id = ANY(:ids)"), {"ids": sids})
            await db.execute(text("DELETE FROM students WHERE id = ANY(:ids)"), {"ids": sids})
        await db.execute(text("DELETE FROM users WHERE id = ANY(:ids)"), {"ids": sim_uids})
    await db.commit()
    print("Reset: removed previous simulation students.")


async def run(reset: bool, n_students: int) -> None:
    engine = create_async_engine(DB_URL, echo=False)

    async with AsyncSession(engine) as db:
        if reset:
            await reset_sim_students(db)

        # Create students
        students = []
        for i, (archetype, n_q, correct_rate) in enumerate(ARCHETYPES[:n_students]):
            user_id, student_id, name = await create_student(db, archetype, i + 1)
            students.append((archetype, student_id, name, n_q, correct_rate))
            print(f"  ✓ Created {name} → {student_id}")

    # Submit answers through the real API using admin token
    async with httpx.AsyncClient(timeout=30) as client:
        token = await get_admin_token(client)
        async with AsyncSession(engine) as db:
            for archetype, student_id, name, n_q, correct_rate in students:
                correct_total = 0
                total = 0

                for comp_id in COMPS:
                    questions = await get_questions(db, comp_id, n_q)
                    if not questions:
                        print(f"    ⚠ No questions found for {comp_id}")
                        continue

                    for q in questions:
                        result = await submit_answer(client, token, student_id, q, correct_rate)
                        if result:
                            total += 1
                            if result.get("correct"):
                                correct_total += 1
                        await asyncio.sleep(0.05)

                print(f"  ✓ {name}: {correct_total}/{total} correct across {len(COMPS)} competencies")

    print(f"\nDone. {len(students)} students simulated with real questions.")
    print(f"Misconception LLM analysis fires async — wait ~30s then check:")
    print(f"  http://localhost:3000/admin/sessions/{SESSION_ID}/class-report")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--students", type=int, default=8)
    args = parser.parse_args()
    asyncio.run(run(reset=args.reset, n_students=min(args.students, len(ARCHETYPES))))


if __name__ == "__main__":
    main()
