"""
Backfill script: fix activity_questions where all options have is_correct=false.

Root cause: import_questions_to_activity_questions.py used opt.get("isCorrect")
but gen_questions.py stored options with is_correct (snake_case).

Fix strategy:
  1. Find activity_questions where all options are is_correct=false
  2. Match to source question in `questions` table by text (title)
  3. Copy is_correct flags from source options (snake_case key)
  4. Fallback: use questions.correct_answer ("A"/"B"/...) to set correct index

Run:
  cd backend
  python -m seed.fix_is_correct
"""
import asyncio
import copy

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import Settings

settings = Settings()
DATABASE_URL = settings.DATABASE_URL


def _all_wrong(options: list[dict]) -> bool:
    return all(not o.get("is_correct", False) for o in options)


async def run():
    engine = create_async_engine(DATABASE_URL, echo=False)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        from app.models.activity_question import ActivityQuestion
        from app.models.curriculum import Question

        # Load all source questions into a lookup dict by text
        q_result = await db.execute(select(Question))
        source_questions = q_result.scalars().all()
        print(f"Source questions loaded: {len(source_questions)}")

        # Build lookup: text[:200] -> Question
        src_by_text: dict[str, Question] = {}
        for sq in source_questions:
            src_by_text[sq.text[:200]] = sq

        # Load all activity_questions
        aq_result = await db.execute(select(ActivityQuestion))
        aqs = aq_result.scalars().all()
        print(f"ActivityQuestions loaded: {len(aqs)}")

        fixed = 0
        skipped_no_match = 0
        skipped_already_ok = 0
        skipped_no_correct = 0

        for aq in aqs:
            data = aq.data or {}
            options = data.get("options", [])

            if not options:
                skipped_already_ok += 1
                continue

            if not _all_wrong(options):
                skipped_already_ok += 1
                continue

            # Try to find source question by title match
            src = src_by_text.get(aq.title)

            if not src:
                # Try stripping to match shorter titles
                for key, val in src_by_text.items():
                    if key.startswith(aq.title[:50]):
                        src = val
                        break

            if not src:
                skipped_no_match += 1
                continue

            src_options = src.options or []
            correct_answer = src.correct_answer  # "A", "B", "C", "D" or None

            # Strategy 1: use is_correct from source options (snake_case)
            if src_options and len(src_options) == len(options):
                has_correct = any(o.get("is_correct", False) for o in src_options)
                if has_correct:
                    new_options = copy.deepcopy(options)
                    for i, opt in enumerate(new_options):
                        opt["is_correct"] = bool(src_options[i].get("is_correct", False))
                    new_data = {**data, "options": new_options}
                    aq.data = new_data
                    fixed += 1
                    continue

            # Strategy 2: use correct_answer letter index
            if correct_answer and len(correct_answer) == 1 and correct_answer.upper() in "ABCD":
                idx = ord(correct_answer.upper()) - ord("A")
                if 0 <= idx < len(options):
                    new_options = copy.deepcopy(options)
                    for i, opt in enumerate(new_options):
                        opt["is_correct"] = (i == idx)
                    new_data = {**data, "options": new_options}
                    aq.data = new_data
                    fixed += 1
                    continue

            skipped_no_correct += 1

        await db.commit()
        print(f"\nResults:")
        print(f"  Fixed:              {fixed}")
        print(f"  Already correct:    {skipped_already_ok}")
        print(f"  No source match:    {skipped_no_match}")
        print(f"  No correct answer:  {skipped_no_correct}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
