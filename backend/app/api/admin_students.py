"""Admin student management — list, create, view students with pagination."""
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
from app.services.auth_service import hash_password

router = APIRouter(prefix="/admin/students", tags=["admin-students"])


# ── Schemas ──

class AdminStudentCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    board: str = Field(pattern=r"^(cbse|icse|ib)$")
    grade: int = Field(ge=4, le=9)
    grade_band: str = Field(pattern=r"^(4-5|6-7|8-9)$")


class AdminStudentOut(BaseModel):
    id: str  # user id
    student_id: str | None = None  # student table id
    email: str
    full_name: str
    plain_password: str | None = None
    board: str | None = None
    grade: int | None = None
    grade_band: str | None = None
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class PaginatedStudents(BaseModel):
    students: list[AdminStudentOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Endpoints ──


@router.get("", response_model=PaginatedStudents, summary="List all students (paginated)")
async def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", description="Search by name or email"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    # Build base query — join User + Student
    base_query = (
        select(User, Student)
        .outerjoin(Student, Student.user_id == User.id)
        .where(User.role == "student")
    )

    if search:
        base_query = base_query.where(
            (User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )

    # Count
    count_q = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Paginate
    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            base_query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
        )
    ).all()

    students = []
    for user, student in rows:
        students.append(
            AdminStudentOut(
                id=str(user.id),
                student_id=str(student.id) if student else None,
                email=user.email,
                full_name=user.full_name,
                plain_password=user.plain_password,
                board=student.board if student else None,
                grade=student.grade if student else None,
                grade_band=student.grade_band if student else None,
                is_active=user.is_active,
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
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create user with both hashed and plain password
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        plain_password=data.password,
        role="student",
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()  # get user.id

    # Create student record linked to user
    student = Student(
        user_id=user.id,
        name=data.full_name,
        board=data.board,
        grade=data.grade,
        grade_band=data.grade_band,
    )
    db.add(student)
    await db.commit()
    await db.refresh(user)
    await db.refresh(student)

    return AdminStudentOut(
        id=str(user.id),
        student_id=str(student.id),
        email=user.email,
        full_name=user.full_name,
        plain_password=user.plain_password,
        board=student.board,
        grade=student.grade,
        grade_band=student.grade_band,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
    )
