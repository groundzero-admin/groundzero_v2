"""Live class API — create rooms, start/end class for live batch sessions."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_role
from app.database import get_db
from app.models.live_batch import LiveBatch, LiveBatchSession
from app.models.user import User
from app.services import hms_service

router = APIRouter(prefix="/live-batches", tags=["live-class"])


class ClassInfoOut(BaseModel):
    session_id: str
    hms_room_id: str | None
    is_live: bool
    room_code: str | None  # host code for admin, guest code for student


class RoomCreatedOut(BaseModel):
    session_id: str
    hms_room_id: str
    hms_room_code_host: str
    hms_room_code_guest: str


# ── Helpers ──

async def _get_session(
    batch_id: uuid.UUID, session_id: uuid.UUID, db: AsyncSession
) -> LiveBatchSession:
    result = await db.execute(
        select(LiveBatchSession).where(
            LiveBatchSession.id == session_id,
            LiveBatchSession.batch_id == batch_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# ── Create Room ──

@router.post(
    "/{batch_id}/sessions/{session_id}/create-room",
    response_model=RoomCreatedOut,
    summary="Create 100ms room for a session",
)
async def create_room_for_session(
    batch_id: uuid.UUID,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    session = await _get_session(batch_id, session_id, db)

    if session.hms_room_id:
        raise HTTPException(status_code=400, detail="Room already exists for this session")

    # Create room in 100ms
    room_name = f"session-{session.id}"
    room = await hms_service.create_room(room_name)
    room_id = room["id"]

    # Create room codes
    codes = await hms_service.create_room_codes(room_id)
    host_code = ""
    guest_code = ""
    for c in codes:
        role = c.get("role", "")
        if role == "host":
            host_code = c["code"]
        elif role == "guest":
            guest_code = c["code"]

    # If no exact "host"/"guest" roles, use first two codes
    if not host_code and codes:
        host_code = codes[0]["code"]
    if not guest_code and len(codes) > 1:
        guest_code = codes[1]["code"]

    # Save to DB
    session.hms_room_id = room_id
    session.hms_room_code_host = host_code
    session.hms_room_code_guest = guest_code
    await db.commit()
    await db.refresh(session)

    return RoomCreatedOut(
        session_id=str(session.id),
        hms_room_id=room_id,
        hms_room_code_host=host_code,
        hms_room_code_guest=guest_code,
    )


# ── Start Class ──

@router.post(
    "/{batch_id}/sessions/{session_id}/start-class",
    summary="Start a live class (enable 100ms room)",
)
async def start_class(
    batch_id: uuid.UUID,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    session = await _get_session(batch_id, session_id, db)

    if not session.hms_room_id:
        raise HTTPException(status_code=400, detail="No room created for this session. Create a room first.")

    # Enable room in 100ms
    await hms_service.enable_room(session.hms_room_id)
    session.is_live = True
    await db.commit()

    return {"status": "live", "hms_room_id": session.hms_room_id, "room_code_host": session.hms_room_code_host}


# ── End Class ──

@router.post(
    "/{batch_id}/sessions/{session_id}/end-class",
    summary="End a live class (kick peers + disable room)",
)
async def end_class(
    batch_id: uuid.UUID,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    session = await _get_session(batch_id, session_id, db)

    if not session.hms_room_id:
        raise HTTPException(status_code=400, detail="No room for this session")

    # End active room (kick all peers)
    try:
        await hms_service.end_active_room(session.hms_room_id)
    except Exception:
        pass  # Room might not be active, that's fine

    # Disable room
    await hms_service.disable_room(session.hms_room_id)
    session.is_live = False
    await db.commit()

    return {"status": "ended"}


# ── Get Class Info ──

@router.get(
    "/{batch_id}/sessions/{session_id}/class-info",
    response_model=ClassInfoOut,
    summary="Get live class info for a session",
)
async def get_class_info(
    batch_id: uuid.UUID,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    session = await _get_session(batch_id, session_id, db)

    # Admin gets host code, students would get guest code
    room_code = session.hms_room_code_host if admin.role == "admin" else session.hms_room_code_guest

    return ClassInfoOut(
        session_id=str(session.id),
        hms_room_id=session.hms_room_id,
        is_live=session.is_live,
        room_code=room_code,
    )
