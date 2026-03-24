"""Class recordings APIs for teacher/admin views."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_role
from app.database import get_db
from app.models.batch_enrollment import CohortEnrollment
from app.models.session import Cohort, Session
from app.models.student import Student
from app.models.user import User
from app.services import hms_service

router = APIRouter(prefix="/class-recordings", tags=["class-recordings"])


def _can_access_session(session: Session, user: User) -> bool:
    if user.role == "admin":
        return True
    return session.teacher_id is not None and str(session.teacher_id) == str(user.id)

async def _can_access_session_as_student(
    session: Session,
    user: User,
    db: AsyncSession,
) -> bool:
    if not session.cohort_id:
        return False
    student_row = await db.execute(select(Student).where(Student.user_id == user.id))
    student = student_row.scalar_one_or_none()
    if not student:
        return False
    enroll_row = await db.execute(
        select(CohortEnrollment.id).where(
            and_(
                CohortEnrollment.student_id == student.id,
                CohortEnrollment.cohort_id == session.cohort_id,
            )
        )
    )
    return enroll_row.scalar_one_or_none() is not None


@router.get("", summary="Admin list of ended classes with recording links")
async def list_class_recordings(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    del user  # role check handled by dependency
    result = await db.execute(
        select(Session, Cohort.name, User.full_name)
        .join(Cohort, Session.cohort_id == Cohort.id)
        .join(User, Session.teacher_id == User.id, isouter=True)
        .where(Session.ended_at.is_not(None))
        .options(selectinload(Session.live_room))
        .order_by(desc(Session.ended_at), desc(Session.started_at))
    )
    rows = result.all()
    return [
        {
            "session_id": str(session.id),
            "cohort_id": str(session.cohort_id) if session.cohort_id else None,
            "cohort_name": cohort_name,
            "session_name": session.title or f"Session {session.session_number}",
            "session_number": session.session_number,
            "scheduled_at": session.scheduled_at.isoformat() if session.scheduled_at else None,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            "teacher_name": teacher_name or "Unassigned",
            "hms_room_id": session.live_room.hms_room_id if session.live_room else None,
            "has_live_room": bool(session.live_room and session.live_room.hms_room_id),
        }
        for session, cohort_name, teacher_name in rows
    ]


@router.get("/{session_id}", summary="Get recording assets and transcript for a class session")
async def get_session_recordings(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("teacher", "admin", "student")),
):
    result = await db.execute(
        select(Session, Cohort.name, User.full_name)
        .join(Cohort, Session.cohort_id == Cohort.id, isouter=True)
        .join(User, Session.teacher_id == User.id, isouter=True)
        .where(Session.id == session_id)
        .options(selectinload(Session.live_room))
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    session, cohort_name, teacher_name = row
    allowed = _can_access_session(session, user)
    if not allowed and user.role == "student":
        allowed = await _can_access_session_as_student(session, user, db)
    if not allowed:
        raise HTTPException(status_code=403, detail="Not allowed to view this session recording")

    if not session.live_room or not session.live_room.hms_room_id:
        return {
            "session_id": str(session.id),
            "cohort_name": cohort_name,
            "session_name": session.title or f"Session {session.session_number}",
            "teacher_name": teacher_name or "Unassigned",
            "hms_room_id": None,
            "recordings": [],
        }

    room_id = session.live_room.hms_room_id
    try:
        listing = await hms_service.list_recordings(room_id=room_id, limit=50)
    except Exception:
        return {
            "session_id": str(session.id),
            "cohort_name": cohort_name,
            "session_name": session.title or f"Session {session.session_number}",
            "teacher_name": teacher_name or "Unassigned",
            "hms_room_id": room_id,
            "recordings": [],
        }
    recordings = []
    for rec in listing.get("data", []):
        try:
            rec_full = await hms_service.get_recording(rec["id"])
        except Exception:
            continue
        assets = []
        for asset in rec_full.get("recording_assets") or []:
            presigned = None
            if asset.get("status") == "completed":
                try:
                    presigned = await hms_service.get_recording_asset_presigned_url(asset["id"])
                except Exception:
                    presigned = None
            assets.append(
                {
                    "id": asset.get("id"),
                    "type": asset.get("type"),
                    "status": asset.get("status"),
                    "output_mode": (asset.get("metadata") or {}).get("output_mode"),
                    "created_at": asset.get("created_at"),
                    "path": asset.get("path"),
                    "url": (presigned or {}).get("url"),
                }
            )
        recordings.append(
            {
                "id": rec_full.get("id"),
                "status": rec_full.get("status"),
                "started_at": rec_full.get("started_at"),
                "stopped_at": rec_full.get("stopped_at"),
                "created_at": rec_full.get("created_at"),
                "assets": assets,
            }
        )

    recordings.sort(key=lambda r: r.get("created_at") or "", reverse=True)
    return {
        "session_id": str(session.id),
        "cohort_name": cohort_name,
        "session_name": session.title or f"Session {session.session_number}",
        "teacher_name": teacher_name or "Unassigned",
        "hms_room_id": room_id,
        "recordings": recordings,
    }
