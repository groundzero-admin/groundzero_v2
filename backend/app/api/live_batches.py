"""Cohort & session CRUD + template import — admin-only endpoints."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_role
from app.database import get_db
from app.models.session import Cohort, Session, SessionActivity
from app.models.template_cohort import Template
from app.models.user import User

router = APIRouter(prefix="/cohorts", tags=["cohorts"])


# ── Schemas ──

class CohortCreate(BaseModel):
    name: str = Field(max_length=200)
    description: str | None = None
    grade_band: str = Field(default="6-7", pattern=r"^(4-5|6-7|8-9)$")
    board: str | None = None


class CohortUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    description: str | None = None
    grade_band: str | None = None
    board: str | None = None


class CohortOut(BaseModel):
    id: str
    name: str
    description: str | None
    grade_band: str
    board: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: str
    cohort_id: str
    template_id: str | None
    teacher_id: str | None = None
    title: str | None
    description: str | None
    order: int | None
    session_number: int
    scheduled_at: str | None
    is_live: bool = False
    hms_room_id: str | None = None
    room_code_host: str | None = None
    room_code_guest: str | None = None
    created_at: str
    updated_at: str


class CohortWithSessions(CohortOut):
    sessions: list[SessionOut] = []


class SessionUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    description: str | None = None
    order: int | None = Field(default=None, ge=0)
    scheduled_at: str | None = None
    teacher_id: str | None = None


# ── Helpers ──

def _session_out(session: Session) -> SessionOut:
    room = session.live_room
    return SessionOut(
        id=str(session.id),
        cohort_id=str(session.cohort_id),
        template_id=str(session.template_id) if session.template_id else None,
        teacher_id=str(session.teacher_id) if session.teacher_id else None,
        title=session.title,
        description=session.description,
        order=session.order,
        session_number=session.session_number,
        scheduled_at=session.scheduled_at.isoformat() if session.scheduled_at else None,
        is_live=session.started_at is not None and session.ended_at is None,
        hms_room_id=room.hms_room_id if room else None,
        room_code_host=room.room_code_host if room else None,
        room_code_guest=room.room_code_guest if room else None,
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
    )


def _cohort_out(cohort: Cohort) -> CohortOut:
    return CohortOut(
        id=str(cohort.id),
        name=cohort.name,
        description=cohort.description,
        grade_band=cohort.grade_band,
        board=cohort.board,
        created_at=cohort.created_at.isoformat(),
        updated_at=cohort.updated_at.isoformat(),
    )


# ── Teachers list (for assignment dropdown) ──

@router.get("/teachers", summary="List teachers for assignment")
async def list_teachers(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(User).where(User.role.in_(["teacher", "admin"])).order_by(User.full_name)
    )
    return [
        {"id": str(u.id), "full_name": u.full_name, "email": u.email}
        for u in result.scalars().all()
    ]


# ── Cohort CRUD ──

@router.get("", response_model=list[CohortOut], summary="List cohorts")
async def list_cohorts(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Cohort).order_by(Cohort.created_at.desc()))
    return [_cohort_out(c) for c in result.scalars().all()]


@router.post("", response_model=CohortOut, status_code=201, summary="Create cohort")
async def create_cohort(
    data: CohortCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    cohort = Cohort(**data.model_dump())
    db.add(cohort)
    await db.commit()
    await db.refresh(cohort)
    return _cohort_out(cohort)


@router.get("/{cohort_id}", response_model=CohortWithSessions, summary="Get cohort with sessions")
async def get_cohort(
    cohort_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(Cohort)
        .where(Cohort.id == cohort_id)
        .options(
            selectinload(Cohort.sessions).selectinload(Session.live_room),
        )
    )
    cohort = result.scalar_one_or_none()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    out = _cohort_out(cohort)
    return CohortWithSessions(
        **out.model_dump(),
        sessions=[_session_out(s) for s in cohort.sessions],
    )


@router.put("/{cohort_id}", response_model=CohortOut, summary="Update cohort")
async def update_cohort(
    cohort_id: uuid.UUID,
    data: CohortUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Cohort).where(Cohort.id == cohort_id))
    cohort = result.scalar_one_or_none()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cohort, field, value)
    await db.commit()
    await db.refresh(cohort)
    return _cohort_out(cohort)


@router.delete("/{cohort_id}", status_code=204, summary="Delete cohort")
async def delete_cohort(
    cohort_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Cohort).where(Cohort.id == cohort_id))
    cohort = result.scalar_one_or_none()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    await db.delete(cohort)
    await db.commit()


# ── Import templates into cohort ──

class ImportTemplateItem(BaseModel):
    template_id: str
    scheduled_at: str | None = None
    teacher_id: str | None = None


@router.post(
    "/{cohort_id}/import-templates",
    response_model=list[SessionOut],
    summary="Import templates as sessions into a cohort",
    description="Each template becomes a session. Activities from the template are copied into session_activities. Optionally assign scheduled_at and teacher_id per template.",
)
async def import_templates(
    cohort_id: uuid.UUID,
    items: list[ImportTemplateItem],
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    cohort = await db.get(Cohort, cohort_id)
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    # Get current max order
    order_result = await db.execute(
        select(Session.order)
        .where(Session.cohort_id == cohort_id)
        .order_by(Session.order.desc().nulls_last())
        .limit(1)
    )
    max_order = order_result.scalar_one_or_none() or 0

    # Check which templates are already imported
    existing_result = await db.execute(
        select(Session.template_id).where(
            Session.cohort_id == cohort_id,
            Session.template_id.is_not(None),
        )
    )
    existing_ids = {row for row in existing_result.scalars().all()}

    for item in items:
        tid = uuid.UUID(item.template_id)
        if tid in existing_ids:
            continue

        template = await db.get(Template, tid)
        if not template:
            continue

        max_order += 1

        # Parse scheduled_at if provided
        from datetime import datetime as dt
        sched = None
        if item.scheduled_at:
            try:
                sched = dt.fromisoformat(item.scheduled_at)
            except ValueError:
                pass

        t_id = uuid.UUID(item.teacher_id) if item.teacher_id else None

        sess = Session(
            cohort_id=cohort_id,
            template_id=tid,
            title=template.title,
            description=template.description,
            order=max_order,
            scheduled_at=sched,
            teacher_id=t_id,
        )
        db.add(sess)
        await db.flush()

        # Create session_activities from template's activity list
        for idx, activity_id in enumerate(template.activities or [], start=1):
            sa = SessionActivity(
                session_id=sess.id,
                activity_id=activity_id,
                order=idx,
            )
            db.add(sa)

    await db.commit()

    # Return all sessions
    all_result = await db.execute(
        select(Session)
        .where(Session.cohort_id == cohort_id)
        .options(selectinload(Session.live_room))
        .order_by(Session.order)
    )
    return [_session_out(s) for s in all_result.scalars().all()]


# ── Session Update ──

@router.put(
    "/{cohort_id}/sessions/{session_id}",
    response_model=SessionOut,
    summary="Update a session",
)
async def update_session(
    cohort_id: uuid.UUID,
    session_id: uuid.UUID,
    data: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(Session)
        .where(Session.id == session_id, Session.cohort_id == cohort_id)
        .options(selectinload(Session.live_room))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    updates = data.model_dump(exclude_unset=True)
    if updates:
        # Parse scheduled_at string → datetime
        if "scheduled_at" in updates and updates["scheduled_at"]:
            from datetime import datetime as dt
            try:
                updates["scheduled_at"] = dt.fromisoformat(updates["scheduled_at"])
            except (ValueError, TypeError):
                pass
        # Parse teacher_id string → UUID
        if "teacher_id" in updates and updates["teacher_id"]:
            updates["teacher_id"] = uuid.UUID(updates["teacher_id"])

        for field, value in updates.items():
            setattr(session, field, value)
        await db.commit()
        await db.refresh(session)

    return _session_out(session)
