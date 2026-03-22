"""100ms API integration service.

Handles management token generation, room CRUD, room codes, enable/disable,
and recording asset retrieval for playback URLs.
"""
import time
import uuid

import httpx
import jwt

from app.config import settings


HMS_API_BASE = "https://api.100ms.live/v2"


def _generate_management_token() -> str:
    """Generate a 100ms management token (JWT) for server-side API calls."""
    now = int(time.time())
    payload = {
        "access_key": settings.HMS_ACCESS_KEY,
        "type": "management",
        "version": 2,
        "iat": now,
        "nbf": now,
        "exp": now + 86400,  # 24h
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.HMS_APP_SECRET, algorithm="HS256")


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_generate_management_token()}",
        "Content-Type": "application/json",
    }


async def create_room(name: str) -> dict:
    """Create a 100ms room. Returns the room object with id, name, enabled, etc."""
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(
            f"{HMS_API_BASE}/rooms",
            headers=_headers(),
            json={
                "name": name,
                "description": f"Live class room: {name}",
                "region": "in",
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()


async def create_room_codes(room_id: str) -> list[dict]:
    """Create room codes for all roles in a room. Returns list of code objects."""
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(
            f"{HMS_API_BASE}/room-codes/room/{room_id}",
            headers=_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json().get("data", [])


async def enable_room(room_id: str) -> dict:
    """Enable a room (allow peers to join)."""
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(
            f"{HMS_API_BASE}/rooms/{room_id}",
            headers=_headers(),
            json={"enabled": True},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()


async def disable_room(room_id: str) -> dict:
    """Disable a room (prevent new joins)."""
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(
            f"{HMS_API_BASE}/rooms/{room_id}",
            headers=_headers(),
            json={"enabled": False},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()


async def end_active_room(room_id: str) -> dict:
    """End an active room — kicks all current peers."""
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(
            f"{HMS_API_BASE}/active-rooms/{room_id}/end-room",
            headers=_headers(),
            json={"reason": "Class ended by admin", "lock": False},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()


async def list_recordings(room_id: str, limit: int = 50) -> dict:
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{HMS_API_BASE}/recordings",
            headers=_headers(),
            params={"room_id": room_id, "limit": limit},
            timeout=20,
        )
        resp.raise_for_status()
        return resp.json()


async def get_recording(recording_id: str) -> dict:
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{HMS_API_BASE}/recordings/{recording_id}",
            headers=_headers(),
            timeout=20,
        )
        resp.raise_for_status()
        return resp.json()


async def get_recording_asset_presigned_url(asset_id: str) -> dict:
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{HMS_API_BASE}/recording-assets/{asset_id}/presigned-url",
            headers=_headers(),
            timeout=20,
        )
        resp.raise_for_status()
        return resp.json()


def _best_video_asset(assets: list) -> dict | None:
    """Prefer main room-composite MP4; skip audio-only Rec-Audio composites."""
    video = [
        a
        for a in assets
        if isinstance(a, dict)
        and a.get("type") in ("room-composite", "room-vod")
        and str(a.get("status") or "").lower() == "completed"
    ]
    if not video:
        return None
    for a in video:
        path = (a.get("path") or "").lower()
        if "rec-audio" not in path:
            return a
    return video[0]


async def get_latest_recording_playback_url(hms_room_id: str) -> str | None:
    """Presigned URL for the latest completed room-composite video, or None."""
    if not settings.HMS_ACCESS_KEY or not settings.HMS_APP_SECRET:
        return None
    try:
        listing = await list_recordings(hms_room_id, limit=50)
    except Exception:
        return None
    rows = listing.get("data") or []
    if not isinstance(rows, list) or not rows:
        return None
    rows.sort(key=lambda r: (r.get("created_at") or ""), reverse=True)
    for rec in rows:
        if not isinstance(rec, dict) or not rec.get("id"):
            continue
        if str(rec.get("status") or "").lower() == "failed":
            continue
        try:
            rec_full = await get_recording(rec["id"])
        except Exception:
            continue
        assets = rec_full.get("recording_assets") or []
        best = _best_video_asset(assets)
        if not best or not best.get("id"):
            continue
        try:
            presigned = await get_recording_asset_presigned_url(best["id"])
            url = (presigned or {}).get("url")
            if isinstance(url, str) and url.startswith("http"):
                return url
        except Exception:
            continue
    return None
