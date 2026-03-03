"""
Auth request/response schemas.

Pydantic validates all incoming data BEFORE it reaches your route handler.
If someone sends an invalid email or a 3-char password, FastAPI returns
a 422 error automatically — your code never runs.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr  # Pydantic validates email format (has @, valid domain structure)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    role: str = Field(pattern=r"^(student|teacher)$")  # admins created manually, not via register

    # Student-specific fields (required when role="student", ignored for teachers)
    board: str | None = Field(default=None, pattern=r"^(cbse|icse|ib)$")
    grade: int | None = Field(default=None, ge=4, le=9)
    grade_band: str | None = Field(default=None, pattern=r"^(4-5|6-7|8-9)$")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    full_name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}  # allows creating from SQLAlchemy model


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
