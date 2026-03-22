"""Admin media upload — generate presigned S3 PUT URLs for direct browser uploads."""
import uuid

import boto3
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import require_role
from app.config import settings

router = APIRouter(prefix="/admin/media", tags=["admin-media"])

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
}


# ── Schemas ──

class PresignedUploadRequest(BaseModel):
    file_name: str
    content_type: str


class PresignedUploadResponse(BaseModel):
    upload_url: str
    public_url: str


# ── Endpoints ──

@router.post("/presigned-upload", response_model=PresignedUploadResponse)
async def presigned_upload(
    body: PresignedUploadRequest,
    _: None = Depends(require_role("admin", "teacher")),
):
    if body.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"content_type must be one of: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}",
        )

    key = f"media/{uuid.uuid4()}/{body.file_name}"

    s3_kwargs: dict = {"region_name": settings.AWS_REGION}
    if settings.AWS_ACCESS_KEY_ID:
        s3_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        s3_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
    if settings.AWS_SESSION_TOKEN:
        s3_kwargs["aws_session_token"] = settings.AWS_SESSION_TOKEN
    s3_client = boto3.client("s3", **s3_kwargs)

    upload_url = s3_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.MEDIA_BUCKET,
            "Key": key,
            "ContentType": body.content_type,
        },
        ExpiresIn=300,
        HttpMethod="PUT",
    )

    public_url = f"https://{settings.MEDIA_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"

    return PresignedUploadResponse(upload_url=upload_url, public_url=public_url)
