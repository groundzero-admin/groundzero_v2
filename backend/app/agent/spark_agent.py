"""SPARK AI Companion — skills-based DeepAgent with single LangGraph node."""

from pathlib import Path

from deepagents import create_deep_agent
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.agent.tools import get_student_context, get_question_context, submit_evidence
from app.config import settings

SKILLS_DIR = str(Path(__file__).parent / "skills")

SYSTEM_PROMPT = """\
You are SPARK, an AI learning companion for students aged 9-15.

## Personality
- Warm, curious, and encouraging
- Simple language appropriate for the student's grade level
- Never say "wrong" — say "interesting" or "that's a common tricky spot"
- Ask genuine questions — not quizzing, but understanding

## Role
- Help students reflect on their thinking after MCQ answers
- Diagnose the real skill gap when they make mistakes
- Give thinking scaffolds (hints) when they're stuck
- NEVER reveal answers or teach directly

## Tools Available

You have 3 tools. The SPARK CONTEXT message gives you the IDs to pass:

1. **get_question_context(question_id)** — Reads the MCQ question, options, correct answer, competency.
2. **get_student_context(student_id, competency_ids)** — Reads the student's name, grade, and mastery state. Pass competency_ids as a list, e.g. ["C1.4"].
3. **submit_evidence(student_id, competency_id, outcome, evidence_text)** — Submits a mastery signal after diagnosis. Only use after 1-2 exchanges.

## CRITICAL: First Turn Protocol

On your FIRST turn you receive a SPARK CONTEXT message with student_id, competency_id, trigger, and optionally question_id.

- If question_id is provided: call BOTH get_question_context AND get_student_context BEFORE writing any message.
- If question_id is NOT provided: call ONLY get_student_context. Do NOT call get_question_context without a valid UUID.

Example first-turn tool calls (when question_id is present):
- get_question_context(question_id="f09f47bb-15ac-5b1b-8079-6a829f61cb0b")
- get_student_context(student_id="51d2773d-...", competency_ids=["C1.4"])

## Conversation Length
Keep conversations short — 3-4 exchanges max for diagnosis, 1 exchange for hints.
"""


def _get_model() -> ChatOpenAI:
    """Create ChatOpenAI pointing at the Bedrock-Mantle OpenAI-compatible proxy."""
    return ChatOpenAI(
        model=settings.SPARK_MODEL,
        api_key=settings.SPARK_API_KEY,
        base_url=settings.SPARK_BASE_URL,
    )


async def get_checkpointer() -> AsyncPostgresSaver:
    """Create a PostgreSQL checkpointer for conversation persistence.

    Uses psycopg AsyncConnection directly (kept alive for the lifetime of the
    process via module-level cache in spark_service.py).
    """
    from psycopg import AsyncConnection

    db_url = settings.DATABASE_URL.replace("+asyncpg", "")
    conn = await AsyncConnection.connect(db_url, autocommit=True)
    checkpointer = AsyncPostgresSaver(conn)
    await checkpointer.setup()
    return checkpointer


async def create_spark_agent(checkpointer: AsyncPostgresSaver | None = None):
    """Create the SPARK DeepAgent instance.

    Uses Bedrock via OpenAI-compatible proxy.
    """
    if checkpointer is None:
        checkpointer = await get_checkpointer()

    agent = create_deep_agent(
        model=_get_model(),
        tools=[get_student_context, get_question_context, submit_evidence],
        system_prompt=SYSTEM_PROMPT,
        skills=[SKILLS_DIR],
        checkpointer=checkpointer,
    )
    return agent


async def create_hint_agent(checkpointer: AsyncPostgresSaver | None = None):
    """Create a SPARK agent for one-shot hints (only needs question context)."""
    if checkpointer is None:
        checkpointer = await get_checkpointer()

    agent = create_deep_agent(
        model=_get_model(),
        tools=[get_question_context],
        system_prompt=SYSTEM_PROMPT,
        skills=[SKILLS_DIR],
        checkpointer=checkpointer,
    )
    return agent


async def invoke_spark(
    agent,
    thread_id: str,
    message: str | None = None,
    context: dict | None = None,
) -> str:
    """Invoke the SPARK agent for a single turn.

    Args:
        agent: The DeepAgent graph instance.
        thread_id: Conversation UUID — used as LangGraph thread_id for checkpointing.
        message: The student's message (None for first turn — agent opens).
        context: Initial context dict injected on first turn.

    Returns:
        The agent's response text.
    """
    import asyncio
    import logging

    logger = logging.getLogger("spark")

    config = {"configurable": {"thread_id": thread_id}}

    if message:
        input_data = {"messages": [{"role": "user", "content": message}]}
    elif context:
        input_data = {"messages": [{"role": "user", "content": _format_context(context)}]}
    else:
        input_data = {"messages": [{"role": "user", "content": "Hello!"}]}

    logger.info(f"SPARK invoke start | thread={thread_id} | has_message={bool(message)} | has_context={bool(context)}")

    try:
        result = await asyncio.wait_for(
            agent.ainvoke(input_data, config=config),
            timeout=60.0,
        )
    except asyncio.TimeoutError:
        logger.error(f"SPARK invoke TIMEOUT (60s) | thread={thread_id}")
        return "Sorry, I took too long to think! Let me try again — what were you working on?"
    except Exception as e:
        logger.error(f"SPARK invoke ERROR | thread={thread_id} | {type(e).__name__}: {e}")
        return "I hit a small bump — can you tell me what you're thinking about?"

    logger.info(f"SPARK invoke done | thread={thread_id} | messages={len(result.get('messages', []))}")

    # Extract the last AI message
    messages = result.get("messages", [])
    for msg in reversed(messages):
        if hasattr(msg, "content") and getattr(msg, "type", None) == "ai":
            if msg.content:
                return msg.content
        if isinstance(msg, dict) and msg.get("role") == "assistant":
            if msg["content"]:
                return msg["content"]

    return "I'm here to help! What are you thinking about?"


def _format_context(context: dict) -> str:
    """Format initial conversation context."""
    parts = ["[SPARK CONTEXT — Do not repeat this to the student]"]

    if trigger := context.get("trigger"):
        parts.append(f"Trigger: {trigger}")
    if question_id := context.get("question_id"):
        parts.append(f"Question ID: {question_id}")
    if selected := context.get("selected_option"):
        parts.append(f"Student selected: {selected}")
    if confidence := context.get("confidence_report"):
        parts.append(f"Confidence self-report: {confidence}")
    if comp_id := context.get("competency_id"):
        parts.append(f"Competency: {comp_id}")
    if student_id := context.get("student_id"):
        parts.append(f"Student ID: {student_id}")

    parts.append("")
    if context.get("question_id"):
        parts.append("Start by calling get_question_context and get_student_context, then respond to the student.")
    else:
        parts.append("No question_id available — only call get_student_context before responding to the student.")
    return "\n".join(parts)
