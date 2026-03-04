"""Voice services (TTS and STT) for benchmark conversations.

Supports Sarvam AI (default) and ElevenLabs (optional).
"""

import base64
import logging
import os
import re

import httpx

logger = logging.getLogger(__name__)

ELEVENLABS_VOICE_MAP = {
    "harry_potter": "ELEVENLABS_VOICE_HARRY_POTTER",
    "doraemon": "ELEVENLABS_VOICE_DORAEMON",
    "peppa_pig": "ELEVENLABS_VOICE_PEPPA_PIG",
    "simba": "ELEVENLABS_VOICE_SIMBA",
    "dora": "ELEVENLABS_VOICE_DORA",
}


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

    async with httpx.AsyncClient(timeout=30.0) as client:
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
        raise ValueError(f"No ElevenLabs voice ID configured for character: {character}")

    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not configured")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={"xi-api-key": api_key, "Content-Type": "application/json"},
            json={
                "text": text,
                "model_id": "eleven_turbo_v2",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True},
            },
        )
        response.raise_for_status()
        return response.content


async def text_to_speech(text: str, character: str, provider: str = "sarvam") -> bytes:
    if provider == "elevenlabs":
        return await elevenlabs_tts(text, character)
    return await sarvam_tts(text, character)


async def sarvam_stt(audio_bytes: bytes, language_code: str = "en-IN") -> str:
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        raise ValueError("SARVAM_API_KEY not configured")

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            "https://api.sarvam.ai/speech-to-text",
            headers={"api-subscription-key": api_key},
            files={"file": ("recording.wav", audio_bytes, "audio/wav")},
            data={"language_code": language_code, "model": "saarika:v2.5", "with_timestamps": "false"},
        )
        response.raise_for_status()
        return response.json().get("transcript", "")
