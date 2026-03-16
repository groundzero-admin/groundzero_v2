"""Template CRUD — reusable lesson plan blueprints (groups of activities)."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.session import Session, SessionActivity
from app.models.template_cohort import Template
from app.models.user import User

router = APIRouter(prefix="/templates", tags=["templates"])


# ── Schemas ──

class TemplateCreate(BaseModel):
    title: str = Field(max_length=300)
    description: str | None = None
    order: int | None = None
    activities: list[str] = []  # list of activity IDs


class TemplateUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    description: str | None = None
    order: int | None = None
    activities: list[str] | None = None


class TemplateOut(BaseModel):
    id: str
    title: str
    description: str | None
    order: int | None
    activities: list[str]
    created_at: str
    updated_at: str


def _out(t: Template) -> TemplateOut:
    return TemplateOut(
        id=str(t.id),
        title=t.title,
        description=t.description,
        order=t.order,
        activities=t.activities or [],
        created_at=t.created_at.isoformat(),
        updated_at=t.updated_at.isoformat(),
    )


# ── CRUD ──

@router.get("", response_model=list[TemplateOut], summary="List templates")
async def list_templates(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Template).order_by(Template.order.asc().nulls_last(), Template.created_at.desc()))
    return [_out(t) for t in result.scalars().all()]


@router.post("", response_model=TemplateOut, status_code=201, summary="Create template")
async def create_template(
    data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    t = Template(**data.model_dump())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return _out(t)


@router.get("/{template_id}", response_model=TemplateOut, summary="Get template")
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    t = await db.get(Template, template_id)
    if not t:
        raise HTTPException(404, "Template not found")
    return _out(t)


@router.put("/{template_id}", response_model=TemplateOut, summary="Update template")
async def update_template(
    template_id: uuid.UUID,
    data: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    t = await db.get(Template, template_id)
    if not t:
        raise HTTPException(404, "Template not found")

    updated_fields = data.model_dump(exclude_unset=True)
    for field, value in updated_fields.items():
        setattr(t, field, value)

    # ── Cascade changes to un-started sessions linked to this template ──
    linked_result = await db.execute(
        select(Session).where(
            Session.template_id == template_id,
            Session.started_at.is_(None),  # only un-started sessions
        )
    )
    linked_sessions = linked_result.scalars().all()

    for session in linked_sessions:
        # Always sync title and description
        session.title = t.title
        session.description = t.description

        # If activities changed, rebuild session_activities
        if "activities" in updated_fields:
            await db.execute(
                delete(SessionActivity).where(SessionActivity.session_id == session.id)
            )
            for idx, activity_id in enumerate(t.activities or [], start=1):
                db.add(SessionActivity(
                    session_id=session.id,
                    activity_id=activity_id,
                    order=idx,
                ))

    await db.commit()
    await db.refresh(t)
    return _out(t)


@router.delete("/{template_id}", status_code=204, summary="Delete template")
async def delete_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    t = await db.get(Template, template_id)
    if not t:
        raise HTTPException(404, "Template not found")
    await db.delete(t)
    await db.commit()
