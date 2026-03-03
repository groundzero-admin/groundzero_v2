"""SPARK service — orchestrates agent invocation + DB persistence."""

import logging
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.spark_agent import create_hint_agent, create_spark_agent, get_checkpointer, invoke_spark
from app.models.spark import SparkConversation, SparkMessage
from app.schemas.spark import SparkConversationCreate, SparkHintRequest

logger = logging.getLogger("spark")

# Module-level cache for agents + checkpointer
_agent = None
_hint_agent = None
_checkpointer = None


async def _get_agent():
    """Lazy-init the SPARK diagnosis agent (reused across requests)."""
    global _agent, _checkpointer
    if _agent is None:
        logger.info("SPARK: creating checkpointer...")
        _checkpointer = await get_checkpointer()
        logger.info("SPARK: creating agent...")
        _agent = await create_spark_agent(_checkpointer)
        logger.info("SPARK: agent ready")
    return _agent


async def _get_hint_agent():
    """Lazy-init the SPARK hint agent (reused across requests)."""
    global _hint_agent, _checkpointer
    if _hint_agent is None:
        if _checkpointer is None:
            _checkpointer = await get_checkpointer()
        _hint_agent = await create_hint_agent(_checkpointer)
    return _hint_agent


async def start_conversation(
    db: AsyncSession,
    data: SparkConversationCreate,
) -> tuple[SparkConversation, SparkMessage]:
    """Create a conversation and get SPARK's opening message."""
    # 1. Create conversation record
    conv = SparkConversation(
        student_id=data.student_id,
        question_id=data.question_id,
        trigger=data.trigger,
        competency_id=data.competency_id,
        status="active",
    )
    db.add(conv)
    await db.flush()

    # 2. Invoke agent for first turn (no student message — agent opens)
    agent = await _get_agent()
    context = {
        "trigger": data.trigger,
        "question_id": str(data.question_id) if data.question_id else None,
        "selected_option": data.selected_option,
        "confidence_report": data.confidence_report,
        "competency_id": data.competency_id,
        "student_id": str(data.student_id),
    }
    response_text = await invoke_spark(agent, thread_id=str(conv.id), context=context)

    # 3. Save SPARK's opening message
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
    """Process a student message and return SPARK's response.

    Returns: (spark_message, evidence_submitted, is_complete)
    """
    # 1. Verify conversation exists and is active
    conv = await db.get(SparkConversation, conversation_id)
    if not conv or conv.status != "active":
        raise ValueError("Conversation not found or already ended")

    # 2. Save student message
    student_msg = SparkMessage(
        conversation_id=conversation_id,
        role="student",
        content=student_message,
    )
    db.add(student_msg)
    await db.flush()

    # 3. Invoke agent (resumes from checkpoint)
    agent = await _get_agent()
    response_text = await invoke_spark(agent, thread_id=str(conversation_id), message=student_message)

    # 4. Save SPARK's response
    spark_msg = SparkMessage(
        conversation_id=conversation_id,
        role="spark",
        content=response_text,
    )
    db.add(spark_msg)

    # 5. Check if evidence was submitted by querying for llm_spark evidence
    #    created during this conversation's lifetime
    from app.models.evidence import EvidenceEvent
    ev_result = await db.execute(
        select(EvidenceEvent).where(
            EvidenceEvent.student_id == conv.student_id,
            EvidenceEvent.source == "llm_spark",
            EvidenceEvent.created_at >= conv.created_at,
        )
    )
    evidence_submitted = len(ev_result.scalars().all()) > 0
    if evidence_submitted:
        conv.evidence_submitted = True

    # Count messages to check if we've hit max turns
    msg_count_result = await db.execute(
        select(SparkMessage).where(SparkMessage.conversation_id == conversation_id)
    )
    total_messages = len(msg_count_result.scalars().all()) + 2  # + student + spark this turn

    # Auto-complete after max turns (~4 exchanges)
    max_msg = 10
    is_complete = total_messages >= max_msg or conv.evidence_submitted

    if is_complete:
        conv.status = "completed"
        conv.ended_at = datetime.utcnow()

    await db.commit()
    await db.refresh(spark_msg)

    return spark_msg, conv.evidence_submitted, is_complete


async def end_conversation(
    db: AsyncSession,
    conversation_id: uuid.UUID,
) -> SparkMessage:
    """End a conversation. Agent wraps up."""
    conv = await db.get(SparkConversation, conversation_id)
    if not conv:
        raise ValueError("Conversation not found")

    # Invoke agent with a wrap-up prompt
    agent = await _get_agent()
    response_text = await invoke_spark(
        agent,
        thread_id=str(conversation_id),
        message="[The student is leaving. Wrap up with a short encouraging message. If you haven't submitted evidence yet and have enough information, do so now.]",
    )

    # Save message and close
    spark_msg = SparkMessage(
        conversation_id=conversation_id,
        role="spark",
        content=response_text,
    )
    db.add(spark_msg)

    conv.status = "completed"
    conv.ended_at = datetime.utcnow()

    await db.commit()
    await db.refresh(spark_msg)

    return spark_msg


async def generate_hint(
    db: AsyncSession,
    data: SparkHintRequest,
) -> str:
    """One-shot hint generation. Uses dedicated hint agent (spark_hint feature)."""
    agent = await _get_hint_agent()

    # Use a random thread_id (no persistence needed for hints)
    thread_id = str(uuid.uuid4())
    context = {
        "trigger": "hint_request",
        "question_id": str(data.question_id),
        "student_id": str(data.student_id),
    }
    hint_text = await invoke_spark(agent, thread_id=thread_id, context=context)
    return hint_text


async def get_conversation_detail(
    db: AsyncSession,
    conversation_id: uuid.UUID,
) -> tuple[SparkConversation, list[SparkMessage]]:
    """Get conversation with all messages."""
    conv = await db.get(SparkConversation, conversation_id)
    if not conv:
        raise ValueError("Conversation not found")

    result = await db.execute(
        select(SparkMessage)
        .where(SparkMessage.conversation_id == conversation_id)
        .order_by(SparkMessage.created_at)
    )
    messages = list(result.scalars().all())

    return conv, messages
