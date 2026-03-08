"""Voice services (TTS and STT) for benchmark diagnostic.

Supports Sarvam AI (default) and ElevenLabs (optional).
Provider is configured via DEFAULT_VOICE_PROVIDER env var.
"""

import asyncio
import base64
import logging
import os
import re
import tempfile

import httpx

logger = logging.getLogger(__name__)

ELEVENLABS_VOICE_MAP = {
    "harry_potter": "ELEVENLABS_VOICE_HARRY_POTTER",
    "doraemon": "ELEVENLABS_VOICE_DORAEMON",
    "peppa_pig": "ELEVENLABS_VOICE_PEPPA_PIG",
    "simba": "ELEVENLABS_VOICE_SIMBA",
    "dora": "ELEVENLABS_VOICE_DORA",
}


def get_default_provider() -> str:
    return os.getenv("DEFAULT_VOICE_PROVIDER", "sarvam").lower()


def _clean_for_tts(text: str) -> str:
    text = re.sub(r"\*[^*]+\*", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


async def sarvam_tts(text: str, character: str) -> bytes:
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        raise ValueError("SARVAM_API_KEY not configured")

    clean_text = _clean_for_tts(text)
    if not clean_text:
        raise ValueError("No speakable text after cleaning")

    async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
        response = await client.post(
            "https://api.sarvam.ai/text-to-speech",
            headers={"api-subscription-key": api_key, "Content-Type": "application/json"},
            json={
                "inputs": [clean_text],
                "target_language_code": "en-IN",
                "speaker": "amelia",
                "model": "bulbul:v3",
                "pace": 1.05,
                "speech_sample_rate": 22050,
                "enable_preprocessing": True,
            },
        )
        response.raise_for_status()
        audio_b64 = response.json()["audios"][0]
        return base64.b64decode(audio_b64)


async def elevenlabs_tts(text: str, character: str) -> bytes:
    env_key = ELEVENLABS_VOICE_MAP.get(character, "ELEVENLABS_VOICE_HARRY_POTTER")
    voice_id = os.getenv(env_key)
    if not voice_id:
        raise ValueError(f"No ElevenLabs voice ID for character: {character}")

    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not configured")

    async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={"xi-api-key": api_key, "Content-Type": "application/json"},
            json={
                "text": text,
                "model_id": "eleven_turbo_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.8,
                    "style": 0.3,
                    "use_speaker_boost": True,
                },
            },
        )
        response.raise_for_status()
        return response.content


async def text_to_speech(text: str, character: str, provider: str | None = None) -> bytes:
    provider = provider or get_default_provider()
    if provider == "elevenlabs":
        return await elevenlabs_tts(text, character)
    return await sarvam_tts(text, character)


async def _convert_to_wav(audio_bytes: bytes) -> bytes:
    """Convert any audio format (webm, ogg, mp3, etc.) to WAV using ffmpeg."""
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as src:
        src.write(audio_bytes)
        src_path = src.name

    dst_path = src_path.replace(".webm", ".wav")

    try:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-y", "-i", src_path,
            "-ar", "16000", "-ac", "1", "-f", "wav", dst_path,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()

        if proc.returncode != 0:
            logger.error("ffmpeg conversion failed: %s", stderr.decode()[:300])
            raise RuntimeError("Audio conversion failed")

        with open(dst_path, "rb") as f:
            return f.read()
    finally:
        for p in (src_path, dst_path):
            try:
                os.unlink(p)
            except OSError:
                pass


async def sarvam_stt(audio_bytes: bytes, language_code: str = "en-IN") -> str:
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        raise ValueError("SARVAM_API_KEY not configured")

    wav_bytes = await _convert_to_wav(audio_bytes)
    logger.info("STT: converted audio to WAV (%d bytes -> %d bytes)", len(audio_bytes), len(wav_bytes))

    async with httpx.AsyncClient(timeout=300.0, verify=False) as client:
        response = await client.post(
            "https://api.sarvam.ai/speech-to-text",
            headers={"api-subscription-key": api_key},
            files={"file": ("recording.wav", wav_bytes, "audio/wav")},
            data={
                "language_code": language_code,
                "model": "saarika:v2.5",
                "with_timestamps": "false",
            },
        )
        if response.status_code != 200:
            logger.error("Sarvam STT error %d: %s", response.status_code, response.text[:300])
        response.raise_for_status()
        return response.json().get("transcript", "")


async def speech_to_text(audio_bytes: bytes, provider: str | None = None) -> str:
    """STT always uses Sarvam (ElevenLabs doesn't offer STT)."""
    return await sarvam_stt(audio_bytes)
