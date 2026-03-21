"""Pre-generate TTS audio for all benchmark questions and upload to S3.

Run: python -m app.plugins.benchmark.generate_question_audios

Generates 5 characters x 60 questions = 300 audio files (WAV) using the
configured TTS provider, then uploads to S3 for static serving.

S3 path:  question-audio/{character_id}/{grade_band}_{question_number}.wav
Public URL: https://groundzero-static.s3.ap-southeast-2.amazonaws.com/question-audio/...

Requires:
  - AWS credentials (default profile)
  - SARVAM_API_KEY (and optionally ELEVENLABS_API_KEY + voice IDs)
"""

import asyncio
import logging
import os
from pathlib import Path

import boto3
from dotenv import load_dotenv
from sqlalchemy import select

load_dotenv(Path(__file__).resolve().parents[3] / ".env")

from app.config import settings  # noqa: E402
from app.database import async_session_maker
from app.plugins.benchmark.models import BenchmarkQuestion
from app.plugins.benchmark.services.voice_service import text_to_speech, get_default_provider

logger = logging.getLogger(__name__)

S3_BUCKET = "groundzero-static"
S3_REGION = "ap-southeast-2"
S3_PREFIX = "question-audio"
S3_BASE_URL = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com"

CHARACTERS = ["harry_potter", "doraemon", "peppa_pig", "simba", "dora"]

LOCAL_CACHE_DIR = Path(__file__).resolve().parents[4] / "tmp" / "question-audio"


def _s3_key(character_id: str, grade_band: str, question_number: int) -> str:
    return f"{S3_PREFIX}/{character_id}/{grade_band}_{question_number}.wav"


def _s3_url(character_id: str, grade_band: str, question_number: int) -> str:
    return f"{S3_BASE_URL}/{_s3_key(character_id, grade_band, question_number)}"


def _s3_key_exists(s3_client, key: str) -> bool:
    try:
        s3_client.head_object(Bucket=S3_BUCKET, Key=key)
        return True
    except s3_client.exceptions.ClientError:
        return False


async def generate_all_audios(force: bool = False):
    """Load questions from DB, generate TTS audio for each character, upload to S3.

    Args:
        force: If True, regenerate and overwrite all audio files even if they exist in S3.
    """
    import app.models  # noqa: F401

    LOCAL_CACHE_DIR.mkdir(parents=True, exist_ok=True)

    s3 = boto3.client("s3", region_name=S3_REGION)
    provider = get_default_provider()

    async with async_session_maker() as db:
        result = await db.execute(
            select(BenchmarkQuestion)
            .where(BenchmarkQuestion.is_active.is_(True))
            .order_by(BenchmarkQuestion.grade_band, BenchmarkQuestion.question_number)
        )
        questions = result.scalars().all()

    total = len(questions) * len(CHARACTERS)
    logger.info("Generating %d audio files (%d questions x %d characters) using %s%s",
                total, len(questions), len(CHARACTERS), provider,
                " [FORCE mode — overwriting existing]" if force else "")

    audio_cache: dict[str, bytes] = {}
    count = 0
    skipped = 0
    failed = 0

    for char_id in CHARACTERS:
        for q in questions:
            count += 1
            key = _s3_key(char_id, q.grade_band, q.question_number)

            if not force and _s3_key_exists(s3, key):
                skipped += 1
                logger.info("[%d/%d] Skipping %s/%s_%d — exists in S3",
                            count, total, char_id, q.grade_band, q.question_number)
                continue

            logger.info("[%d/%d] %s %s/%s_%d...",
                        count, total, "Regenerating" if force else "Generating",
                        char_id, q.grade_band, q.question_number)

            cache_key = f"{provider}:{char_id}:{q.id}" if provider == "elevenlabs" else f"{provider}:{q.id}"
            try:
                if cache_key in audio_cache:
                    audio_bytes = audio_cache[cache_key]
                    logger.info("  Using cached audio")
                else:
                    audio_bytes = await text_to_speech(q.text, char_id, provider)
                    audio_cache[cache_key] = audio_bytes
                    logger.info("  TTS generated (%d KB)", len(audio_bytes) // 1024)

                s3.put_object(
                    Bucket=S3_BUCKET,
                    Key=key,
                    Body=audio_bytes,
                    ContentType="audio/wav",
                )
                logger.info("  Uploaded to s3://%s/%s", S3_BUCKET, key)

            except Exception as e:
                failed += 1
                logger.error("  FAILED: %s", e)
                await asyncio.sleep(1)
                continue

            await asyncio.sleep(0.3)

    logger.info("Done! Generated: %d, Skipped: %d, Failed: %d", count - skipped - failed, skipped, failed)
    logger.info("Base URL: %s/%s/", S3_BASE_URL, S3_PREFIX)


async def _main():
    import argparse
    import app.models  # noqa: F401

    parser = argparse.ArgumentParser(description="Generate TTS audio for benchmark questions")
    parser.add_argument("--force", action="store_true",
                        help="Regenerate all audio files, overwriting existing ones in S3")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    await generate_all_audios(force=args.force)


if __name__ == "__main__":
    asyncio.run(_main())
