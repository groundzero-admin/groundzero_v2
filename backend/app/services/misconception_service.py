"""
Async misconception analysis — fires after a wrong answer.
Calls Spark LLM to classify what went wrong and why.
Stores result back in evidence_events.misconception JSONB.
"""
import asyncio
import json
import logging
import re
import uuid

from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.evidence import EvidenceEvent

logger = logging.getLogger(__name__)

PROMPT = """You are an educational diagnostician. A student answered a question incorrectly.

Question slug (type): {slug}
Question data: {question_data}
Student's response: {response}
Response time (ms): {response_time_ms}
Outcome score: {outcome}

Classify this wrong answer. Return ONLY JSON:
{{
  "misconception": "one sentence describing exactly what went wrong — be specific to this answer",
  "type": "conceptual | procedural | careless | guessing",
  "confidence": 0.0-1.0,
  "intervention": "one specific sentence: what to tell or show this student right now"
}}

Type definitions:
- conceptual: wrong mental model of the underlying rule or concept
- procedural: understands concept but applied wrong steps/procedure
- careless: likely knows but made arithmetic or attention error (response_time_ms > 8000 suggests not guessing)
- guessing: very fast response (< 4000ms) with no clear pattern, or clearly random

Be specific. Not "student made an error" — say exactly what mental model error they made."""


async def analyze_misconception(
    db_url: str,
    evidence_id: uuid.UUID,
    slug: str,
    question_data: dict,
    response: dict,
    response_time_ms: float | None,
    outcome: float,
):
    """Fire-and-forget: analyze misconception and store back on evidence event."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker

    engine = create_async_engine(db_url, echo=False)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        client = AsyncOpenAI(api_key=settings.SPARK_API_KEY, base_url=settings.SPARK_BASE_URL)
        prompt = PROMPT.format(
            slug=slug,
            question_data=json.dumps(question_data, indent=2)[:1500],
            response=json.dumps(response)[:500],
            response_time_ms=response_time_ms or "unknown",
            outcome=round(outcome, 2),
        )

        resp = await client.chat.completions.create(
            model=settings.SPARK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        content = resp.choices[0].message.content or ""
        match = re.search(r"\{[\s\S]*\}", content)
        if not match:
            logger.warning("No JSON in misconception response for evidence %s", evidence_id)
            return

        result = json.loads(match.group())

        async with Session() as session:
            event = await session.get(EvidenceEvent, evidence_id)
            if event:
                event.misconception = result
                await session.commit()
                logger.info("Misconception stored for evidence %s: %s", evidence_id, result.get("type"))

    except Exception:
        logger.exception("Misconception analysis failed for evidence %s", evidence_id)
    finally:
        await engine.dispose()
