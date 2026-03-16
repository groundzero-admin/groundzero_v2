"""Activity + question routes."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.competency import Competency
from app.models.curriculum import Activity, Question
from app.models.user import User
from app.schemas.curriculum import ActivityCreate, ActivityOut, ActivityUpdate, QuestionCreate, QuestionOut, QuestionUpdate

activities_router = APIRouter(prefix="/activities", tags=["activities"])
questions_router = APIRouter(prefix="/questions", tags=["questions"])


# ── Activities ──


@activities_router.get(
    "",
    response_model=list[ActivityOut],
    summary="Browse All Activities",
    description="List all learning activities, optionally filtered by module, week, or type (warmup, key_topic, diy, ai_lab, artifact).",
)
async def list_activities(
    module_id: str | None = Query(None),
    week: int | None = Query(None),
    session_number: int | None = Query(None),
    type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Activity).order_by(Activity.created_at.desc())
    if module_id:
        query = query.where(Activity.module_id == module_id)
    if week:
        query = query.where(Activity.week == week)
    if session_number is not None:
        query = query.where(Activity.session_number == session_number)
    if type:
        query = query.where(Activity.type == type)
    result = await db.execute(query)
    return result.scalars().all()


@activities_router.get(
    "/{activity_id}",
    response_model=ActivityOut,
    summary="Get Activity Details",
    description="Retrieve a single activity with its full details including primary competencies, duration, module, and description.",
)
async def get_activity(activity_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@activities_router.post(
    "",
    response_model=ActivityOut,
    status_code=201,
    summary="Create Activity",
    description="Add a new learning activity. Activities are assigned to sessions and link to competencies via primary_competencies.",
)
async def create_activity(
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    existing = await db.execute(select(Activity).where(Activity.id == data.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Activity '{data.id}' already exists")
    activity = Activity(
        id=data.id,
        module_id=data.module_id,
        name=data.name,
        type=data.type,
        mode=data.mode or "default",
        week=data.week,
        session_number=data.session_number,
        duration_minutes=data.duration_minutes,
        grade_bands=data.grade_bands,
        description=data.description,
        learning_outcomes=data.learning_outcomes,
        primary_competencies=data.primary_competencies,
        secondary_competencies=data.secondary_competencies,
        prerequisites=data.prerequisites,
        question_ids=data.question_ids or [],
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


@activities_router.post(
    "/{activity_id}/questions/{question_id}",
    response_model=ActivityOut,
    summary="Link Question to Activity",
    description="Add a question to this activity's question list.",
)
async def link_question(
    activity_id: str,
    question_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    # Verify question exists
    import uuid as _uuid
    q_result = await db.execute(select(Question).where(Question.id == _uuid.UUID(question_id)))
    if not q_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Question not found")
    current = list(activity.question_ids or [])
    if question_id not in current:
        current.append(question_id)
        activity.question_ids = current
    await db.commit()
    await db.refresh(activity)
    return activity


@activities_router.delete(
    "/{activity_id}/questions/{question_id}",
    response_model=ActivityOut,
    summary="Unlink Question from Activity",
    description="Remove a question from this activity's question list (does not delete the question).",
)
async def unlink_question(
    activity_id: str,
    question_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    current = list(activity.question_ids or [])
    if question_id in current:
        current.remove(question_id)
        activity.question_ids = current
    await db.commit()
    await db.refresh(activity)
    return activity


@activities_router.put(
    "/{activity_id}",
    response_model=ActivityOut,
    summary="Update Activity",
    description="Update an existing activity's details.",
)
async def update_activity(
    activity_id: str,
    data: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(activity, field, value)
    await db.commit()
    await db.refresh(activity)
    return activity


@activities_router.delete(
    "/{activity_id}",
    status_code=204,
    summary="Delete Activity",
    description="Delete an activity from the system.",
)
async def delete_activity(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    await db.delete(activity)
    await db.commit()


# ── Questions ──


@questions_router.get(
    "",
    response_model=list[QuestionOut],
    summary="Browse Question Bank",
    description="List questions from the question bank, filterable by competency, module, difficulty range, and grade band. Returns up to 200 questions.",
)
async def list_questions(
    competency_id: str | None = Query(None),
    module_id: str | None = Query(None),
    topic_id: str | None = Query(None, description="Filter by curriculum topic"),
    difficulty_min: float | None = Query(None, ge=0.0, le=1.0),
    difficulty_max: float | None = Query(None, ge=0.0, le=1.0),
    grade_band: str | None = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    query = select(Question).order_by(Question.competency_id, Question.difficulty).limit(limit)
    if competency_id:
        query = query.where(Question.competency_id == competency_id)
    if module_id:
        query = query.where(Question.module_id == module_id)
    if topic_id:
        query = query.where(Question.topic_id == topic_id)
    if difficulty_min is not None:
        query = query.where(Question.difficulty >= difficulty_min)
    if difficulty_max is not None:
        query = query.where(Question.difficulty <= difficulty_max)
    if grade_band:
        query = query.where(Question.grade_band == grade_band)
    result = await db.execute(query)
    return result.scalars().all()


@questions_router.post(
    "",
    response_model=QuestionOut,
    status_code=201,
    summary="Add Question to Bank",
    description="Add a new question to the question bank for a specific competency.",
)
async def create_question(
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    # Verify competency exists
    comp = await db.execute(select(Competency).where(Competency.id == data.competency_id))
    if not comp.scalar_one_or_none():
        raise HTTPException(status_code=404, detail=f"Competency '{data.competency_id}' not found")
    # Verify topic exists (if provided)
    if data.topic_id:
        from app.models.curriculum_topic import CurriculumTopic

        topic = await db.execute(select(CurriculumTopic).where(CurriculumTopic.id == data.topic_id))
        if not topic.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Topic '{data.topic_id}' not found")
    question = Question(
        module_id=data.module_id,
        competency_id=data.competency_id,
        text=data.text,
        type=data.type,
        options=data.options,
        correct_answer=data.correct_answer,
        difficulty=data.difficulty,
        grade_band=data.grade_band,
        topic_id=data.topic_id,
        explanation=data.explanation,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


@questions_router.put(
    "/{question_id}",
    response_model=QuestionOut,
    summary="Update Question",
    description="Update an existing question in the question bank.",
)
async def update_question(
    question_id: str,
    data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    import uuid as _uuid
    result = await db.execute(select(Question).where(Question.id == _uuid.UUID(question_id)))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    await db.commit()
    await db.refresh(question)
    return question


@questions_router.delete(
    "/{question_id}",
    status_code=204,
    summary="Delete Question",
    description="Delete a question from the question bank.",
)
async def delete_question(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    import uuid as _uuid
    result = await db.execute(select(Question).where(Question.id == _uuid.UUID(question_id)))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(question)
    await db.commit()

