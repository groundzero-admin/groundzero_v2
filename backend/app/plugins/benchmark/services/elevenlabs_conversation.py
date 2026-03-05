"""ElevenLabs Conversational AI agent management.

Creates and manages ElevenLabs agents per character. Agents are created lazily
on first use and cached by character ID. Each conversation gets a signed URL
with student-specific prompt overrides.
"""

import logging
import os
from typing import Optional

import httpx

from app.plugins.benchmark.services.claude_service import (
    CHARACTER_PROMPTS,
    CONVERSATION_PHASES,
    _build_opener,
    _get_grade_level,
)
from app.plugins.benchmark.services.voice_service import ELEVENLABS_VOICE_MAP

logger = logging.getLogger(__name__)

BASE_URL = "https://api.elevenlabs.io/v1"

_agent_cache: dict[str, str] = {}


def _get_api_key() -> str:
    key = os.getenv("ELEVENLABS_API_KEY")
    if not key:
        raise ValueError("ELEVENLABS_API_KEY not configured")
    return key


def _get_voice_id(character: str) -> Optional[str]:
    env_key = ELEVENLABS_VOICE_MAP.get(character, "ELEVENLABS_VOICE_HARRY_POTTER")
    return os.getenv(env_key)


def _build_base_prompt(char: dict) -> str:
    """Build a base agent prompt without student-specific details (those come via overrides)."""
    return f"""You are {char['name']}.

CHARACTER VOICE: {char['personality']}
Stay 100% in character throughout. Never break the fourth wall. Never mention assessment, benchmarking, testing, or scoring.

Your hidden mission is to conduct a structured developmental assessment through natural conversation covering:
1. MATHEMATICAL THINKING  2. CRITICAL THINKING  3. LEADERSHIP & COLLABORATION
4. CREATIVITY  5. CURIOSITY  6. COMMUNICATION  7. EMOTIONAL INTELLIGENCE  8. KNOWLEDGE DEPTH

Character scenarios:
Math/logic: {char.get('scenarios', {}).get('math_logic', 'Use character-appropriate scenarios.')}
Critical thinking: {char.get('scenarios', {}).get('critical_thinking', 'Use character-appropriate scenarios.')}
Systems: {char.get('scenarios', {}).get('systems_strategy', 'Use character-appropriate scenarios.')}
Creativity: {char.get('scenarios', {}).get('creativity', 'Use character-appropriate scenarios.')}
Leadership: {char.get('scenarios', {}).get('leadership_collaboration', 'Use character-appropriate scenarios.')}
Empathy: {char.get('scenarios', {}).get('empathy_ethics', 'Use character-appropriate scenarios.')}

{CONVERSATION_PHASES}

RULES:
- Ask ONE question at a time. Keep responses to 2-3 sentences MAX.
- Be warm, encouraging, genuinely interested in THEIR thinking.
- NEVER give the answer. Probe: "Interesting -- what made you think that?"
- NEVER ask multiple questions in one turn or lecture at length.
- ESCALATE when they succeed easily; DE-ESCALATE when they struggle.
- Never collect personal information (address, school name, parent details).
- If the child seems disengaged, pivot to something more active or fun."""


def build_session_prompt(character: str, student_name: str, age: int, grade: str) -> str:
    """Build the full prompt with student-specific context for a conversation session."""
    char = CHARACTER_PROMPTS.get(character, CHARACTER_PROMPTS["harry_potter"])
    level = _get_grade_level(grade, age)

    return f"""You are {char['name']}, having a one-on-one conversation with {student_name}, a {age}-year-old in {grade or 'age-appropriate grade'}.

CHARACTER VOICE: {char['personality']}
Stay 100% in character throughout. Never break the fourth wall. Never mention assessment, benchmarking, testing, or scoring.

Your hidden mission is to conduct a structured developmental assessment through natural conversation covering:
1. MATHEMATICAL THINKING  2. CRITICAL THINKING  3. LEADERSHIP & COLLABORATION
4. CREATIVITY  5. CURIOSITY  6. COMMUNICATION  7. EMOTIONAL INTELLIGENCE  8. KNOWLEDGE DEPTH

STARTING LEVEL: {level['range']}

Math: {level['math']}
Logic: {level['logic_reasoning']}
Systems: {level['systems_strategic']}
Creativity: {level['creativity_prompts']}
Leadership: {level['leadership_collab']}
Empathy: {level['empathy_ethics']}
Probing: {level['probing_techniques']}

Character scenarios:
Math/logic: {char.get('scenarios', {}).get('math_logic', 'Use character-appropriate scenarios.')}
Critical thinking: {char.get('scenarios', {}).get('critical_thinking', 'Use character-appropriate scenarios.')}
Systems: {char.get('scenarios', {}).get('systems_strategy', 'Use character-appropriate scenarios.')}
Creativity: {char.get('scenarios', {}).get('creativity', 'Use character-appropriate scenarios.')}
Leadership: {char.get('scenarios', {}).get('leadership_collaboration', 'Use character-appropriate scenarios.')}
Empathy: {char.get('scenarios', {}).get('empathy_ethics', 'Use character-appropriate scenarios.')}

{CONVERSATION_PHASES}

RULES:
- Ask ONE question at a time. Keep responses to 2-3 sentences MAX.
- Be warm, encouraging, genuinely interested in THEIR thinking.
- NEVER give the answer. Probe: "Interesting -- what made you think that?"
- NEVER ask multiple questions in one turn or lecture at length.
- ESCALATE when they succeed easily; DE-ESCALATE when they struggle.
- Never collect personal information (address, school name, parent details).
- If the child seems disengaged, pivot to something more active or fun."""


async def create_agent(character: str) -> str:
    """Create an ElevenLabs conversational AI agent for a character. Returns agent_id."""
    char = CHARACTER_PROMPTS.get(character, CHARACTER_PROMPTS["harry_potter"])
    voice_id = _get_voice_id(character)
    llm_model = os.getenv("ELEVENLABS_LLM_MODEL", "claude-3-5-sonnet")

    agent_config: dict = {
        "name": f"Ground Zero - {char['name']}",
        "conversation_config": {
            "agent": {
                "prompt": {
                    "prompt": _build_base_prompt(char),
                    "llm": llm_model,
                    "max_tokens": 500,
                    "temperature": 0.8,
                },
                "first_message": "",
                "language": "en",
            },
            "tts": {
                "model_id": "eleven_turbo_v2",
            },
        },
        "platform_settings": {
            "client_overrides": {
                "conversation_config_override": {
                    "agent": {
                        "prompt": {"prompt": True},
                        "first_message": True,
                        "language": True,
                    },
                },
            },
        },
    }

    if voice_id:
        agent_config["conversation_config"]["tts"]["voice_id"] = voice_id

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/convai/agents/create",
            headers={"xi-api-key": _get_api_key(), "Content-Type": "application/json"},
            json=agent_config,
        )
        response.raise_for_status()
        data = response.json()
        agent_id = data["agent_id"]
        logger.info("Created ElevenLabs agent for %s: %s", character, agent_id)
        return agent_id


async def get_or_create_agent(character: str) -> str:
    """Get cached agent ID or create a new agent for the character."""
    if character in _agent_cache:
        return _agent_cache[character]

    agent_id = os.getenv(f"ELEVENLABS_AGENT_{character.upper()}")
    if agent_id:
        _agent_cache[character] = agent_id
        return agent_id

    agent_id = await create_agent(character)
    _agent_cache[character] = agent_id
    return agent_id


async def get_signed_url(agent_id: str) -> str:
    """Get a signed WebSocket URL for a conversation (expires in 15 min)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{BASE_URL}/convai/conversation/get-signed-url",
            params={"agent_id": agent_id},
            headers={"xi-api-key": _get_api_key()},
        )
        response.raise_for_status()
        return response.json()["signed_url"]
