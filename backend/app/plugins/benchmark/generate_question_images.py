"""Generate background illustrations for benchmark questions using Amazon Titan Image Generator v2.

Run: python -m app.plugins.benchmark.generate_question_images

Requires:
  - AWS credentials configured (default profile or AWS_PROFILE env var)
  - Bedrock model access for amazon.titan-image-generator-v2:0 in us-east-1
  - SPARK_API_KEY and SPARK_BASE_URL set for the prompt-builder LLM call
"""

import asyncio
import base64
import json
import logging
import os
from pathlib import Path

import boto3
from openai import AsyncOpenAI
from sqlalchemy import select

from app.config import settings
from app.database import async_session_maker
from app.plugins.benchmark.models import BenchmarkQuestion

logger = logging.getLogger(__name__)

IMAGES_DIR = Path(__file__).resolve().parents[4] / "frontend" / "public" / "question-images"
BEDROCK_REGION = "us-east-1"
MODEL_ID = "amazon.titan-image-generator-v2:0"

PILLAR_THEMES = {
    "math_logic": "numbers, shapes, equations, graphs, geometric patterns",
    "communication": "speech bubbles, conversation, storytelling, writing, books",
    "creativity": "art supplies, paintbrush, light bulbs, colorful imagination, inventions",
    "ai_systems": "robots, gears, circuits, computers, technology, coding",
}


async def _build_image_prompt(question_text: str, curriculum_anchor: str, pillars: list[str]) -> str:
    """Use LLM to convert question text into a good image generation prompt."""
    pillar_visuals = ", ".join(PILLAR_THEMES.get(p, "") for p in pillars if p in PILLAR_THEMES)

    system = """You convert educational questions into image generation prompts.
Output ONLY the prompt text, nothing else.

Rules:
- Describe a colorful, cartoon-style illustration suitable for children ages 8-14.
- The image should visually represent the TOPIC of the question, not the question text itself.
- Include concrete visual elements (objects, scenes, characters) related to the subject.
- Style: bright colors, rounded shapes, fun educational poster style, clean composition.
- NEVER include any text, letters, numbers, words, or labels in the image.
- Keep it to 1-2 sentences max."""

    user = f"""Question: {question_text}
Subject: {curriculum_anchor or 'general'}
Visual themes to incorporate: {pillar_visuals}"""

    client = AsyncOpenAI(api_key=settings.SPARK_API_KEY, base_url=settings.SPARK_BASE_URL)
    response = await client.chat.completions.create(
        model=settings.SPARK_MODEL,
        max_tokens=100,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    content = response.choices[0].message.content
    if not content:
        return f"Colorful cartoon illustration for children about {curriculum_anchor or 'learning'}, bright colors, fun educational style, no text"
    return content.strip()


def _generate_image(bedrock_client, prompt: str) -> bytes:
    """Call Titan Image Generator v2 and return PNG bytes."""
    body = json.dumps({
        "taskType": "TEXT_IMAGE",
        "textToImageParams": {
            "text": prompt,
        },
        "imageGenerationConfig": {
            "numberOfImages": 1,
            "quality": "standard",
            "height": 512,
            "width": 512,
            "cfgScale": 8,
        },
    })

    response = bedrock_client.invoke_model(
        body=body,
        modelId=MODEL_ID,
        accept="application/json",
        contentType="application/json",
    )

    result = json.loads(response["body"].read())
    b64_image = result["images"][0]
    return base64.b64decode(b64_image)


async def generate_all_images():
    """Load questions from DB, generate images, save files, update DB."""
    import app.models  # noqa: F401 — register all models

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)

    async with async_session_maker() as db:
        result = await db.execute(
            select(BenchmarkQuestion)
            .where(BenchmarkQuestion.is_active.is_(True))
            .order_by(BenchmarkQuestion.grade_band, BenchmarkQuestion.question_number)
        )
        questions = result.scalars().all()

    total = len(questions)
    logger.info("Found %d questions to process", total)

    for i, q in enumerate(questions):
        filename = f"{q.grade_band}_{q.question_number}.png"
        filepath = IMAGES_DIR / filename
        relative_url = f"/question-images/{filename}"

        if q.image_url and filepath.exists():
            logger.info("[%d/%d] Skipping Q%d (%s) — image exists", i + 1, total, q.question_number, q.grade_band)
            continue

        logger.info("[%d/%d] Generating image for Q%d (%s)...", i + 1, total, q.question_number, q.grade_band)

        try:
            prompt = await _build_image_prompt(q.text, q.curriculum_anchor or "", q.pillars or [])
            logger.info("  Prompt: %s", prompt[:120])

            png_bytes = _generate_image(bedrock, prompt)
            filepath.write_bytes(png_bytes)
            logger.info("  Saved: %s (%d KB)", filepath.name, len(png_bytes) // 1024)

            async with async_session_maker() as db:
                db_q = await db.get(BenchmarkQuestion, q.id)
                if db_q:
                    db_q.image_url = relative_url
                    await db.commit()

        except Exception as e:
            logger.error("  FAILED for Q%d (%s): %s", q.question_number, q.grade_band, e)
            continue

    logger.info("Done! Images saved to %s", IMAGES_DIR)


async def _main():
    import app.models  # noqa: F401
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    await generate_all_images()


if __name__ == "__main__":
    asyncio.run(_main())
