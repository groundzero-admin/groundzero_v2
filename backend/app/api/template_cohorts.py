"""Template cohort & session CRUD — admin-only endpoints."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_role
from app.database import get_db
from app.models.template_cohort import TemplateCohort, TemplateSession
from app.models.user import User
from app.schemas.template_cohort import (
    ReorderItem,
    TemplateCohortCreate,
    TemplateCohortOut,
    TemplateCohortUpdate,
    TemplateCohortWithSessions,
    TemplateSessionCreate,
    TemplateSessionOut,
    TemplateSessionUpdate,
)

router = APIRouter(prefix="/template-cohorts", tags=["template-cohorts"])

# ──────────────────────── Template Cohort CRUD ────────────────────────


@router.get("", response_model=list[TemplateCohortOut], summary="List template cohorts")
async def list_template_cohorts(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(TemplateCohort).order_by(TemplateCohort.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=TemplateCohortOut, status_code=201, summary="Create template cohort")
async def create_template_cohort(
    data: TemplateCohortCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    cohort = TemplateCohort(**data.model_dump())
    db.add(cohort)
    await db.commit()
    await db.refresh(cohort)
    return cohort


@router.get("/{cohort_id}", response_model=TemplateCohortWithSessions, summary="Get template cohort with sessions")
async def get_template_cohort(
    cohort_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(TemplateCohort)
        .where(TemplateCohort.id == cohort_id)
        .options(selectinload(TemplateCohort.sessions))
    )
    cohort = result.scalar_one_or_none()
    if not cohort:
        raise HTTPException(status_code=404, detail="Template cohort not found")
    return cohort


@router.put("/{cohort_id}", response_model=TemplateCohortOut, summary="Update template cohort")
async def update_template_cohort(
    cohort_id: uuid.UUID,
    data: TemplateCohortUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(TemplateCohort).where(TemplateCohort.id == cohort_id))
    cohort = result.scalar_one_or_none()
    if not cohort:
        raise HTTPException(status_code=404, detail="Template cohort not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cohort, field, value)
    await db.commit()
    await db.refresh(cohort)
    return cohort


@router.delete("/{cohort_id}", status_code=204, summary="Delete template cohort")
async def delete_template_cohort(
    cohort_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(TemplateCohort).where(TemplateCohort.id == cohort_id))
    cohort = result.scalar_one_or_none()
    if not cohort:
        raise HTTPException(status_code=404, detail="Template cohort not found")

    await db.delete(cohort)
    await db.commit()


# ──────────────────────── Template Session CRUD ────────────────────────


@router.post(
    "/{cohort_id}/sessions",
    response_model=TemplateSessionOut,
    status_code=201,
    summary="Add session to template",
)
async def create_template_session(
    cohort_id: uuid.UUID,
    data: TemplateSessionCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    # Verify cohort exists
    result = await db.execute(select(TemplateCohort).where(TemplateCohort.id == cohort_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Template cohort not found")

    session = TemplateSession(template_cohort_id=cohort_id, **data.model_dump())
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.put(
    "/{cohort_id}/sessions/{session_id}",
    response_model=TemplateSessionOut,
    summary="Update template session",
)
async def update_template_session(
    cohort_id: uuid.UUID,
    session_id: uuid.UUID,
    data: TemplateSessionUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(TemplateSession).where(
            TemplateSession.id == session_id, TemplateSession.template_cohort_id == cohort_id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Template session not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    await db.commit()
    await db.refresh(session)
    return session


@router.delete(
    "/{cohort_id}/sessions/{session_id}",
    status_code=204,
    summary="Delete template session",
)
async def delete_template_session(
    cohort_id: uuid.UUID,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(TemplateSession).where(
            TemplateSession.id == session_id, TemplateSession.template_cohort_id == cohort_id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Template session not found")

    await db.delete(session)
    await db.commit()


@router.put(
    "/{cohort_id}/sessions/reorder",
    response_model=list[TemplateSessionOut],
    summary="Bulk reorder sessions",
)
async def reorder_template_sessions(
    cohort_id: uuid.UUID,
    items: list[ReorderItem],
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    for item in items:
        await db.execute(
            update(TemplateSession)
            .where(TemplateSession.id == item.id, TemplateSession.template_cohort_id == cohort_id)
            .values(order=item.order)
        )
    await db.commit()

    result = await db.execute(
        select(TemplateSession)
        .where(TemplateSession.template_cohort_id == cohort_id)
        .order_by(TemplateSession.order)
    )
    return result.scalars().all()
