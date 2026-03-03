"""Student CRUD + initialization of 56 competency states."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competency import Competency
from app.models.student import Student, StudentCompetencyState
from app.schemas.student import StudentCreate


async def create_student(db: AsyncSession, data: StudentCreate) -> Student:
    """Create a student and initialize 56 competency state rows."""
    student = Student(
        name=data.name,
        grade=data.grade,
        grade_band=data.grade_band,
        cohort_id=data.cohort_id,
    )
    db.add(student)
    await db.flush()  # get the generated id

    # Fetch all competencies with their default BKT params
    result = await db.execute(select(Competency))
    competencies = result.scalars().all()

    for comp in competencies:
        params = comp.default_params or {}
        state = StudentCompetencyState(
            student_id=student.id,
            competency_id=comp.id,
            p_learned=params.get("p_l0", 0.10),
            p_transit=params.get("p_transit", 0.15),
            p_guess=params.get("p_guess", 0.25),
            p_slip=params.get("p_slip", 0.10),
        )
        db.add(state)

    await db.commit()
    await db.refresh(student)
    return student


async def get_student(db: AsyncSession, student_id: uuid.UUID) -> Student | None:
    result = await db.execute(select(Student).where(Student.id == student_id))
    return result.scalar_one_or_none()


async def get_student_states(
    db: AsyncSession, student_id: uuid.UUID
) -> list[StudentCompetencyState]:
    result = await db.execute(
        select(StudentCompetencyState)
        .where(StudentCompetencyState.student_id == student_id)
        .order_by(StudentCompetencyState.competency_id)
    )
    return list(result.scalars().all())


async def get_student_state(
    db: AsyncSession, student_id: uuid.UUID, competency_id: str
) -> StudentCompetencyState | None:
    result = await db.execute(
        select(StudentCompetencyState).where(
            StudentCompetencyState.student_id == student_id,
            StudentCompetencyState.competency_id == competency_id,
        )
    )
    return result.scalar_one_or_none()


async def list_students(db: AsyncSession) -> list[Student]:
    result = await db.execute(select(Student).order_by(Student.created_at.desc()))
    return list(result.scalars().all())
