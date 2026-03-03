"""Curriculum topic routes — browse CBSE/IB/ICSE chapter-level content."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.competency import Competency
from app.models.curriculum import Question
from app.models.curriculum_topic import CurriculumTopic, TopicCompetencyMap
from app.schemas.curriculum import QuestionOut
from app.schemas.curriculum_topic import (
    CurriculumTopicCreate,
    CurriculumTopicDetailOut,
    CurriculumTopicOut,
    TopicCompetencyDetailOut,
    TopicCompetencyMapCreate,
    TopicCompetencyMapOut,
)

router = APIRouter(prefix="/topics", tags=["curriculum-topics"])


@router.get(
    "",
    response_model=list[CurriculumTopicOut],
    summary="Browse Curriculum Topics",
    description="List curriculum topics, filterable by board (cbse/ib/icse), subject, and grade. "
    "Returns topics ordered by grade and chapter number.",
)
async def list_topics(
    board: str | None = Query(None, description="Filter by board: cbse, ib, icse"),
    subject: str | None = Query(None, description="Filter by subject: mathematics, science"),
    grade: int | None = Query(None, ge=4, le=9, description="Filter by grade level"),
    db: AsyncSession = Depends(get_db),
):
    query = select(CurriculumTopic).order_by(
        CurriculumTopic.grade, CurriculumTopic.chapter_number
    )
    if board:
        query = query.where(CurriculumTopic.board == board)
    if subject:
        query = query.where(CurriculumTopic.subject == subject)
    if grade:
        query = query.where(CurriculumTopic.grade == grade)
    result = await db.execute(query)
    return result.scalars().all()


@router.get(
    "/{topic_id}",
    response_model=CurriculumTopicDetailOut,
    summary="Get Topic with Competency Mappings",
    description="Retrieve a single curriculum topic with its content blocks and mapped competencies.",
)
async def get_topic(topic_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CurriculumTopic).where(CurriculumTopic.id == topic_id)
    )
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    # Fetch mapped competencies with names
    maps_result = await db.execute(
        select(TopicCompetencyMap, Competency.name)
        .join(Competency, TopicCompetencyMap.competency_id == Competency.id)
        .where(TopicCompetencyMap.topic_id == topic_id)
        .order_by(TopicCompetencyMap.relevance.desc())
    )
    competencies = [
        TopicCompetencyDetailOut(
            competency_id=row.TopicCompetencyMap.competency_id,
            competency_name=row.name,
            relevance=row.TopicCompetencyMap.relevance,
        )
        for row in maps_result.all()
    ]
    return CurriculumTopicDetailOut(
        topic=CurriculumTopicOut.model_validate(topic),
        competencies=competencies,
    )


@router.post(
    "",
    response_model=CurriculumTopicOut,
    status_code=201,
    summary="Create Curriculum Topic",
    description="Add a new curriculum topic (chapter/unit) for a board, subject, and grade. "
    "Topics are browsed by students and map to underlying competencies.",
)
async def create_topic(data: CurriculumTopicCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(CurriculumTopic).where(CurriculumTopic.id == data.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Topic '{data.id}' already exists")
    topic = CurriculumTopic(
        id=data.id,
        board=data.board,
        subject=data.subject,
        grade=data.grade,
        chapter_number=data.chapter_number,
        name=data.name,
        description=data.description,
        ncert_ref=data.ncert_ref,
        content=data.content,
    )
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    return topic


@router.post(
    "/{topic_id}/competencies",
    response_model=TopicCompetencyMapOut,
    status_code=201,
    summary="Map Competency to Topic",
    description="Create a mapping between a curriculum topic and a competency with a relevance score. "
    "This links school subjects to the BKT mastery engine.",
)
async def map_competency_to_topic(
    topic_id: str,
    data: TopicCompetencyMapCreate,
    db: AsyncSession = Depends(get_db),
):
    # Verify topic exists
    topic = await db.execute(
        select(CurriculumTopic).where(CurriculumTopic.id == topic_id)
    )
    if not topic.scalar_one_or_none():
        raise HTTPException(status_code=404, detail=f"Topic '{topic_id}' not found")
    # Verify competency exists
    comp = await db.execute(
        select(Competency).where(Competency.id == data.competency_id)
    )
    if not comp.scalar_one_or_none():
        raise HTTPException(
            status_code=404, detail=f"Competency '{data.competency_id}' not found"
        )
    # Check for existing mapping
    existing = await db.execute(
        select(TopicCompetencyMap).where(
            TopicCompetencyMap.topic_id == topic_id,
            TopicCompetencyMap.competency_id == data.competency_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Mapping '{topic_id}' -> '{data.competency_id}' already exists",
        )
    mapping = TopicCompetencyMap(
        topic_id=topic_id,
        competency_id=data.competency_id,
        relevance=data.relevance,
    )
    db.add(mapping)
    await db.commit()
    await db.refresh(mapping)
    return mapping


@router.get(
    "/{topic_id}/questions",
    response_model=list[QuestionOut],
    summary="Get Questions for Topic",
    description="Retrieve all questions tagged to a specific curriculum topic, "
    "optionally filtered by difficulty range.",
)
async def get_topic_questions(
    topic_id: str,
    difficulty_min: float | None = Query(None, ge=0.0, le=1.0),
    difficulty_max: float | None = Query(None, ge=0.0, le=1.0),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    # Verify topic exists
    topic = await db.execute(
        select(CurriculumTopic).where(CurriculumTopic.id == topic_id)
    )
    if not topic.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Topic not found")
    query = (
        select(Question)
        .where(Question.topic_id == topic_id)
        .order_by(Question.difficulty)
        .limit(limit)
    )
    if difficulty_min is not None:
        query = query.where(Question.difficulty >= difficulty_min)
    if difficulty_max is not None:
        query = query.where(Question.difficulty <= difficulty_max)
    result = await db.execute(query)
    return result.scalars().all()
