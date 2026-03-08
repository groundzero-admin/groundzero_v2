"""Live batch & session CRUD + template import — admin-only endpoints."""
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_role
from app.database import get_db
from app.models.live_batch import LiveBatch, LiveBatchSession
from app.models.template_cohort import TemplateCohort, TemplateSession
from app.models.user import User
from app.schemas.live_batch import (
    LiveBatchCreate,
    LiveBatchOut,
    LiveBatchSessionOut,
    LiveBatchSessionUpdate,
    LiveBatchUpdate,
    LiveBatchWithSessions,
)

router = APIRouter(prefix="/live-batches", tags=["live-batches"])


# ──────────────────────── helpers ────────────────────────


def _enrich_session(session: LiveBatchSession, batch: LiveBatch) -> LiveBatchSessionOut:
    """Build the response model, resolving parent values for non-modified sessions."""
    # If linked to a template and NOT locally modified, inherit template values
    ts = session.template_session
    if ts and not session.is_locally_modified:
        title = ts.title
        description = ts.description
        day = ts.day
    else:
        title = session.title
        description = session.description
        day = session.day

    scheduled_date = batch.start_date + timedelta(days=day - 1) if batch.start_date else None

    return LiveBatchSessionOut(
        id=session.id,
        batch_id=session.batch_id,
        template_session_id=session.template_session_id,
        title=title,
        description=description,
        day=day,
        order=session.order,
        is_locally_modified=session.is_locally_modified,
        scheduled_date=scheduled_date,
        daily_timing=session.daily_timing or batch.daily_timing,
        hms_room_id=session.hms_room_id,
        hms_room_code_host=session.hms_room_code_host,
        hms_room_code_guest=session.hms_room_code_guest,
        is_live=session.is_live,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


# ──────────────────────── Live Batch CRUD ────────────────────────


@router.get("", response_model=list[LiveBatchOut], summary="List live batches")
async def list_live_batches(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(LiveBatch).order_by(LiveBatch.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=LiveBatchOut, status_code=201, summary="Create live batch")
async def create_live_batch(
    data: LiveBatchCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    batch = LiveBatch(**data.model_dump())
    db.add(batch)
    await db.commit()
    await db.refresh(batch)
    return batch


@router.get("/{batch_id}", response_model=LiveBatchWithSessions, summary="Get batch with sessions")
async def get_live_batch(
    batch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(LiveBatch)
        .where(LiveBatch.id == batch_id)
        .options(selectinload(LiveBatch.sessions))
    )
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Live batch not found")

    # Enrich sessions (resolve parent-child values)
    enriched_sessions = [_enrich_session(s, batch) for s in batch.sessions]
    return LiveBatchWithSessions(
        id=batch.id,
        name=batch.name,
        description=batch.description,
        start_date=batch.start_date,
        daily_timing=batch.daily_timing,
        created_at=batch.created_at,
        updated_at=batch.updated_at,
        sessions=enriched_sessions,
    )


@router.put("/{batch_id}", response_model=LiveBatchOut, summary="Update live batch")
async def update_live_batch(
    batch_id: uuid.UUID,
    data: LiveBatchUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(LiveBatch).where(LiveBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Live batch not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(batch, field, value)
    await db.commit()
    await db.refresh(batch)
    return batch


@router.delete("/{batch_id}", status_code=204, summary="Delete live batch")
async def delete_live_batch(
    batch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(LiveBatch).where(LiveBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Live batch not found")

    await db.delete(batch)
    await db.commit()


# ──────────────────────── Import template into batch ────────────────────────


@router.post(
    "/{batch_id}/import/{template_cohort_id}",
    response_model=list[LiveBatchSessionOut],
    summary="Import sessions from a template cohort",
)
async def import_template(
    batch_id: uuid.UUID,
    template_cohort_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Import all sessions from a template cohort into this live batch.

    - Skips sessions that are already imported (same template_session_id).
    - Links each live session to the template session via FK.
    """
    # Check batch exists
    batch_result = await db.execute(select(LiveBatch).where(LiveBatch.id == batch_id))
    batch = batch_result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Live batch not found")

    # Get template with sessions
    tc_result = await db.execute(
        select(TemplateCohort)
        .where(TemplateCohort.id == template_cohort_id)
        .options(selectinload(TemplateCohort.sessions))
    )
    template = tc_result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template cohort not found")

    # Get existing linked template_session_ids for this batch
    existing_result = await db.execute(
        select(LiveBatchSession.template_session_id).where(LiveBatchSession.batch_id == batch_id)
    )
    existing_ids = {row for row in existing_result.scalars().all() if row is not None}

    # Find max order in batch for appending
    order_result = await db.execute(
        select(LiveBatchSession.order)
        .where(LiveBatchSession.batch_id == batch_id)
        .order_by(LiveBatchSession.order.desc())
        .limit(1)
    )
    max_order = order_result.scalar_one_or_none() or 0

    imported = []
    for ts in template.sessions:
        if ts.id in existing_ids:
            continue  # already imported — skip

        max_order += 1
        lbs = LiveBatchSession(
            batch_id=batch_id,
            template_session_id=ts.id,
            title=ts.title,
            description=ts.description,
            day=ts.day,
            order=max_order,
        )
        db.add(lbs)
        imported.append(lbs)

    await db.commit()

    # Return all sessions for this batch (enriched)
    all_result = await db.execute(
        select(LiveBatchSession)
        .where(LiveBatchSession.batch_id == batch_id)
        .order_by(LiveBatchSession.order)
    )
    all_sessions = all_result.scalars().all()
    return [_enrich_session(s, batch) for s in all_sessions]


# ──────────────────────── Live Batch Session Update (local override) ────────────────────────


@router.put(
    "/{batch_id}/sessions/{session_id}",
    response_model=LiveBatchSessionOut,
    summary="Update a live batch session (local override)",
)
async def update_live_batch_session(
    batch_id: uuid.UUID,
    session_id: uuid.UUID,
    data: LiveBatchSessionUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Update a session locally. Marks it as locally modified so it no longer
    inherits changes from the parent template session."""
    result = await db.execute(
        select(LiveBatchSession).where(
            LiveBatchSession.id == session_id, LiveBatchSession.batch_id == batch_id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Live batch session not found")

    updates = data.model_dump(exclude_unset=True)
    if updates:
        for field, value in updates.items():
            setattr(session, field, value)
        session.is_locally_modified = True
        await db.commit()
        await db.refresh(session)

    # Get batch for enrichment
    batch_result = await db.execute(select(LiveBatch).where(LiveBatch.id == batch_id))
    batch = batch_result.scalar_one_or_none()

    return _enrich_session(session, batch)
