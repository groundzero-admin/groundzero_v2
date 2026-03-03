"""
Seed default teacher and admin users for development.

Run: python -m seed.seed_users
"""
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session

from app.config import Settings
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
            print(f"  Created {u['role']}: {u['email']} / {u['password']}")

        db.commit()
        print("Done.")


if __name__ == "__main__":
    seed()
