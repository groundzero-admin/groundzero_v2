"""
One-time script: import all rows from `questions` table into `activity_questions`.

Maps:
  mcq  -> mcq_single template
         data = { question, options: [{text, is_correct}], explanation? }

Run:
  cd backend
  python -m seed.import_questions_to_activity_questions
"""
import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://gz_user:gz_local_password@localhost:5432/groundzero"

MCQ_SINGLE_TEMPLATE_ID = uuid.UUID("2e1280a4-a6ba-4268-9cee-b20e50c1247f")


async def run():
    engine = create_async_engine(DATABASE_URL, echo=False)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        # Load all old questions
        from app.models.curriculum import Question
        from app.models.activity_question import ActivityQuestion

        result = await db.execute(select(Question).order_by(Question.competency_id, Question.difficulty))
        questions = result.scalars().all()
        print(f"Found {len(questions)} questions to import")

        imported = 0
        skipped = 0

        for q in questions:
            # Build mcq_single data
            options = []
            for opt in (q.options or []):
                options.append({
                    "text": opt.get("text", ""),
                    "is_correct": opt.get("isCorrect", False),
                })

            data: dict = {"question": q.text, "options": options}
            if q.explanation:
                data["explanation"] = q.explanation

            aq = ActivityQuestion(
                template_id=MCQ_SINGLE_TEMPLATE_ID,
                title=q.text[:200],
                data=data,
                grade_band=q.grade_band or "",
                competency_id=q.competency_id,
                difficulty=q.difficulty,
                is_published=True,
            )
            db.add(aq)
            imported += 1

        await db.commit()
        print(f"Done — imported: {imported}, skipped: {skipped}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
