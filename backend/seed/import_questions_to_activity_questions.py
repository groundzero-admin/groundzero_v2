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
import os

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import Settings

settings = Settings()
DATABASE_URL = settings.DATABASE_URL


async def run():
    engine = create_async_engine(DATABASE_URL, echo=False)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        from app.models.curriculum import Question
        from app.models.activity_question import ActivityQuestion
        from app.models.question_template import QuestionTemplate

        # Look up mcq_single template by slug (no hardcoded IDs)
        tmpl_result = await db.execute(
            select(QuestionTemplate).where(QuestionTemplate.slug == "mcq_single")
        )
        tmpl = tmpl_result.scalar_one_or_none()
        if not tmpl:
            print("ERROR: mcq_single template not found — run seed_question_templates first")
            return
        print(f"mcq_single template: {tmpl.id}")

        result = await db.execute(
            select(Question).order_by(Question.competency_id, Question.difficulty)
        )
        questions = result.scalars().all()
        print(f"Found {len(questions)} questions to import")

        imported = 0
        for q in questions:
            options = [
                {"text": opt.get("text", ""), "is_correct": opt.get("isCorrect", False)}
                for opt in (q.options or [])
            ]
            data: dict = {"question": q.text, "options": options}
            if q.explanation:
                data["explanation"] = q.explanation

            aq = ActivityQuestion(
                template_id=tmpl.id,
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
        print(f"Done — imported: {imported}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
