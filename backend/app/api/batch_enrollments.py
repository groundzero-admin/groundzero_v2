"""Batch enrollment — link/unlink students to live batches."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.batch_enrollment import BatchStudentEnrollment
from app.models.live_batch import LiveBatch
from app.models.student import Student
from app.models.user import User

router = APIRouter(prefix="/live-batches", tags=["batch-enrollments"])


# ── Schemas ──

class EnrolledStudentOut(BaseModel):
    enrollment_id: str
    student_id: str
    user_id: str
    full_name: str
    email: str
    plain_password: str | None = None
    board: str | None = None
    grade: int | None = None
    enrolled_at: str


class SearchStudentOut(BaseModel):
    student_id: str
    user_id: str
    full_name: str
    email: str
    already_enrolled: bool


class EnrollRequest(BaseModel):
    student_id: str


# ── Endpoints ──

@router.get(
    "/{batch_id}/students",
    response_model=list[EnrolledStudentOut],
    summary="List enrolled students for a batch",
)
async def list_enrolled_students(
    batch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    rows = (
        await db.execute(
            select(BatchStudentEnrollment, Student, User)
            .join(Student, Student.id == BatchStudentEnrollment.student_id)
            .join(User, User.id == Student.user_id)
            .where(BatchStudentEnrollment.batch_id == batch_id)
            .order_by(User.full_name)
        )
    ).all()

    return [
        EnrolledStudentOut(
            enrollment_id=str(enr.id),
            student_id=str(student.id),
            user_id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            plain_password=user.plain_password,
            board=student.board,
            grade=student.grade,
            enrolled_at=enr.enrolled_at.isoformat(),
        )
        for enr, student, user in rows
    ]


class PaginatedSearchResult(BaseModel):
    students: list[SearchStudentOut]
    total: int
    page: int
    page_size: int
    total_pages: int


@router.get(
    "/{batch_id}/students/search",
    response_model=PaginatedSearchResult,
    summary="Search students to enroll (paginated, shows enrollment status)",
)
async def search_students_for_batch(
    batch_id: uuid.UUID,
    q: str = Query("", description="Search by name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    from math import ceil

    # Build base query
    base = (
        select(Student, User)
        .join(User, User.id == Student.user_id)
        .where(User.role == "student")
    )
    if q:
        base = base.where(
            (User.full_name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%"))
        )

    # Count total
    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Paginate
    offset = (page - 1) * page_size
    rows = (await db.execute(base.order_by(User.full_name).offset(offset).limit(page_size))).all()

    # Get enrolled student IDs for this batch
    enrolled_ids = set(
        r[0]
        for r in (
            await db.execute(
                select(BatchStudentEnrollment.student_id).where(
                    BatchStudentEnrollment.batch_id == batch_id
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
    "/{batch_id}/students",
    response_model=EnrolledStudentOut,
    status_code=201,
    summary="Enroll a student in a batch",
)
async def enroll_student(
    batch_id: uuid.UUID,
    data: EnrollRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    # Verify batch exists
    batch = await db.get(LiveBatch, batch_id)
    if not batch:
        raise HTTPException(404, "Batch not found")

    # Verify student exists
    student = await db.get(Student, uuid.UUID(data.student_id))
    if not student:
        raise HTTPException(404, "Student not found")

    # Check if already enrolled
    existing = await db.execute(
        select(BatchStudentEnrollment).where(
            BatchStudentEnrollment.student_id == student.id,
            BatchStudentEnrollment.batch_id == batch_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Student already enrolled in this batch")

    enrollment = BatchStudentEnrollment(
        student_id=student.id,
        batch_id=batch_id,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    # Fetch user for response
    user = await db.get(User, student.user_id)

    return EnrolledStudentOut(
        enrollment_id=str(enrollment.id),
        student_id=str(student.id),
        user_id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        plain_password=user.plain_password,
        board=student.board,
        grade=student.grade,
        enrolled_at=enrollment.enrolled_at.isoformat(),
    )


@router.delete(
    "/{batch_id}/students/{student_id}",
    status_code=204,
    summary="Unenroll a student from a batch",
)
async def unenroll_student(
    batch_id: uuid.UUID,
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(
        delete(BatchStudentEnrollment).where(
            BatchStudentEnrollment.student_id == student_id,
            BatchStudentEnrollment.batch_id == batch_id,
        )
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Enrollment not found")
    await db.commit()
