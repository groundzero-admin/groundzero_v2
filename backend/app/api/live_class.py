"""Live class API — create rooms, start/end class for sessions."""
import asyncio
import uuid
from urllib.parse import urlencode

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_role
from app.database import get_db
from app.models.session import Session, LiveRoom
from app.models.user import User
from app.config import settings
from app.services import hms_service

router = APIRouter(prefix="/cohorts", tags=["live-class"])


class RoomCreatedOut(BaseModel):
    session_id: str
    hms_room_id: str
    room_code_host: str
    room_code_guest: str


async def _get_session(
    cohort_id: uuid.UUID, session_id: uuid.UUID, db: AsyncSession
) -> Session:
    result = await db.execute(
        select(Session)
        .where(Session.id == session_id, Session.cohort_id == cohort_id)
        .options(selectinload(Session.live_room))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def _start_recording_after_delay(room_hms_id: str, meeting_url: str, delay_sec: float = 5.0) -> None:
    """Give the teacher time to open the live tab and publish video before browser recording starts."""
    await asyncio.sleep(delay_sec)
    try:
        active = await hms_service.get_active_recording(room_hms_id)
        if active:
            return
        await hms_service.start_recording_for_room(room_hms_id, meeting_url=meeting_url)
    except Exception:
        pass


@router.post(
    "/{cohort_id}/sessions/{session_id}/create-room",
    response_model=RoomCreatedOut,
    summary="Create 100ms room for a session",
)
async def create_room_for_session(
    cohort_id: uuid.UUID,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("teacher", "admin")),
):
    session = await _get_session(cohort_id, session_id, db)

    if session.live_room:
        raise HTTPException(status_code=400, detail="Room already exists for this session")

    room_name = f"session-{session.id}"
    room = await hms_service.create_room(room_name)
    room_id = room["id"]

    codes = await hms_service.create_room_codes(room_id)
    host_code = ""
    guest_code = ""
    # Map 100ms roles: broadcaster = teacher, co-broadcaster = student (can publish audio/video)
    for c in codes:
        role = c.get("role", "")
        if role in ("broadcaster", "host"):
            host_code = c["code"]
        elif role in ("co-broadcaster", "guest"):
            guest_code = c["code"]

    # Fallback if role names don't match
    if not host_code and codes:
        host_code = codes[0]["code"]
    if not guest_code and len(codes) > 1:
        guest_code = codes[1]["code"]

    live_room = LiveRoom(
        session_id=session.id,
        hms_room_id=room_id,
        room_code_host=host_code,
        room_code_guest=guest_code,
    )
    db.add(live_room)
    await db.commit()

    return RoomCreatedOut(
        session_id=str(session.id),
        hms_room_id=room_id,
        room_code_host=host_code,
        room_code_guest=guest_code,
    )


@router.post(
    "/{cohort_id}/sessions/{session_id}/start-class",
    summary="Start a live class",
)
async def start_class(
    cohort_id: uuid.UUID,
    session_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("teacher", "admin")),
):
    session = await _get_session(cohort_id, session_id, db)
    room = session.live_room

    if not room:
        raise HTTPException(status_code=400, detail="No room created for this session. Create a room first.")

    await hms_service.enable_room(room.hms_room_id)
    recording_started = False
    recording_already_running = False
    active_recording_id = None
    try:
        active = await hms_service.get_active_recording(room.hms_room_id)
        if active:
            recording_already_running = True
            active_recording_id = active.get("id")
            recording_started = True
        else:
            focus_user = await db.get(User, session.teacher_id) if session.teacher_id else None
            raw_focus = (focus_user.full_name if focus_user else _admin.full_name or "").strip() or "Teacher"
            focus_parts = [raw_focus, "Teacher"] if raw_focus.lower() != "teacher" else ["Teacher"]
            focus_name = ",".join(dict.fromkeys(focus_parts))
            base = settings.FRONTEND_URL.rstrip("/")
            meeting_url = f"{base}/recording-renderer?{urlencode({'roomCode': room.room_code_guest or room.room_code_host or '', 'focusName': focus_name, 'recorderName': 'Class Recorder'})}"
            background_tasks.add_task(_start_recording_after_delay, room.hms_room_id, meeting_url)
            recording_started = True
    except Exception:
        recording_started = False
    room.is_live = True
    await db.commit()

    return {
        "status": "live",
        "hms_room_id": room.hms_room_id,
        "room_code_host": room.room_code_host,
        "recording_started": recording_started,
        "recording_already_running": recording_already_running,
        "recording_id": active_recording_id,
    }


@router.post(
    "/{cohort_id}/sessions/{session_id}/end-class",
    summary="End a live class",
)
async def end_class(
    cohort_id: uuid.UUID,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("teacher", "admin")),
):
    session = await _get_session(cohort_id, session_id, db)
    room = session.live_room

    if not room:
        raise HTTPException(status_code=400, detail="No room for this session")

    try:
        await hms_service.stop_recording_for_room(room.hms_room_id)
    except Exception:
        pass

    try:
        await hms_service.end_active_room(room.hms_room_id)
    except Exception:
        pass

    await hms_service.disable_room(room.hms_room_id)
    room.is_live = False
    await db.commit()

    return {"status": "ended"}


@router.get(
    "/{cohort_id}/sessions/{session_id}/class-info",
    summary="Get live class info for a session",
)
async def get_class_info(
    cohort_id: uuid.UUID,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("teacher", "admin")),
):
    session = await _get_session(cohort_id, session_id, db)
    room = session.live_room

    room_code = None
    if room:
        room_code = room.room_code_host  # both admin and teacher get host code (they're teaching)

    return {
        "session_id": str(session.id),
        "hms_room_id": room.hms_room_id if room else None,
        "is_live": room.is_live if room else False,
        "room_code": room_code,
    }
