"""
Auth service — password hashing, JWT creation, refresh token management.

This is the security core. Every auth decision flows through here:
- Passwords are hashed with bcrypt (slow by design, auto-salted)
- Access tokens are short-lived JWTs (15 min, stateless verification)
- Refresh tokens are random hex strings, stored as SHA-256 hashes in DB
"""
import uuid
from datetime import datetime, timedelta
from hashlib import sha256

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import RefreshToken, User

# --- Password hashing ---
# CryptContext manages bcrypt with configurable rounds.
# "deprecated='auto'" means if we ever add a new scheme, old hashes
# are automatically re-hashed on next verify (transparent upgrade).
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.BCRYPT_ROUNDS,
)


def hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt. Returns a string like '$2b$12$...'"""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Check a plaintext password against a bcrypt hash. Constant-time comparison."""
    return pwd_context.verify(plain, hashed)


# --- JWT access tokens ---

def create_access_token(user_id: uuid.UUID, role: str) -> str:
    """Create a short-lived JWT containing the user's ID and role."""
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),   # "subject" — standard JWT claim for the user ID
        "role": role,
        "exp": expire,         # "expiration" — python-jose checks this automatically
        "type": "access",      # distinguishes from other token types
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT. Returns the payload dict or None if invalid/expired."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


# --- Refresh tokens ---

def _hash_refresh_token(raw_token: str) -> str:
    """SHA-256 hash of the raw refresh token for database storage.

    Why SHA-256 and not bcrypt? Refresh tokens are 64 random hex chars
    (256 bits of entropy). Brute-forcing them is impossible regardless
    of hash speed. bcrypt's slowness only matters for human passwords.
    """
    return sha256(raw_token.encode()).hexdigest()


async def create_refresh_token(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Create a refresh token, store its hash in DB, return the raw token."""
    raw = uuid.uuid4().hex + uuid.uuid4().hex  # 64 hex chars = 256 bits of randomness
    token_hash = _hash_refresh_token(raw)
    expires_at = datetime.utcnow() + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    row = RefreshToken(
        user_id=user_id, token_hash=token_hash, expires_at=expires_at
    )
    db.add(row)
    await db.commit()
    return raw


async def validate_refresh_token(db: AsyncSession, raw_token: str) -> User | None:
    """Validate a raw refresh token. Returns the User if valid, None otherwise."""
    token_hash = _hash_refresh_token(raw_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    row = result.scalar_one_or_none()
    if not row or row.expires_at < datetime.utcnow():
        return None
    user_result = await db.execute(select(User).where(User.id == row.user_id))
    return user_result.scalar_one_or_none()


async def revoke_refresh_token(db: AsyncSession, raw_token: str) -> None:
    """Delete a refresh token from DB (used during logout and rotation)."""
    token_hash = _hash_refresh_token(raw_token)
    await db.execute(
        delete(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    await db.commit()


async def revoke_all_user_tokens(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Delete ALL refresh tokens for a user (logout everywhere)."""
    await db.execute(
        delete(RefreshToken).where(RefreshToken.user_id == user_id)
    )
    await db.commit()


# --- Authentication ---

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Verify email + password. Returns the User if valid, None otherwise."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
