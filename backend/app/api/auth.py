"""
Auth API routes: register, login, refresh, logout, me.

The flow:
1. Register/Login → returns access token (in JSON) + refresh token (in httpOnly cookie)
2. Every API call → sends access token in Authorization header
3. Access token expires (15 min) → client calls /refresh → cookie sent automatically
4. Logout → revokes refresh token, clears cookie
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_role
from app.database import get_db
from app.models.student import Student
from app.models.user import User
from pydantic import BaseModel, Field
from app.schemas.auth import TokenResponse, UserLogin, UserOut, UserRegister
from app.schemas.student import StudentOut
from app.services import auth_service
from app.services.invite_service import validate_invite, redeem_invite

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Set the refresh token as an httpOnly cookie.

    - httponly: JavaScript cannot read it (XSS protection)
    - secure: False for local dev (no HTTPS), True in production
    - samesite: "lax" prevents CSRF from other domains
    - path: only sent to /api/v1/auth endpoints (not on every request)
    - max_age: 7 days in seconds
    """
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=False,  # set True in production (requires HTTPS)
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/api/v1/auth",
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=201,
    summary="Register New User",
)
async def register(
    data: UserRegister,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=auth_service.hash_password(data.password),
        role=data.role,
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()  # flush to get user.id before creating Student

    # If registering as student, create a linked Student record
    if data.role == "student":
        if not data.board or not data.grade or not data.grade_band:
            raise HTTPException(
                status_code=422,
                detail="Students must provide board, grade, and grade_band",
            )
        student = Student(
            name=data.full_name,
            board=data.board,
            grade=data.grade,
            grade_band=data.grade_band,
            user_id=user.id,
        )
        db.add(student)

    await db.commit()
    await db.refresh(user)

    access_token = auth_service.create_access_token(user.id, user.role)
    refresh_token = await auth_service.create_refresh_token(db, user.id)
    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse, summary="Login")
async def login(
    data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user = await auth_service.authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = auth_service.create_access_token(user.id, user.role)
    refresh_token = await auth_service.create_refresh_token(db, user.id)
    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse, summary="Refresh Access Token")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Use the httpOnly refresh cookie to get a new access token.

    This endpoint performs TOKEN ROTATION:
    1. Validates the old refresh token
    2. Revokes it (deletes from DB)
    3. Issues a brand new refresh token
    This way, if an attacker steals and uses the old token after
    the real user already refreshed, it's already revoked.
    """
    raw_token = request.cookies.get("refresh_token")
    if not raw_token:
        raise HTTPException(status_code=401, detail="No refresh token")

    user = await auth_service.validate_refresh_token(db, raw_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # Rotate: revoke old, issue new
    await auth_service.revoke_refresh_token(db, raw_token)
    new_access = auth_service.create_access_token(user.id, user.role)
    new_refresh = await auth_service.create_refresh_token(db, user.id)
    _set_refresh_cookie(response, new_refresh)

    return TokenResponse(
        access_token=new_access,
        user=UserOut.model_validate(user),
    )


@router.post("/logout", summary="Logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    raw_token = request.cookies.get("refresh_token")
    if raw_token:
        await auth_service.revoke_refresh_token(db, raw_token)
    response.delete_cookie("refresh_token", path="/api/v1/auth")
    return {"detail": "Logged out"}


class AcceptInviteRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


class InviteInfoOut(BaseModel):
    email: str
    full_name: str


@router.get("/invite/{token}", response_model=InviteInfoOut, summary="Get invite info")
async def get_invite_info(token: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns basic info for a valid invite token."""
    invite = await validate_invite(db, token)
    if not invite:
        raise HTTPException(status_code=410, detail="Invite link is invalid or expired")
    user = await db.get(User, invite.user_id)
    if not user:
        raise HTTPException(status_code=410, detail="Invite link is invalid")
    return InviteInfoOut(email=user.email, full_name=user.full_name)


@router.post("/invite/accept", response_model=TokenResponse, summary="Accept invite & set password")
async def accept_invite(
    data: AcceptInviteRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — student sets password via invite token, gets logged in."""
    user = await redeem_invite(db, data.token, data.password)
    if not user:
        raise HTTPException(status_code=410, detail="Invite link is invalid or expired")

    await db.commit()
    access_token = auth_service.create_access_token(user.id, user.role)
    refresh_token = await auth_service.create_refresh_token(db, user.id)
    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut, summary="Get Current User")
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.get("/me/student", response_model=StudentOut, summary="Get Linked Student Record")
async def get_my_student(
    user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    """For student users — returns their linked Student record with ID, grade, etc."""
    from app.models.batch_enrollment import CohortEnrollment

    result = await db.execute(select(Student).where(Student.user_id == user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="No student record linked to this user")

    # Derive cohort_id from enrollment (single source of truth)
    enr_result = await db.execute(
        select(CohortEnrollment.cohort_id)
        .where(CohortEnrollment.student_id == student.id)
        .order_by(CohortEnrollment.enrolled_at.desc())
        .limit(1)
    )
    student.cohort_id = enr_result.scalar_one_or_none()

    return student
