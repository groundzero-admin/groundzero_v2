"""SPARK service — direct LLM invocation (no DeepAgent graph)."""

import logging
import uuid
from datetime import datetime

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.spark import SparkConversation, SparkMessage
from app.schemas.spark import SparkConversationCreate, SparkHintRequest
from app.config import settings

logger = logging.getLogger("spark")

SYSTEM_PROMPT = """\
You are SPARK, a warm and curious AI learning companion for students aged 9-15.

Your job right now: give the student a HINT — a nudge that helps them think, NOT the answer.

Rules:
- Never reveal the correct answer directly
- Ask one guiding question or give one small clue
- Use simple, friendly language
- Keep your response SHORT (2-4 sentences max)
- If the student seems frustrated, be extra encouraging
- Emoji use is encouraged but keep it light (1-2 max)
"""


def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.SPARK_MODEL,
        api_key=settings.SPARK_API_KEY,
        base_url=settings.SPARK_BASE_URL,
        timeout=30,
        max_retries=1,
    )


async def _fetch_question_context(db: AsyncSession, question_id: uuid.UUID | None) -> str:
    """Fetch question text and options from DB to include in the prompt."""
    if not question_id:
        return ""
    from app.models.curriculum import Question
    from app.models.competency import Competency
    q = await db.get(Question, question_id)
    if not q:
        return ""
    options_txt = "\n".join(
        f"  {'✓' if o.get('is_correct') else '•'} {o['label']}: {o['text']}"
        for o in (q.options or [])
    )
    comp = await db.get(Competency, q.competency_id) if q.competency_id else None
    comp_name = comp.name if comp else str(q.competency_id)
    return f"Question: {q.text}\nOptions:\n{options_txt}\nSkill: {comp_name}"


async def _fetch_student_name(db: AsyncSession, student_id: uuid.UUID) -> str:
    from app.models.student import Student
    s = await db.get(Student, student_id)
    return s.name.split()[0] if s and s.name else "there"


async def _build_opening_message(
    db: AsyncSession,
    data: SparkConversationCreate,
) -> str:
    """Ask LLM to generate SPARK's opening hint message."""
    q_ctx = await _fetch_question_context(db, data.question_id)
    student_name = await _fetch_student_name(db, data.student_id)

    user_content_parts = [f"Student name: {student_name}"]
    if data.trigger:
        user_content_parts.append(f"Trigger: {data.trigger}")
    if data.selected_option:
        user_content_parts.append(f"Student selected: {data.selected_option}")
    if q_ctx:
        user_content_parts.append(q_ctx)
    user_content_parts.append(
        "\nPlease give a warm opening hint to help the student think through this."
    )

    llm = _get_llm()
    try:
        resp = await llm.ainvoke([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content="\n".join(user_content_parts)),
        ])
        return resp.content or "Hey! Let me help you think through this. What part felt tricky? 🤔"
    except Exception as e:
        logger.error(f"SPARK opening message error: {e}")
        return f"Hey {student_name}! Let me help you think through this. What part felt confusing? 🤔"


async def _build_turn_response(
    db: AsyncSession,
    conv: SparkConversation,
    history: list[SparkMessage],
    student_message: str,
) -> str:
    """Ask LLM to continue the conversation."""
    q_ctx = await _fetch_question_context(db, conv.question_id)

    messages: list = [SystemMessage(content=SYSTEM_PROMPT)]

    # Add question context as first assistant note
    if q_ctx:
        messages.append(HumanMessage(content=f"[Context for this conversation]\n{q_ctx}"))
        messages.append(AIMessage(content="Got it, I'll use this to guide my hints."))

    # Add conversation history
    for msg in history:
        if msg.role == "spark":
            messages.append(AIMessage(content=msg.content))
        else:
            messages.append(HumanMessage(content=msg.content))

    # Add current student message
    messages.append(HumanMessage(content=student_message))

    llm = _get_llm()
    try:
        resp = await llm.ainvoke(messages)
        return resp.content or "Hmm, interesting thinking! Can you tell me more about why you chose that? 🧐"
    except Exception as e:
        logger.error(f"SPARK turn error: {e}")
        return "I had a small issue — but I'm here! Can you tell me what you were thinking? 😊"


# ── Public service functions ──

async def start_conversation(
    db: AsyncSession,
    data: SparkConversationCreate,
) -> tuple[SparkConversation, SparkMessage]:
    """Create a conversation and get SPARK's opening hint message."""
    conv = SparkConversation(
        student_id=data.student_id,
        question_id=data.question_id,
        trigger=data.trigger,
        competency_id=data.competency_id,
        status="active",
    )
    db.add(conv)
    await db.flush()

    response_text = await _build_opening_message(db, data)

    msg = SparkMessage(
        conversation_id=conv.id,
        role="spark",
        content=response_text,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(conv)
    await db.refresh(msg)
    return conv, msg


async def process_turn(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    student_message: str,
) -> tuple[SparkMessage, bool, bool]:
    """Process a student message and return SPARK's response."""
    conv = await db.get(SparkConversation, conversation_id)
    if not conv or conv.status != "active":
        raise ValueError("Conversation not found or already ended")

    # Load history
    hist_result = await db.execute(
        select(SparkMessage)
        .where(SparkMessage.conversation_id == conversation_id)
        .order_by(SparkMessage.created_at)
    )
    history = list(hist_result.scalars().all())

    # Save student message
    student_msg = SparkMessage(
        conversation_id=conversation_id,
        role="student",
        content=student_message,
    )
    db.add(student_msg)
    await db.flush()

    response_text = await _build_turn_response(db, conv, history, student_message)

    spark_msg = SparkMessage(
        conversation_id=conversation_id,
        role="spark",
        content=response_text,
    )
    db.add(spark_msg)

    total_messages = len(history) + 2  # student + spark this turn
    max_msg = settings.SPARK_MAX_TURNS * 2
    is_complete = total_messages >= max_msg

    if is_complete:
        conv.status = "completed"
        conv.ended_at = datetime.utcnow()

    await db.commit()
    await db.refresh(spark_msg)
    return spark_msg, False, is_complete


async def end_conversation(
    db: AsyncSession,
    conversation_id: uuid.UUID,
) -> SparkMessage:
    """End a conversation with an encouraging closing message."""
    conv = await db.get(SparkConversation, conversation_id)
    if not conv:
        raise ValueError("Conversation not found")

    llm = _get_llm()
    try:
        resp = await llm.ainvoke([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content="The student is leaving. Give a short, warm, encouraging closing message (1-2 sentences)."),
        ])
        closing = resp.content or "Great effort today! Keep thinking — you're getting there! ⭐"
    except Exception:
        closing = "Great effort! Keep at it — you're making progress! ⭐"

    spark_msg = SparkMessage(
        conversation_id=conversation_id,
        role="spark",
        content=closing,
    )
    db.add(spark_msg)
    conv.status = "completed"
    conv.ended_at = datetime.utcnow()
    await db.commit()
    await db.refresh(spark_msg)
    return spark_msg


async def generate_hint(db: AsyncSession, data: SparkHintRequest) -> str:
    """One-shot hint generation."""
    q_ctx = await _fetch_question_context(db, data.question_id)
    llm = _get_llm()
    try:
        resp = await llm.ainvoke([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"Give a short hint for this question:\n{q_ctx}"),
        ])
        return resp.content or "Think carefully about what each option is really saying! 🤔"
    except Exception as e:
        logger.error(f"SPARK hint error: {e}")
        return "Think about it step by step — what does each option really mean? 💭"


async def get_conversation_detail(
    db: AsyncSession,
    conversation_id: uuid.UUID,
) -> tuple[SparkConversation, list[SparkMessage]]:
    conv = await db.get(SparkConversation, conversation_id)
    if not conv:
        raise ValueError("Conversation not found")
    result = await db.execute(
        select(SparkMessage)
        .where(SparkMessage.conversation_id == conversation_id)
        .order_by(SparkMessage.created_at)
    )
    return conv, list(result.scalars().all())
