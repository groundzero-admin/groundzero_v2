"""Admin CRUD for activity questions (questions created from templates)."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.activity_question import ActivityQuestion
from app.models.competency import Competency
from app.models.question_template import QuestionTemplate
from app.models.user import User

router = APIRouter(prefix="/admin/activity-questions", tags=["admin-activity-questions"])


class AQOut(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID
    template_slug: str | None = None
    template_name: str | None = None
    title: str
    data: dict
    grade_band: str
    competency_id: str
    difficulty: float
    created_by: uuid.UUID | None
    is_published: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AQCreate(BaseModel):
    template_id: uuid.UUID
    title: str
    data: dict = Field(default_factory=dict)
    grade_band: str = ""
    competency_id: str = Field(min_length=1)
    difficulty: float = 0.5
    is_published: bool = False


class AQUpdate(BaseModel):
    title: str | None = None
    data: dict | None = None
    grade_band: str | None = None
    competency_id: str | None = None
    difficulty: float | None = None
    is_published: bool | None = None


@router.get("", response_model=list[AQOut])
async def list_questions(
    template_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
):
    stmt = (
        select(
            ActivityQuestion,
            QuestionTemplate.slug.label("template_slug"),
            QuestionTemplate.name.label("template_name"),
        )
        .outerjoin(QuestionTemplate, ActivityQuestion.template_id == QuestionTemplate.id)
        .order_by(ActivityQuestion.created_at.desc())
    )
    if template_id:
        stmt = stmt.where(ActivityQuestion.template_id == template_id)
    rows = (await db.execute(stmt)).all()
    result = []
    for aq, slug, name in rows:
        d = AQOut.model_validate(aq)
        d.template_slug = slug
        d.template_name = name
        result.append(d)
    return result


@router.get("/{question_id}", response_model=AQOut)
async def get_question(
    question_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
):
    stmt = (
        select(
            ActivityQuestion,
            QuestionTemplate.slug.label("template_slug"),
            QuestionTemplate.name.label("template_name"),
        )
        .outerjoin(QuestionTemplate, ActivityQuestion.template_id == QuestionTemplate.id)
        .where(ActivityQuestion.id == question_id)
    )
    row = (await db.execute(stmt)).first()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Question not found")
    aq, slug, name = row
    d = AQOut.model_validate(aq)
    d.template_slug = slug
    d.template_name = name
    return d


@router.post("", response_model=AQOut, status_code=status.HTTP_201_CREATED)
async def create_question(
    body: AQCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "teacher")),
):
    tmpl = await db.get(QuestionTemplate, body.template_id)
    if not tmpl:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Template not found")
    comp = await db.get(Competency, body.competency_id)
    if not comp:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Competency not found")
    aq = ActivityQuestion(
        template_id=body.template_id,
        title=body.title,
        data=body.data,
        grade_band=body.grade_band,
        competency_id=body.competency_id,
        difficulty=body.difficulty,
        is_published=body.is_published,
        created_by=user.id,
    )
    db.add(aq)
    await db.commit()
    await db.refresh(aq)
    d = AQOut.model_validate(aq)
    d.template_slug = tmpl.slug
    d.template_name = tmpl.name
    return d


@router.put("/{question_id}", response_model=AQOut)
async def update_question(
    question_id: uuid.UUID,
    body: AQUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    aq = await db.get(ActivityQuestion, question_id)
    if not aq:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Question not found")
    updates = body.model_dump(exclude_none=True)
    if "competency_id" in updates:
        comp = await db.get(Competency, updates["competency_id"])
        if not comp:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Competency not found")
    for k, v in updates.items():
        setattr(aq, k, v)
    await db.commit()
    await db.refresh(aq)
    tmpl = await db.get(QuestionTemplate, aq.template_id)
    d = AQOut.model_validate(aq)
    d.template_slug = tmpl.slug if tmpl else None
    d.template_name = tmpl.name if tmpl else None
    return d



@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    aq = await db.get(ActivityQuestion, question_id)
    if not aq:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Question not found")
    await db.delete(aq)
    await db.commit()
