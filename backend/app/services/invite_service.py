"""Invite service — create, validate, and redeem student invite tokens."""
import uuid
from datetime import datetime, timedelta
from hashlib import sha256

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.student_invite import StudentInvite
from app.models.user import User
from app.services.auth_service import hash_password

INVITE_EXPIRY_DAYS = 7


def _hash_token(raw: str) -> str:
    return sha256(raw.encode()).hexdigest()


async def create_invite(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Generate invite token for a user. Deletes any previous unused invites."""
    # Remove old unused invites for this user
    await db.execute(
        delete(StudentInvite).where(
            StudentInvite.user_id == user_id,
            StudentInvite.used_at.is_(None),
        )
    )

    raw = uuid.uuid4().hex + uuid.uuid4().hex  # 64 hex chars
    invite = StudentInvite(
        user_id=user_id,
        token_hash=_hash_token(raw),
        expires_at=datetime.utcnow() + timedelta(days=INVITE_EXPIRY_DAYS),
    )
    db.add(invite)
    await db.flush()
    return raw


def build_invite_link(raw_token: str) -> str:
    return f"{settings.FRONTEND_URL}/invite/{raw_token}"


async def validate_invite(db: AsyncSession, raw_token: str) -> StudentInvite | None:
    """Return the invite if valid (not used, not expired), else None."""
    token_hash = _hash_token(raw_token)
    result = await db.execute(
        select(StudentInvite).where(StudentInvite.token_hash == token_hash)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        return None
    if invite.used_at is not None:
        return None
    if invite.expires_at < datetime.utcnow():
        return None
    return invite


async def redeem_invite(
    db: AsyncSession, raw_token: str, new_password: str
) -> User | None:
    """Validate invite, set user password, mark invite as used. Returns user or None."""
    invite = await validate_invite(db, raw_token)
    if not invite:
        return None

    user = await db.get(User, invite.user_id)
    if not user:
        return None

    user.hashed_password = hash_password(new_password)
    invite.used_at = datetime.utcnow()
    await db.flush()
    return user


async def get_invite_status(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Return invite status: 'accepted', 'pending', 'expired', or 'none'."""
    # If user already has a password, they've accepted
    user = await db.get(User, user_id)
    if user and user.hashed_password:
        return "accepted"

    # Check latest invite
    result = await db.execute(
        select(StudentInvite)
        .where(StudentInvite.user_id == user_id)
        .order_by(StudentInvite.created_at.desc())
        .limit(1)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        return "none"
    if invite.used_at is not None:
        return "accepted"
    if invite.expires_at < datetime.utcnow():
        return "expired"
    return "pending"
