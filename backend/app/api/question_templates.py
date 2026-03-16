"""Admin CRUD for question templates (activity interaction patterns)."""
from __future__ import annotations

import json
import logging
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.config import settings
from app.database import get_db
from app.models.question_template import QuestionTemplate
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/question-templates", tags=["admin-question-templates"])


class TemplateOut(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    description: str
    example_use_cases: str
    frontend_component: str
    icon: str
    scorable: bool
    input_schema: dict
    llm_prompt_template: str
    is_active: bool
    sort_order: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class TemplateCreate(BaseModel):
    slug: str
    name: str
    description: str = ""
    example_use_cases: str = ""
    frontend_component: str = ""
    icon: str = ""
    scorable: bool = True
    input_schema: dict = {}
    llm_prompt_template: str = ""
    is_active: bool = True
    sort_order: int = 0


class TemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    example_use_cases: str | None = None
    frontend_component: str | None = None
    icon: str | None = None
    scorable: bool | None = None
    input_schema: dict | None = None
    llm_prompt_template: str | None = None
    is_active: bool | None = None
    sort_order: int | None = None


def _to_out(t: QuestionTemplate) -> TemplateOut:
    return TemplateOut(
        id=t.id,
        slug=t.slug,
        name=t.name,
        description=t.description,
        example_use_cases=t.example_use_cases,
        frontend_component=t.frontend_component,
        icon=t.icon,
        scorable=t.scorable,
        input_schema=t.input_schema,
        llm_prompt_template=t.llm_prompt_template,
        is_active=t.is_active,
        sort_order=t.sort_order,
        created_at=t.created_at.isoformat(),
        updated_at=t.updated_at.isoformat(),
    )


@router.get("", response_model=list[TemplateOut])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
):
    result = await db.execute(
        select(QuestionTemplate).order_by(QuestionTemplate.sort_order)
    )
    return [_to_out(t) for t in result.scalars().all()]


@router.get("/{template_id}", response_model=TemplateOut)
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
):
    result = await db.execute(
        select(QuestionTemplate).where(QuestionTemplate.id == template_id)
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return _to_out(t)


@router.post("", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    body: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    t = QuestionTemplate(**body.model_dump())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return _to_out(t)


@router.put("/{template_id}", response_model=TemplateOut)
async def update_template(
    template_id: uuid.UUID,
    body: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(QuestionTemplate).where(QuestionTemplate.id == template_id)
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(t, field, value)

    await db.commit()
    await db.refresh(t)
    return _to_out(t)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(QuestionTemplate).where(QuestionTemplate.id == template_id)
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(t)
    await db.commit()


class GenerateRequest(BaseModel):
    description: str
    grade_band: str = ""


class GenerateResponse(BaseModel):
    data: dict


@router.post("/{template_id}/generate", response_model=GenerateResponse)
async def generate_question(
    template_id: uuid.UUID,
    body: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("admin", "teacher")),
):
    """Use LLM to generate question data from a plain-text description."""
    result = await db.execute(
        select(QuestionTemplate).where(QuestionTemplate.id == template_id)
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    if not t.llm_prompt_template:
        raise HTTPException(status_code=400, detail="Template has no LLM prompt")

    prompt = (
        t.llm_prompt_template
        .replace("{{description}}", body.description)
        .replace("{{grade_band}}", body.grade_band or "middle school")
    )

    try:
        client = AsyncOpenAI(api_key=settings.SPARK_API_KEY, base_url=settings.SPARK_BASE_URL)
        resp = await client.chat.completions.create(
            model=settings.SPARK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        content = resp.choices[0].message.content or ""
        # Extract first JSON object from the response
        match = re.search(r"\{[\s\S]*\}", content)
        if not match:
            raise ValueError("No JSON found in LLM response")
        data = json.loads(match.group())
    except Exception as exc:
        logger.exception("LLM generation failed")
        raise HTTPException(status_code=502, detail=f"Generation failed: {exc}") from exc

    return GenerateResponse(data=data)
