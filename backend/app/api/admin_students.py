"""Admin student management — list, create, invite, view students with pagination."""
import uuid
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.student import Student
from app.models.user import User
from app.services.invite_service import (
    build_invite_link,
    create_invite,
    get_invite_status,
)

router = APIRouter(prefix="/admin/students", tags=["admin-students"])


# ── Schemas ──

class AdminStudentCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=200)
    board: str = Field(pattern=r"^(cbse|icse|ib)$")
    grade: int = Field(ge=4, le=9)
    grade_band: str = Field(pattern=r"^(4-5|6-7|8-9)$")


class AdminStudentOut(BaseModel):
    id: str  # user id
    student_id: str | None = None
    email: str
    full_name: str
    board: str | None = None
    grade: int | None = None
    grade_band: str | None = None
    is_active: bool
    invite_status: str  # "pending", "accepted", "expired", "none"
    invite_link: str | None = None
    created_at: str

    model_config = {"from_attributes": True}


class PaginatedStudents(BaseModel):
    students: list[AdminStudentOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class RegenerateInviteOut(BaseModel):
    invite_link: str
    invite_status: str


# ── Endpoints ──


@router.get("", response_model=PaginatedStudents, summary="List all students (paginated)")
async def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", description="Search by name or email"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    base_query = (
        select(User, Student)
        .outerjoin(Student, Student.user_id == User.id)
        .where(User.role == "student")
    )

    if search:
        base_query = base_query.where(
            (User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )

    count_q = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            base_query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
        )
    ).all()

    students = []
    for user, student in rows:
        status = await get_invite_status(db, user.id)
        students.append(
            AdminStudentOut(
                id=str(user.id),
                student_id=str(student.id) if student else None,
                email=user.email,
                full_name=user.full_name,
                board=student.board if student else None,
                grade=student.grade if student else None,
                grade_band=student.grade_band if student else None,
                is_active=user.is_active,
                invite_status=status,
                created_at=user.created_at.isoformat(),
            )
        )

    return PaginatedStudents(
        students=students,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("", response_model=AdminStudentOut, status_code=201, summary="Create student (admin)")
async def create_student(
    data: AdminStudentCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create user without password — invite link will let them set it
    user = User(
        email=data.email,
        hashed_password=None,
        role="student",
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()

    student = Student(
        user_id=user.id,
        name=data.full_name,
        board=data.board,
        grade=data.grade,
        grade_band=data.grade_band,
    )
    db.add(student)

    # Generate invite token
    raw_token = await create_invite(db, user.id)
    await db.commit()
    await db.refresh(user)
    await db.refresh(student)

    return AdminStudentOut(
        id=str(user.id),
        student_id=str(student.id),
        email=user.email,
        full_name=user.full_name,
        board=student.board,
        grade=student.grade,
        grade_band=student.grade_band,
        is_active=user.is_active,
        invite_status="pending",
        invite_link=build_invite_link(raw_token),
        created_at=user.created_at.isoformat(),
    )


@router.post(
    "/{user_id}/regenerate-invite",
    response_model=RegenerateInviteOut,
    summary="Regenerate invite link for a student",
)
async def regenerate_invite(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    user = await db.get(User, user_id)
    if not user or user.role != "student":
        raise HTTPException(404, "Student not found")

    if user.hashed_password:
        raise HTTPException(400, "Student has already set their password")

    raw_token = await create_invite(db, user.id)
    await db.commit()

    return RegenerateInviteOut(
        invite_link=build_invite_link(raw_token),
        invite_status="pending",
    )
