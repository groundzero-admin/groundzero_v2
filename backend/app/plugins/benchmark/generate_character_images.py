"""Generate multi-pose character images using Amazon Titan Image Generator v2.

Run: python -m app.plugins.benchmark.generate_character_images

Generates 6 expression variants per character (30 total images) and saves them
as static PNGs in frontend/public/characters/.

Requires:
  - AWS credentials configured (default profile or AWS_PROFILE env var)
  - Bedrock model access for amazon.titan-image-generator-v2:0 in us-east-1
"""

import base64
import json
import logging
from pathlib import Path

import boto3

logger = logging.getLogger(__name__)

CHARACTERS_DIR = Path(__file__).resolve().parents[4] / "frontend" / "public" / "characters"
BEDROCK_REGION = "us-east-1"
MODEL_ID = "amazon.titan-image-generator-v2:0"

CHARACTER_DESCRIPTIONS = {
    "harry_potter": {
        "base": (
            "A young boy wizard with round glasses, messy black hair, a lightning bolt scar on his forehead, "
            "wearing a dark red and gold Hogwarts robe with a striped tie. Cartoon style, chibi proportions, "
            "bright colors, clean white background, no text."
        ),
        "palette": "dark crimson, gold, warm tones",
    },
    "doraemon": {
        "base": (
            "A round blue robot cat with a red nose, white belly with a 4D pocket, no ears, a bell on a red collar, "
            "short stubby arms and legs. Cartoon style, cute and round, bright colors, clean white background, no text."
        ),
        "palette": "bright blue, white, red accents",
    },
    "peppa_pig": {
        "base": (
            "A cute pink cartoon pig with a round face, small snout, rosy cheeks, wearing a bright red dress. "
            "Simple cartoon style, friendly and cheerful, bright pastel colors, clean white background, no text."
        ),
        "palette": "pink, red, pastel tones",
    },
    "simba": {
        "base": (
            "A cute young lion cub character with golden-orange fur, a light cream belly, big expressive brown eyes, "
            "a small red-brown tuft of fur on top of head. Cartoon illustration style, adorable and adventurous, "
            "warm savanna colors, clean white background, no text, no watermark."
        ),
        "palette": "golden orange, warm brown, amber",
    },
    "dora": {
        "base": (
            "A young Latina girl explorer with short brown bob hair, brown eyes, wearing a pink t-shirt, orange shorts, "
            "yellow socks, white shoes, and a purple backpack. Cartoon style, friendly and energetic, "
            "bright colors, clean white background, no text."
        ),
        "palette": "purple, pink, orange, bright tones",
    },
}

POSE_PROMPTS = {
    "idle": "standing in a neutral, friendly pose, smiling gently, arms relaxed at sides, looking directly at the viewer",
    "speaking": "talking enthusiastically with mouth open, one hand raised in a gesture as if explaining something, animated and expressive",
    "listening": "leaning slightly forward, tilting head, one hand cupped near ear, attentive and focused expression, eyes wide with interest",
    "thinking": "looking upward thoughtfully, one finger on chin, slightly squinting eyes, pondering expression, surrounded by small sparkle effects",
    "happy": "smiling very broadly with a huge joyful expression, eyes bright and sparkling, looking delighted, surrounded by small star shapes",
    "encouraging": "smiling warmly and kindly with a gentle supportive expression, head slightly tilted, looking friendly and reassuring, a small star nearby",
}


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


def generate_all_characters():
    """Generate all character pose images."""
    CHARACTERS_DIR.mkdir(parents=True, exist_ok=True)

    bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)

    total = len(CHARACTER_DESCRIPTIONS) * len(POSE_PROMPTS)
    count = 0

    for char_id, char_info in CHARACTER_DESCRIPTIONS.items():
        for pose_key, pose_desc in POSE_PROMPTS.items():
            count += 1
            filename = f"{char_id}_{pose_key}.png"
            filepath = CHARACTERS_DIR / filename

            if filepath.exists():
                logger.info("[%d/%d] Skipping %s — already exists", count, total, filename)
                continue

            prompt = f"{char_info['base']} The character is {pose_desc}. Color palette: {char_info['palette']}."
            logger.info("[%d/%d] Generating %s...", count, total, filename)
            logger.info("  Prompt: %s", prompt[:140])

            try:
                png_bytes = _generate_image(bedrock, prompt)
                filepath.write_bytes(png_bytes)
                logger.info("  Saved: %s (%d KB)", filename, len(png_bytes) // 1024)
            except Exception as e:
                logger.error("  FAILED %s: %s", filename, e)
                continue

    logger.info("Done! Character images saved to %s", CHARACTERS_DIR)


def main():
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    generate_all_characters()


if __name__ == "__main__":
    main()
