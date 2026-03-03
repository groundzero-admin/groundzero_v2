"""SPARK AI Companion API endpoints."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("spark")

from app.database import get_db
from app.models.spark import SparkConversation
from app.schemas.spark import (
    SparkConversationCreate,
    SparkConversationDetailOut,
    SparkConversationOut,
    SparkEndResponse,
    SparkHintRequest,
    SparkHintResponse,
    SparkMessageOut,
    SparkStartResponse,
    SparkTurnRequest,
    SparkTurnResponse,
)
from app.services import spark_service

router = APIRouter(prefix="/spark", tags=["spark"])


@router.post("/conversations", response_model=SparkStartResponse, status_code=201)
async def start_conversation(
    data: SparkConversationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Start a new SPARK conversation.

    Creates a conversation record and returns SPARK's opening message.
    Use after a student gets a question wrong or reports low confidence.
    """
    logger.info(f"SPARK API: start_conversation | student={data.student_id} | trigger={data.trigger}")
    conv, msg = await spark_service.start_conversation(db, data)
    logger.info(f"SPARK API: conversation started | id={conv.id}")
    return SparkStartResponse(
        conversation_id=conv.id,
        message=SparkMessageOut.model_validate(msg),
    )


@router.post("/conversations/{conversation_id}/turn", response_model=SparkTurnResponse)
async def conversation_turn(
    conversation_id: UUID,
    data: SparkTurnRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a student message and get SPARK's response.

    Resumes the agent from its checkpoint — all prior context is preserved.
    """
    try:
        msg, evidence_submitted, is_complete = await spark_service.process_turn(
            db, conversation_id, data.content
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return SparkTurnResponse(
        message=SparkMessageOut.model_validate(msg),
        evidence_submitted=evidence_submitted,
        is_complete=is_complete,
    )


@router.post("/conversations/{conversation_id}/end", response_model=SparkEndResponse)
async def end_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """End a conversation. Agent wraps up and submits evidence if ready."""
    try:
        msg = await spark_service.end_conversation(db, conversation_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    conv = await db.get(SparkConversation, conversation_id)
    return SparkEndResponse(
        message=SparkMessageOut.model_validate(msg),
        evidence_submitted=conv.evidence_submitted if conv else False,
    )


@router.post("/hint", response_model=SparkHintResponse)
async def generate_hint(
    data: SparkHintRequest,
    db: AsyncSession = Depends(get_db),
):
    """One-shot hint for a question. No conversation created."""
    hint = await spark_service.generate_hint(db, data)
    return SparkHintResponse(hint=hint)


@router.get("/conversations/{conversation_id}", response_model=SparkConversationDetailOut)
async def get_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a conversation with all messages."""
    try:
        conv, messages = await spark_service.get_conversation_detail(db, conversation_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return SparkConversationDetailOut(
        conversation=SparkConversationOut.model_validate(conv),
        messages=[SparkMessageOut.model_validate(m) for m in messages],
    )
