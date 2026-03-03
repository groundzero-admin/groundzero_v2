"""
Diagnostic seeding — accepts a diagnostic profile and seeds all 56 competency states.

Stage → P(L₀) mapping:
  Stage 1 → 0.10 (Novice)
  Stage 2 → 0.30 (Emerging)
  Stage 3 → 0.50 (Developing)
  Stage 4 → 0.70 (Proficient)
  Stage 5 → 0.85 (Mastered)
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill_graph import PrerequisiteEdge
from app.models.student import Student, StudentCompetencyState

STAGE_TO_PL = {1: 0.10, 2: 0.30, 3: 0.50, 4: 0.70, 5: 0.85}


async def apply_diagnostic(
    db: AsyncSession,
    student_id: uuid.UUID,
    profile: dict,
) -> list[dict]:
    """
    Apply a diagnostic profile to seed all competency states.

    Profile format:
    {
      "pillar_stages": {
          "communication": 2,
          "creativity": 1,
          "ai_systems": 3,
          "math_logic": 2
      },
      "overrides": {
          "C4.7": 4,
          "C1.1": 3
      }
    }

    Returns list of updated competency states with their new P(L) values.
    """
    # Load student
    student = (await db.execute(
        select(Student).where(Student.id == student_id)
    )).scalar_one_or_none()
    if not student:
        raise ValueError(f"Student {student_id} not found")

    # Load all competency states
    result = await db.execute(
        select(StudentCompetencyState).where(StudentCompetencyState.student_id == student_id)
    )
    states = {s.competency_id: s for s in result.scalars().all()}

    # Load prerequisite edges for consistency enforcement
    prereq_result = await db.execute(select(PrerequisiteEdge))
    prereq_edges = prereq_result.scalars().all()
    # Build target → list of source prerequisite competency IDs
    prereq_map: dict[str, list[str]] = {}
    for edge in prereq_edges:
        prereq_map.setdefault(edge.target_id, []).append(edge.source_id)

    # Pillar ID → competency prefix mapping
    pillar_prefix = {
        "communication": "C1.",
        "creativity": "C2.",
        "ai_systems": "C3.",
        "math_logic": "C4.",
    }

    pillar_stages = profile.get("pillar_stages", {})
    overrides = profile.get("overrides", {})

    # Step 1: Assign stages from pillar defaults
    stage_assignments: dict[str, int] = {}
    for pillar_id, stage in pillar_stages.items():
        prefix = pillar_prefix.get(pillar_id)
        if not prefix:
            continue
        stage = max(1, min(5, stage))
        for cid in states:
            if cid.startswith(prefix):
                stage_assignments[cid] = stage

    # Step 2: Apply overrides
    for cid, stage in overrides.items():
        if cid in states:
            stage_assignments[cid] = max(1, min(5, stage))

    # Step 3: Enforce prerequisite consistency
    # If a competency is assigned Stage N, all its prerequisites must be at least Stage N
    changed = True
    while changed:
        changed = False
        for cid, stage in list(stage_assignments.items()):
            for prereq_cid in prereq_map.get(cid, []):
                if prereq_cid in stage_assignments:
                    if stage_assignments[prereq_cid] < stage:
                        stage_assignments[prereq_cid] = stage
                        changed = True

    # Step 4: Apply to DB states
    updates = []
    for cid, stage in stage_assignments.items():
        state = states.get(cid)
        if state:
            p_l = STAGE_TO_PL.get(stage, 0.10)
            state.p_learned = p_l
            state.stage = stage
            updates.append({"competency_id": cid, "stage": stage, "p_learned": p_l})

    # Mark diagnostic as completed
    student.diagnostic_completed = True
    student.diagnostic_profile = profile

    await db.commit()
    return updates
