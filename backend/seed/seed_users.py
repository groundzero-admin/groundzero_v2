"""
Seed default teacher, admin, and student users for development.

Run: python -m seed.seed_users
"""
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.competency import Competency
from app.models.student import Student, StudentCompetencyState
from app.models.user import User
from app.services.auth_service import hash_password

settings = Settings()
engine = create_engine(settings.DATABASE_URL_SYNC)

SEED_USERS = [
    {
        "email": "teacher@groundzero.in",
        "password": "teacher123",
        "role": "teacher",
        "full_name": "Demo Teacher",
    },
    {
        "email": "admin@groundzero.in",
        "password": "admin123",
        "role": "admin",
        "full_name": "Demo Admin",
    },
    {
        "email": "student@groundzero.in",
        "password": "student123",
        "role": "student",
        "full_name": "Demo Student",
        "student_profile": {
            "name": "Demo Student",
            "grade": 6,
            "board": "cbse",
        },
    },
]


def seed():
    with Session(engine) as db:
        for u in SEED_USERS:
            existing = db.execute(select(User).where(User.email == u["email"])).scalar_one_or_none()
            if existing:
                print(f"  Skip {u['email']} (already exists)")
                continue

            user = User(
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                role=u["role"],
                full_name=u["full_name"],
            )
            db.add(user)
            db.flush()
            print(f"  Created {u['role']}: {u['email']} / {u['password']}")

            # If student role, also create a Student record with competency states
            if u.get("student_profile"):
                profile = u["student_profile"]
                grade = profile["grade"]
                if grade <= 5:
                    grade_band = "4-5"
                elif grade <= 7:
                    grade_band = "6-7"
                else:
                    grade_band = "8-9"

                student = Student(
                    name=profile["name"],
                    grade=grade,
                    board=profile.get("board", "cbse"),
                    grade_band=grade_band,
                    user_id=user.id,
                )
                db.add(student)
                db.flush()

                # Initialize competency states
                competencies = db.execute(select(Competency)).scalars().all()
                for comp in competencies:
                    params = comp.default_params or {}
                    state = StudentCompetencyState(
                        student_id=student.id,
                        competency_id=comp.id,
                        p_learned=params.get("p_l0", 0.10),
                        p_transit=params.get("p_transit", 0.15),
                        p_guess=params.get("p_guess", 0.25),
                        p_slip=params.get("p_slip", 0.10),
                    )
                    db.add(state)
                print(f"  Created student profile: {profile['name']} (grade {grade}, {profile.get('board', 'cbse')})")

        db.commit()
        print("Done.")


if __name__ == "__main__":
    seed()
