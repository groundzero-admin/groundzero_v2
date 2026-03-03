"""Competency + skill graph routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.competency import Capability, Competency, Pillar
from app.models.skill_graph import CodevelopmentEdge, PrerequisiteEdge
from app.schemas.competency import (
    CapabilityCreate,
    CapabilityOut,
    CodevelopmentEdgeOut,
    CompetencyCreate,
    CompetencyOut,
    PillarCreate,
    PillarOut,
    PrerequisiteEdgeOut,
    SkillGraphOut,
)

router = APIRouter(prefix="/competencies", tags=["competencies"])


@router.get(
    "",
    response_model=list[CompetencyOut],
    summary="List All Competencies",
    description="Retrieve all 59 competencies across 4 pillars, including assessment method, grade band, and capability groupings.",
)
async def list_competencies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Competency).order_by(Competency.id))
    return result.scalars().all()


@router.get(
    "/pillars",
    response_model=list[PillarOut],
    summary="List Learning Pillars",
    description="Retrieve the 4 learning pillars (Communication, Creativity, AI & Systems, Math & Logic) with their colors and display names.",
)
async def list_pillars(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Pillar).order_by(Pillar.id))
    return result.scalars().all()


@router.get(
    "/capabilities",
    response_model=list[CapabilityOut],
    summary="List Capability Groups",
    description="Retrieve capability groups that organize competencies within each pillar (e.g., 'Verbal Expression' under Communication).",
)
async def list_capabilities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Capability).order_by(Capability.id))
    return result.scalars().all()


@router.get(
    "/{competency_id}",
    response_model=CompetencyOut,
    summary="Get Competency Details",
    description="Retrieve a single competency by ID (e.g., C1.1) with its full details including name, description, assessment method, and grade band.",
)
async def get_competency(competency_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Competency).where(Competency.id == competency_id))
    comp = result.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=404, detail="Competency not found")
    return comp


# ── Create endpoints ──


@router.post(
    "/pillars",
    response_model=PillarOut,
    status_code=201,
    summary="Create Learning Pillar",
    description="Add a new learning pillar (e.g., Communication, Creativity). Each pillar groups related capabilities and competencies.",
)
async def create_pillar(data: PillarCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Pillar).where(Pillar.id == data.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Pillar '{data.id}' already exists")
    pillar = Pillar(id=data.id, name=data.name, color=data.color, description=data.description)
    db.add(pillar)
    await db.commit()
    await db.refresh(pillar)
    return pillar


@router.post(
    "/capabilities",
    response_model=CapabilityOut,
    status_code=201,
    summary="Create Capability Group",
    description="Add a new capability group under a pillar. Capabilities organize related competencies (e.g., 'Verbal Expression' under Communication).",
)
async def create_capability(data: CapabilityCreate, db: AsyncSession = Depends(get_db)):
    # Verify pillar exists
    pillar = await db.execute(select(Pillar).where(Pillar.id == data.pillar_id))
    if not pillar.scalar_one_or_none():
        raise HTTPException(status_code=404, detail=f"Pillar '{data.pillar_id}' not found")
    existing = await db.execute(select(Capability).where(Capability.id == data.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Capability '{data.id}' already exists")
    cap = Capability(id=data.id, pillar_id=data.pillar_id, name=data.name, description=data.description)
    db.add(cap)
    await db.commit()
    await db.refresh(cap)
    return cap


@router.post(
    "",
    response_model=CompetencyOut,
    status_code=201,
    summary="Create Competency",
    description="Add a new competency under a capability group. Competencies are the atomic skills tracked by the BKT mastery engine (e.g., C1.1 Articulating Ideas Clearly).",
)
async def create_competency(data: CompetencyCreate, db: AsyncSession = Depends(get_db)):
    # Verify capability exists
    cap = await db.execute(select(Capability).where(Capability.id == data.capability_id))
    if not cap.scalar_one_or_none():
        raise HTTPException(status_code=404, detail=f"Capability '{data.capability_id}' not found")
    existing = await db.execute(select(Competency).where(Competency.id == data.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Competency '{data.id}' already exists")
    comp = Competency(
        id=data.id,
        capability_id=data.capability_id,
        name=data.name,
        description=data.description,
        assessment_method=data.assessment_method,
        default_params=data.default_params,
    )
    db.add(comp)
    await db.commit()
    await db.refresh(comp)
    return comp


skill_graph_router = APIRouter(prefix="/skill-graph", tags=["skill-graph"])


@skill_graph_router.get(
    "",
    response_model=SkillGraphOut,
    summary="Get Skill Dependency Graph",
    description="Retrieve the full skill graph including all competencies, prerequisite edges, and codevelopment edges. Used for visualizing learning pathways.",
)
async def get_skill_graph(db: AsyncSession = Depends(get_db)):
    comps = (await db.execute(select(Competency).order_by(Competency.id))).scalars().all()
    prereqs = (await db.execute(select(PrerequisiteEdge))).scalars().all()
    codevs = (await db.execute(select(CodevelopmentEdge))).scalars().all()
    return SkillGraphOut(
        competencies=comps,
        prerequisite_edges=prereqs,
        codevelopment_edges=codevs,
    )
