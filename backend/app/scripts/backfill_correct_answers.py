"""
Backfill correct answers for deterministic question types.

Run: cd backend && source .venv/bin/activate && python -m app.scripts.backfill_correct_answers

For MCQ (mcq_single, mcq_timed):   fix options so exactly one has is_correct=true
For slider_input:                   ensure correct_value is set
For fill_blanks:                    ensure answers array is set
For drag_drop_classifier/placement: ensure correct_placements/mapping is set
"""
from __future__ import annotations

import asyncio
import json
import logging
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from openai import AsyncOpenAI

from app.config import settings
from app.models.activity_question import ActivityQuestion
from app.models.question_template import QuestionTemplate

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def _mcq_has_correct(data: dict) -> bool:
    for opt in data.get("options", []):
        if isinstance(opt, str):
            try:
                opt = json.loads(opt)
            except Exception:
                continue
        if opt.get("is_correct"):
            return True
    return False


def _needs_fix(slug: str, data: dict) -> bool:
    if slug in ("mcq_single", "mcq_timed"):
        return not _mcq_has_correct(data)
    if slug == "slider_input":
        return data.get("correct_value") is None
    if slug == "fill_blanks":
        return not data.get("answers")
    if slug in ("drag_drop_classifier", "drag_drop_placement"):
        return not data.get("correct_placements") and not data.get("correct_mapping")
    return False


MCQ_FIX_PROMPT = """You are an educational content expert. Given this MCQ question, identify which option is correct and return ONLY a JSON array of options with exactly one having is_correct=true. Keep all other fields unchanged.

Question data:
{data}

Return ONLY the JSON array: [{{"text": "...", "is_correct": false}}, ...]"""

SLIDER_FIX_PROMPT = """Given this slider question, determine the correct numeric value and return ONLY JSON with "correct_value" set.

Question data:
{data}

Return ONLY: {{"correct_value": <number>}}"""

FILL_BLANKS_FIX_PROMPT = """Given this fill-in-the-blank question, determine the correct answer(s) for each blank and return ONLY JSON with "answers" as an array of strings (one per blank, in order).

Question data:
{data}

Return ONLY: {{"answers": ["answer1", "answer2", ...]}}"""

DRAG_DROP_FIX_PROMPT = """Given this drag-and-drop question, determine the correct placement/mapping and return ONLY JSON.
For classifier: {{"correct_placements": {{"item": "category", ...}}}}
For placement: {{"correct_placements": {{"item": "zone", ...}}}}

Question data:
{data}

Return ONLY the JSON object."""


async def fix_question(slug: str, data: dict, client: AsyncOpenAI) -> dict | None:
    data = dict(data)

    if slug in ("mcq_single", "mcq_timed"):
        prompt = MCQ_FIX_PROMPT.format(data=json.dumps(data, indent=2)[:2000])
    elif slug == "slider_input":
        prompt = SLIDER_FIX_PROMPT.format(data=json.dumps(data, indent=2)[:2000])
    elif slug == "fill_blanks":
        prompt = FILL_BLANKS_FIX_PROMPT.format(data=json.dumps(data, indent=2)[:2000])
    elif slug in ("drag_drop_classifier", "drag_drop_placement"):
        prompt = DRAG_DROP_FIX_PROMPT.format(data=json.dumps(data, indent=2)[:2000])
    else:
        return None

    try:
        resp = await client.chat.completions.create(
            model=settings.SPARK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        content = resp.choices[0].message.content or ""
        match = re.search(r"[\[{][\s\S]*[\]}]", content)
        if not match:
            logger.warning("No JSON in response for slug=%s", slug)
            return None
        result = json.loads(match.group())
    except Exception:
        logger.exception("LLM call failed for slug=%s", slug)
        return None

    if slug in ("mcq_single", "mcq_timed") and isinstance(result, list):
        data["options"] = result
        return data

    if isinstance(result, dict):
        data.update(result)
        return data

    return None


async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    client = AsyncOpenAI(api_key=settings.SPARK_API_KEY, base_url=settings.SPARK_BASE_URL)

    async with async_session() as session:
        rows = (await session.execute(
            select(ActivityQuestion, QuestionTemplate.slug)
            .outerjoin(QuestionTemplate, ActivityQuestion.template_id == QuestionTemplate.id)
            .order_by(ActivityQuestion.created_at)
        )).all()

    logger.info("Total questions: %d", len(rows))

    to_fix = [(aq, slug) for aq, slug in rows if _needs_fix(slug or "", aq.data or {})]
    logger.info("Need fix: %d", len(to_fix))

    updated = 0
    for aq, slug in to_fix:
        new_data = await fix_question(slug, aq.data or {}, client)
        if not new_data:
            logger.warning("FAIL  [%s] %s", slug, str(aq.id)[:8])
            continue

        async with async_session() as session:
            obj = await session.get(ActivityQuestion, aq.id)
            if obj:
                obj.data = new_data
                await session.commit()
                updated += 1
                logger.info("FIXED [%s] %s", slug, str(aq.id)[:8])

    logger.info("=== Done: %d fixed ===", updated)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
