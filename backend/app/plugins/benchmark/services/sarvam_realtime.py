"""Sarvam real-time conversational voice pipeline.

Orchestrates streaming STT (Saaras v3) → Claude → streaming TTS (Bulbul v3)
over WebSockets for a live conversational experience.
"""

import asyncio
import base64
import json
import logging
import os
import re

import websockets

from app.plugins.benchmark.services.claude_service import (
    _get_claude_client,
    _get_claude_model,
    _build_conversation_system_prompt,
    CHARACTER_PROMPTS,
    _build_opener,
    _build_farewell,
)

logger = logging.getLogger(__name__)

SARVAM_STT_URL = "wss://api.sarvam.ai/speech-to-text/ws"
SARVAM_TTS_URL = "wss://api.sarvam.ai/text-to-speech/ws?model=bulbul%3Av3&send_completion_event=true"


class SarvamConversationPipeline:
    """Manages a single real-time voice conversation session."""

    def __init__(
        self,
        character: str,
        student_name: str,
        student_age: int,
        student_grade: str,
        on_user_transcript: asyncio.coroutines = None,
        on_agent_text: asyncio.coroutines = None,
        on_agent_audio: asyncio.coroutines = None,
        on_turn_complete: asyncio.coroutines = None,
    ):
        self.character = character
        self.student_name = student_name
        self.student_age = student_age
        self.student_grade = student_grade

        self.on_user_transcript = on_user_transcript
        self.on_agent_text = on_agent_text
        self.on_agent_audio = on_agent_audio
        self.on_turn_complete = on_turn_complete

        char = CHARACTER_PROMPTS.get(character, CHARACTER_PROMPTS["harry_potter"])
        self.system_prompt = _build_conversation_system_prompt(
            char, student_name, student_age, student_grade
        )
        self.conversation_history: list[dict] = []
        self.turn_count = 0
        self._stt_ws = None
        self._tts_ws = None
        self._running = False
        self._api_key = os.getenv("SARVAM_API_KEY", "")

    async def send_opener_text(self):
        """Send opener text to frontend immediately (no TTS yet)."""
        self._running = True
        char = CHARACTER_PROMPTS.get(self.character, CHARACTER_PROMPTS["harry_potter"])
        self._opener_text = _build_opener(char, self.student_name, self.student_age, self.student_grade)
        logger.info("Pipeline: sending opener text for %s", self.character)

        self.conversation_history.append({"role": "assistant", "content": self._opener_text})
        self.turn_count = 1

        if self.on_agent_text:
            await self.on_agent_text(self._opener_text)

    async def synthesize_opener(self):
        """Synthesize and send opener audio (runs as background task)."""
        await self._synthesize_and_send(self._opener_text)
        logger.info("Pipeline: opener TTS complete")
        if self.on_turn_complete:
            await self.on_turn_complete(self.turn_count)

    async def connect_stt(self):
        """Open a streaming STT WebSocket to Sarvam."""
        url = (
            f"{SARVAM_STT_URL}"
            f"?language-code=en-IN"
            f"&model=saaras:v3"
            f"&mode=transcribe"
            f"&vad_signals=true"
            f"&sample_rate=16000"
            f"&input_audio_codec=pcm_s16le"
        )
        headers = {"Api-Subscription-Key": self._api_key}
        self._stt_ws = await websockets.connect(url, additional_headers=headers)
        logger.info("Sarvam STT WebSocket connected")
        return self._stt_ws

    async def feed_audio(self, audio_bytes: bytes):
        """Send PCM16 audio as base64-encoded JSON to the STT WebSocket."""
        if self._stt_ws and self._stt_ws.state.name == "OPEN":
            audio_b64 = base64.b64encode(audio_bytes).decode()
            msg = json.dumps({
                "audio": {
                    "data": audio_b64,
                    "sample_rate": "16000",
                    "encoding": "audio/wav",
                }
            })
            await self._stt_ws.send(msg)

    async def listen_stt(self):
        """Listen for STT events and trigger AI response on end-of-speech."""
        if not self._stt_ws:
            return

        accumulated_transcript = ""
        try:
            async for message in self._stt_ws:
                if not self._running:
                    break
                data = json.loads(message)
                msg_type = data.get("type", "")
                logger.debug("STT event: %s", data)

                if msg_type == "data":
                    transcript = data.get("data", {}).get("transcript", "")
                    if transcript:
                        logger.info("STT partial transcript: %s", transcript)
                        accumulated_transcript = transcript

                elif msg_type == "events":
                    signal = data.get("data", {}).get("signal_type", "")
                    logger.info("STT VAD event: %s", signal)
                    if signal == "END_SPEECH" and accumulated_transcript.strip():
                        user_text = accumulated_transcript.strip()
                        accumulated_transcript = ""
                        logger.info("User said: %s", user_text)

                        if self.on_user_transcript:
                            await self.on_user_transcript(user_text)

                        await self._generate_response(user_text)

                elif msg_type == "error":
                    logger.error("STT error: %s", data)
        except websockets.ConnectionClosed:
            logger.info("STT WebSocket closed")

    async def _generate_response(self, user_text: str):
        """Generate AI response via Claude and synthesize speech."""
        self.conversation_history.append({"role": "user", "content": user_text})

        client = _get_claude_client()
        model = _get_claude_model()

        full_text = ""
        sentence_buffer = ""
        sentences: list[str] = []

        async with client.messages.stream(
            model=model,
            max_tokens=500,
            system=self.system_prompt,
            messages=self.conversation_history,
        ) as stream:
            async for token in stream.text_stream:
                full_text += token
                sentence_buffer += token

                if self.on_agent_text:
                    await self.on_agent_text(token, delta=True)

                stripped = sentence_buffer.strip()
                if stripped and _ends_sentence(stripped):
                    sentences.append(stripped)
                    sentence_buffer = ""

        if sentence_buffer.strip():
            sentences.append(sentence_buffer.strip())

        for sentence in sentences:
            await self._synthesize_and_send(sentence)

        self.conversation_history.append({"role": "assistant", "content": full_text})
        self.turn_count += 2

        if self.on_turn_complete:
            await self.on_turn_complete(self.turn_count)

    async def _synthesize_and_send(self, text: str):
        """Send text to Sarvam streaming TTS. Collects all chunks into one audio blob before forwarding."""
        logger.info("TTS: synthesizing %d chars", len(text))
        try:
            headers = {"Api-Subscription-Key": self._api_key}
            async with websockets.connect(SARVAM_TTS_URL, additional_headers=headers) as ws:
                logger.info("TTS WebSocket connected")
                config_msg = json.dumps({
                    "type": "config",
                    "data": {
                        "model": "bulbul:v3",
                        "speaker": "amelia",
                        "target_language_code": "en-IN",
                        "pace": 1.05,
                        "output_audio_codec": "mp3",
                        "output_audio_bitrate": "128k",
                    },
                })
                await ws.send(config_msg)

                text_msg = json.dumps({
                    "type": "text",
                    "data": {"text": text},
                })
                await ws.send(text_msg)

                flush_msg = json.dumps({"type": "flush"})
                await ws.send(flush_msg)

                audio_parts: list[bytes] = []
                async for message in ws:
                    data = json.loads(message)
                    msg_type = data.get("type", "")
                    if msg_type == "audio":
                        audio_b64 = data.get("data", {}).get("audio", "")
                        if audio_b64:
                            audio_parts.append(base64.b64decode(audio_b64))
                    elif msg_type in ("event", "events"):
                        event_type = data.get("data", {}).get("event_type", "")
                        logger.info("TTS event: %s", event_type)
                        if event_type == "final":
                            break
                    elif msg_type == "error":
                        logger.error("TTS error response: %s", data)
                        break

                if audio_parts and self.on_agent_audio:
                    combined = b"".join(audio_parts)
                    combined_b64 = base64.b64encode(combined).decode()
                    await self.on_agent_audio(combined_b64)
                    logger.info("TTS: sent combined audio (%d bytes from %d chunks)", len(combined), len(audio_parts))
        except Exception as e:
            logger.error("Sarvam TTS streaming error: %s", e, exc_info=True)

    async def generate_farewell(self):
        """Generate and send a closing message."""
        char = CHARACTER_PROMPTS.get(self.character, CHARACTER_PROMPTS["harry_potter"])
        farewell = _build_farewell(char, self.student_name)
        self.conversation_history.append({"role": "assistant", "content": farewell})
        if self.on_agent_text:
            await self.on_agent_text(farewell)
        await self._synthesize_and_send(farewell)

    def get_transcript(self) -> list[dict]:
        """Return conversation history for benchmark processing."""
        return self.conversation_history

    async def stop(self):
        """Shut down all connections."""
        self._running = False
        if self._stt_ws and self._stt_ws.state.name == "OPEN":
            await self._stt_ws.close()


def _ends_sentence(text: str) -> bool:
    return bool(re.search(r'[.!?]["\')\]]?\s*$', text))
