"""Student routes: CRUD + competency state queries + predictor."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.evidence import EvidenceEvent
from app.schemas.curriculum import QuestionOut
from app.schemas.curriculum_topic import RecommendedTopicOut
from app.schemas.student import CompetencyStateOut, StudentCreate, StudentOut, StudentStateOut
from app.services import diagnostic_service, predictor_service, student_service

router = APIRouter(prefix="/students", tags=["students"])


@router.post(
    "",
    response_model=StudentOut,
    status_code=201,
    summary="Register New Student",
    description="Create a new student profile. Returns the student record with a generated UUID.",
)
async def create_student(data: StudentCreate, db: AsyncSession = Depends(get_db)):
    student = await student_service.create_student(db, data)
    return student


@router.get(
    "",
    response_model=list[StudentOut],
    summary="List All Students",
    description="Retrieve all registered students, ordered by creation date.",
)
async def list_students(db: AsyncSession = Depends(get_db)):
    return await student_service.list_students(db)


@router.get(
    "/{student_id}",
    response_model=StudentOut,
    summary="Get Student Profile",
    description="Retrieve a single student's profile by their UUID.",
)
async def get_student(student_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    student = await student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get(
    "/{student_id}/state",
    response_model=StudentStateOut,
    summary="Get Full Mastery Profile",
    description="Retrieve the student's mastery state across all 59 competencies, including P(Learned), stage, and streak data.",
)
async def get_student_state(student_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from app.models.batch_enrollment import CohortEnrollment

    student = await student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Derive cohort_id from enrollment (single source of truth)
    enr_result = await db.execute(
        select(CohortEnrollment.cohort_id)
        .where(CohortEnrollment.student_id == student.id)
        .order_by(CohortEnrollment.enrolled_at.desc())
        .limit(1)
    )
    student.cohort_id = enr_result.scalar_one_or_none()

    states = await student_service.get_student_states(db, student_id)
    return StudentStateOut(student=StudentOut.model_validate(student), states=states)


@router.get(
    "/{student_id}/state/{competency_id}",
    response_model=CompetencyStateOut,
    summary="Get Single Competency Mastery",
    description="Retrieve the student's BKT state for a specific competency (P(Learned), stage, attempts).",
)
async def get_single_competency_state(
    student_id: uuid.UUID, competency_id: str, db: AsyncSession = Depends(get_db)
):
    state = await student_service.get_student_state(db, student_id, competency_id)
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    return state


class FrontierSkillOut(BaseModel):
    competency_id: str
    competency_name: str
    p_learned: float
    stage: int
    priority: float
    reasons: list[str]


@router.get(
    "/{student_id}/skill-frontier",
    response_model=list[FrontierSkillOut],
    summary="Get Learning Frontier",
    description="Find skills the student should work on next. Uses the prerequisite graph to identify skills where all prerequisites are met but the skill itself needs work. Prioritizes stuck, decaying, and close-to-next-stage skills.",
)
async def get_skill_frontier(
    student_id: uuid.UUID,
    limit: int = Query(10, le=30),
    db: AsyncSession = Depends(get_db),
):
    student = await student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await predictor_service.get_skill_frontier(db, student_id, limit)


class ActivityRecommendation(BaseModel):
    activity_id: str
    activity_name: str
    module_id: str
    score: float
    reasons: list[str]


@router.get(
    "/{student_id}/next-activity",
    response_model=list[ActivityRecommendation],
    summary="Recommend Next Activities",
    description="Get personalized activity recommendations. Uses the prerequisite graph to filter out activities the student isn't ready for.",
)
async def get_next_activity(
    student_id: uuid.UUID,
    module_id: str | None = Query(None),
    limit: int = Query(5, le=20),
    db: AsyncSession = Depends(get_db),
):
    student = await student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    results = await predictor_service.get_next_activity(db, student_id, module_id, limit)
    return results


@router.get(
    "/{student_id}/next-questions",
    response_model=list[QuestionOut],
    summary="Get Adaptive Practice Questions",
    description="Fetch questions matched to the student's current mastery level for a given competency. Uses ZPD targeting to select appropriately challenging questions.",
)
async def get_next_questions(
    student_id: uuid.UUID,
    competency_id: str = Query(...),
    count: int = Query(5, le=20),
    module_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    student = await student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    questions = await predictor_service.get_next_questions(db, student_id, competency_id, count, module_id)
    return questions


class NextQuestionOut(BaseModel):
    question: QuestionOut
    competency_id: str
    competency_name: str
    p_learned: float
    stage: int


@router.get(
    "/{student_id}/next-question",
    response_model=NextQuestionOut | None,
    summary="Get Next Adaptive Question",
    description="Backend picks the best competency and question for the student. "
    "Pass activity_id for live sessions or topic_id for self-serve practice.",
)
async def get_next_question(
    student_id: uuid.UUID,
    activity_id: str | None = Query(None),
    topic_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if not activity_id and not topic_id:
        raise HTTPException(status_code=400, detail="Provide activity_id or topic_id")
    student = await student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if activity_id:
        result = await predictor_service.get_next_question_for_activity(db, student_id, activity_id)
    else:
        result = await predictor_service.get_next_question_for_topic(db, student_id, topic_id)
    if not result:
        return None
    return NextQuestionOut(
        question=QuestionOut.model_validate(result.question),
        competency_id=result.competency_id,
        competency_name=result.competency_name,
        p_learned=result.p_learned,
        stage=result.stage,
    )


class NextActivityQuestionOut(BaseModel):
    activity_question_id: uuid.UUID
    template_slug: str
    title: str
    data: dict
    competency_id: str
    competency_name: str
    difficulty: float
    p_learned: float
    stage: int


@router.get(
    "/{student_id}/next-activity-question",
    response_model=NextActivityQuestionOut | None,
    summary="Get Next Rich Activity Question",
    description="ZPD-based selection from activity_questions table for a given activity.",
)
async def get_next_activity_question(
    student_id: uuid.UUID,
    activity_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    student = await student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    result = await predictor_service.get_next_activity_question(db, student_id, activity_id)
    if not result:
        return None
    return NextActivityQuestionOut(
        activity_question_id=result.activity_question_id,
        template_slug=result.template_slug,
        title=result.title,
        data=result.data,
        competency_id=result.competency_id,
        competency_name=result.competency_name,
        difficulty=result.difficulty,
        p_learned=result.p_learned,
        stage=result.stage,
    )


@router.post(
    "/{student_id}/advance-activity-question",
    status_code=204,
    summary="Advance to Next Question",
    description="Increment the student's progress index for the activity. Call this when 'Next Question' is clicked.",
)
async def advance_activity_question(
    student_id: uuid.UUID,
    activity_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    student = await student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    await predictor_service.advance_activity_question(db, student_id, activity_id)


@router.get(
    "/{student_id}/recommended-topics",
    response_model=list[RecommendedTopicOut],
    summary="BKT-Driven Topic Recommendations",
    description="Get personalized curriculum topic recommendations based on the student's mastery weaknesses. "
    "Uses BKT state + topic-competency mappings to rank topics by how much they'd help.",
)
async def get_recommended_topics(
    student_id: uuid.UUID,
    board: str = Query(..., description="Curriculum board: cbse, ib, icse"),
    grade: int = Query(..., ge=4, le=9, description="Grade level"),
    subject: str | None = Query(None, description="Filter by subject: mathematics, science"),
    limit: int = Query(5, le=20),
    db: AsyncSession = Depends(get_db),
):
    student = await student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await predictor_service.get_recommended_topics(
        db, student_id, board, grade, subject, limit
    )


class DiagnosticProfile(BaseModel):
    pillar_stages: dict[str, int] = {}
    overrides: dict[str, int] = {}


class DiagnosticResultItem(BaseModel):
    competency_id: str
    stage: int
    p_learned: float


@router.post(
    "/{student_id}/diagnostic",
    response_model=list[DiagnosticResultItem],
    summary="Submit Diagnostic Assessment",
    description="Initialize a student's mastery profile from a diagnostic assessment. Sets BKT priors for all competencies based on pillar-level stage estimates and optional per-competency overrides.",
)
async def submit_diagnostic(
    student_id: uuid.UUID, profile: DiagnosticProfile, db: AsyncSession = Depends(get_db)
):
    student = await student_service.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    updates = await diagnostic_service.apply_diagnostic(db, student_id, profile.model_dump())
    return updates


class SessionScoreOut(BaseModel):
    total: int
    correct: int


@router.get(
    "/{student_id}/session-score",
    response_model=SessionScoreOut,
    summary="Get Student's Score in Session",
    description="Count total and correct answers for this student in the given session.",
)
async def get_student_session_score(
    student_id: uuid.UUID,
    session_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import text
    # Total = questions answered (from progress index)
    # Correct = last attempt per question with outcome >= 0.5
    result = await db.execute(
        text("""
            SELECT
                (SELECT COALESCE(SUM(p.current_index), 0)
                 FROM student_activity_progress p
                 JOIN session_activities sa ON sa.activity_id = p.activity_id AND sa.session_id = :sess
                 WHERE p.student_id = :sid
                ) AS total,
                (SELECT COUNT(*) FROM (
                    SELECT DISTINCT ON (meta->>'activityQuestionId') outcome
                    FROM evidence_events
                    WHERE student_id = :sid AND session_id = :sess
                      AND meta->>'activityQuestionId' IS NOT NULL
                    ORDER BY meta->>'activityQuestionId', created_at DESC
                ) la WHERE la.outcome >= 0.5
                ) AS correct
        """),
        {"sid": str(student_id), "sess": str(session_id)},
    )
    row = result.one()
    total = int(row.total)
    correct = min(int(row.correct or 0), total)
    return SessionScoreOut(total=total, correct=correct)
