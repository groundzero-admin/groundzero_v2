"""Evidence routes: submit evidence → trigger BKT update."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.evidence import BKTUpdateOut, EvidenceCreate, EvidenceOut, EvidenceResultOut
from app.services import evidence_service

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.post(
    "",
    response_model=EvidenceResultOut,
    status_code=201,
    summary="Submit Learning Evidence",
    description="Record a learning event (MCQ answer, facilitator observation, etc.) and trigger a BKT mastery update. Returns the created event plus before/after mastery state changes.",
)
async def submit_evidence(data: EvidenceCreate, db: AsyncSession = Depends(get_db)):
    event, update_results = await evidence_service.process_evidence(db, data)
    updates = [
        BKTUpdateOut(
            competency_id=r.competency_id,
            p_learned_before=r.p_learned_before,
            p_learned_after=r.p_learned_after,
            stage_before=r.stage_before,
            stage_after=r.stage_after,
            is_stuck=r.is_stuck,
        )
        for r in update_results
    ]
    return EvidenceResultOut(event=EvidenceOut.model_validate(event), updates=updates)


@router.get(
    "",
    response_model=list[EvidenceOut],
    summary="Get Learning History",
    description="Retrieve evidence events for a student and/or competency. Used for journey timelines, progress reviews, and analytics.",
)
async def get_evidence(
    student_id: uuid.UUID | None = Query(None),
    competency_id: str | None = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
):
    events = await evidence_service.get_evidence_history(db, student_id, competency_id, limit)
    return events
