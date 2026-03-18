"""
Backfill script: add `hint` (and fix broken MCQ correct answers) for all activity_questions.

Run from backend/:
    source .venv/bin/activate && python -m app.scripts.backfill_hints

What it does:
- For every question missing data.hint → calls LLM to generate hint
- For MCQ questions where ALL options have is_correct=false → calls LLM to fix correct answer
- Skips questions that already have hint set
"""
from __future__ import annotations

import asyncio
import json
import logging
import re

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from openai import AsyncOpenAI

from app.config import settings
from app.models.activity_question import ActivityQuestion
from app.models.question_template import QuestionTemplate

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

MCQ_SLUGS = {"mcq_single", "mcq_timed"}

HINT_PROMPT = """You are an educational content assistant.

Given the following question data (JSON), generate:
1. A `hint`: a single, specific sentence that guides a student toward the correct answer WITHOUT giving it away.
   - Bad: "Think harder" — Good: "Try counting the total number of items across both groups"
2. For MCQ questions only: verify the options list has EXACTLY ONE option with is_correct=true. If not, set the correct one.

Question slug: {slug}
Question data:
{data}

Respond with ONLY a JSON object using these rules:
- Always include "hint": "<string>"
- For MCQ slugs (mcq_single, mcq_timed): include "options": [...] with the corrected options array (same options, just fix is_correct). Keep all other option fields unchanged.
- For all other slugs: only include "hint"

Example for MCQ:
{{"hint": "Remember that fractions need a common denominator before adding.", "options": [{{"text": "1/2", "is_correct": false}}, {{"text": "2/3", "is_correct": true}}]}}

Example for non-MCQ:
{{"hint": "Think about what happens when you multiply both sides by the same number."}}
"""


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.SPARK_API_KEY,
        base_url=settings.SPARK_BASE_URL,
    )


def _mcq_all_wrong(data: dict) -> bool:
    options = data.get("options", [])
    if not options:
        return False
    for opt in options:
        if isinstance(opt, str):
            try:
                opt = json.loads(opt)
            except Exception:
                continue
        if opt.get("is_correct"):
            return True
    return False  # no correct found → all wrong


async def backfill_question(
    aq: ActivityQuestion,
    slug: str,
    client: AsyncOpenAI,
) -> dict | None:
    """Returns updated data dict, or None if no changes needed."""
    data = dict(aq.data or {})
    needs_hint = not data.get("hint") or not str(data.get("hint", "")).strip()
    needs_mcq_fix = slug in MCQ_SLUGS and not _mcq_all_wrong(data)

    if not needs_hint and not needs_mcq_fix:
        return None

    prompt = HINT_PROMPT.format(
        slug=slug,
        data=json.dumps(data, indent=2)[:3000],  # cap to avoid token overflow
    )

    try:
        resp = await client.chat.completions.create(
            model=settings.SPARK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        content = resp.choices[0].message.content or ""
        match = re.search(r"\{[\s\S]*\}", content)
        if not match:
            logger.warning("No JSON in LLM response for question %s", aq.id)
            return None
        result = json.loads(match.group())
    except Exception:
        logger.exception("LLM call failed for question %s", aq.id)
        return None

    updated = False
    if needs_hint and result.get("hint"):
        data["hint"] = result["hint"]
        updated = True

    if needs_mcq_fix and result.get("options"):
        data["options"] = result["options"]
        updated = True

    return data if updated else None


async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    client = _get_client()

    async with async_session() as session:
        # Fetch all questions with their template slug
        stmt = (
            select(ActivityQuestion, QuestionTemplate.slug)
            .outerjoin(QuestionTemplate, ActivityQuestion.template_id == QuestionTemplate.id)
            .order_by(ActivityQuestion.created_at)
        )
        rows = (await session.execute(stmt)).all()

    logger.info("Total questions: %d", len(rows))

    updated_count = 0
    skipped_count = 0

    for aq, slug in rows:
        slug = slug or "unknown"
        new_data = await backfill_question(aq, slug, client)
        if new_data is None:
            skipped_count += 1
            logger.info("SKIP  [%s] %s — already has hint", slug, str(aq.id)[:8])
            continue

        # Open a fresh session for each update to avoid stale state
        async with async_session() as session:
            obj = await session.get(ActivityQuestion, aq.id)
            if obj:
                obj.data = new_data
                await session.commit()
                updated_count += 1
                logger.info("DONE  [%s] %s — hint added", slug, str(aq.id)[:8])

    logger.info("\n=== Done: %d updated, %d skipped ===", updated_count, skipped_count)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
