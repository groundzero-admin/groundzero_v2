"""100ms API integration service.

Handles management token generation, room CRUD, room codes, and
enable/disable for live class sessions.
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
