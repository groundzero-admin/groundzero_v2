"""Cohort enrollment — link/unlink students to cohorts."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.batch_enrollment import CohortEnrollment
from app.models.session import Cohort
from app.models.student import Student
from app.models.user import User
from app.services.invite_service import get_invite_status

router = APIRouter(prefix="/cohorts", tags=["cohort-enrollments"])


# ── Schemas ──

class EnrolledStudentOut(BaseModel):
    enrollment_id: str
    student_id: str
    user_id: str
    full_name: str
    email: str
    board: str | None = None
    grade: int | None = None
    invite_status: str = "accepted"
    enrolled_at: str


class SearchStudentOut(BaseModel):
    student_id: str
    user_id: str
    full_name: str
    email: str
    already_enrolled: bool


class EnrollRequest(BaseModel):
    student_id: str


class PaginatedSearchResult(BaseModel):
    students: list[SearchStudentOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Endpoints ──

@router.get(
    "/{cohort_id}/students",
    response_model=list[EnrolledStudentOut],
    summary="List enrolled students for a cohort",
)
async def list_enrolled_students(
    cohort_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    rows = (
        await db.execute(
            select(CohortEnrollment, Student, User)
            .join(Student, Student.id == CohortEnrollment.student_id)
            .join(User, User.id == Student.user_id)
            .where(CohortEnrollment.cohort_id == cohort_id)
            .order_by(User.full_name)
        )
    ).all()

    result = []
    for enr, student, user in rows:
        status = await get_invite_status(db, user.id)
        result.append(
            EnrolledStudentOut(
                enrollment_id=str(enr.id),
                student_id=str(student.id),
                user_id=str(user.id),
                full_name=user.full_name,
                email=user.email,
                board=student.board,
                grade=student.grade,
                invite_status=status,
                enrolled_at=enr.enrolled_at.isoformat(),
            )
        )
    return result


@router.get(
    "/{cohort_id}/students/search",
    response_model=PaginatedSearchResult,
    summary="Search students to enroll (paginated, shows enrollment status)",
)
async def search_students_for_cohort(
    cohort_id: uuid.UUID,
    q: str = Query("", description="Search by name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    from math import ceil

    base = (
        select(Student, User)
        .join(User, User.id == Student.user_id)
        .where(User.role == "student")
    )
    if q:
        base = base.where(
            (User.full_name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%"))
        )

    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar_one()

    offset = (page - 1) * page_size
    rows = (await db.execute(base.order_by(User.full_name).offset(offset).limit(page_size))).all()

    enrolled_ids = set(
        r[0]
        for r in (
            await db.execute(
                select(CohortEnrollment.student_id).where(
                    CohortEnrollment.cohort_id == cohort_id
                )
            )
        ).all()
    )

    students = [
        SearchStudentOut(
            student_id=str(student.id),
            user_id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            already_enrolled=student.id in enrolled_ids,
        )
        for student, user in rows
    ]

    return PaginatedSearchResult(
        students=students,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post(
    "/{cohort_id}/students",
    response_model=EnrolledStudentOut,
    status_code=201,
    summary="Enroll a student in a cohort",
)
async def enroll_student(
    cohort_id: uuid.UUID,
    data: EnrollRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    cohort = await db.get(Cohort, cohort_id)
    if not cohort:
        raise HTTPException(404, "Cohort not found")

    student = await db.get(Student, uuid.UUID(data.student_id))
    if not student:
        raise HTTPException(404, "Student not found")

    existing = await db.execute(
        select(CohortEnrollment).where(
            CohortEnrollment.student_id == student.id,
            CohortEnrollment.cohort_id == cohort_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Student already enrolled in this cohort")

    enrollment = CohortEnrollment(
        student_id=student.id,
        cohort_id=cohort_id,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    user = await db.get(User, student.user_id)
    status = await get_invite_status(db, user.id)

    return EnrolledStudentOut(
        enrollment_id=str(enrollment.id),
        student_id=str(student.id),
        user_id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        board=student.board,
        grade=student.grade,
        invite_status=status,
        enrolled_at=enrollment.enrolled_at.isoformat(),
    )


@router.delete(
    "/{cohort_id}/students/{student_id}",
    status_code=204,
    summary="Unenroll a student from a cohort",
)
async def unenroll_student(
    cohort_id: uuid.UUID,
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(
        delete(CohortEnrollment).where(
            CohortEnrollment.student_id == student_id,
            CohortEnrollment.cohort_id == cohort_id,
        )
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Enrollment not found")
    await db.commit()
