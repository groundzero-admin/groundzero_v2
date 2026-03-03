"""SPARK agent tools — read student/question context and submit evidence."""

import uuid

from langchain_core.tools import tool
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.database import async_session_maker
from app.models.competency import Competency
from app.models.curriculum import Question
from app.models.student import Student, StudentCompetencyState
from app.schemas.evidence import EvidenceCreate
from app.services import evidence_service


# ── Pydantic input schemas with rich descriptions ──


class GetStudentContextInput(BaseModel):
    """Input for looking up a student's mastery state."""

    student_id: str = Field(
        description="The student's UUID. You receive this in the SPARK CONTEXT at the start of the conversation."
    )
    competency_ids: list[str] = Field(
        description=(
            "List of competency IDs to look up, e.g. ['C1.4', 'C4.14']. "
            "You get the relevant competency_id from the SPARK CONTEXT or from "
            "the get_question_context result. Always pass at least the competency "
            "from the current question."
        )
    )


class GetQuestionContextInput(BaseModel):
    """Input for looking up MCQ question details."""

    question_id: str = Field(
        description="The question's UUID. You receive this in the SPARK CONTEXT at the start of the conversation."
    )


class SubmitEvidenceInput(BaseModel):
    """Input for submitting a mastery evidence signal."""

    student_id: str = Field(
        description="The student's UUID from the SPARK CONTEXT."
    )
    competency_id: str = Field(
        description=(
            "The competency this evidence is for, e.g. 'C1.4'. "
            "This may differ from the question's tagged competency if you "
            "diagnose the root cause as a different skill gap."
        )
    )
    outcome: float = Field(
        description=(
            "0.0 to 1.0 — how well the student demonstrated this skill. "
            "Careless slip = 0.6-0.8, procedural error = 0.3-0.5, "
            "conceptual gap = 0.1-0.3, no understanding = 0.0."
        ),
        ge=0.0,
        le=1.0,
    )
    evidence_text: str = Field(
        description="The student's own words or behavior that supports your assessment. Quote them directly when possible."
    )


# ── Tool implementations ──


@tool(args_schema=GetStudentContextInput)
async def get_student_context(student_id: str, competency_ids: list[str]) -> dict:
    """Look up a student's name, grade, and mastery state for specific competencies.

    ALWAYS call this before responding to the student. Pass the competency_id
    from the SPARK CONTEXT (or from get_question_context) in the competency_ids list.
    The result tells you the student's grade level (for age-appropriate language)
    and their current mastery (to calibrate your diagnosis).
    """
    try:
        sid = uuid.UUID(student_id)
    except (ValueError, AttributeError):
        return {"error": f"Invalid student_id: '{student_id}'. Pass the UUID from the SPARK CONTEXT."}

    async with async_session_maker() as db:
        student = await db.get(Student, sid)
        if not student:
            return {"error": "Student not found"}

        result = await db.execute(
            select(StudentCompetencyState, Competency.name)
            .join(Competency, StudentCompetencyState.competency_id == Competency.id)
            .where(
                StudentCompetencyState.student_id == sid,
                StudentCompetencyState.competency_id.in_(competency_ids),
            )
        )
        rows = result.all()

        states = []
        for row in rows:
            st = row.StudentCompetencyState
            states.append({
                "competency_id": st.competency_id,
                "name": row.name,
                "p_learned": round(st.p_learned, 3),
                "stage": st.stage,
                "total_evidence": st.total_evidence,
                "is_stuck": st.is_stuck,
            })

        return {
            "student_grade": student.grade,
            "student_name": student.name,
            "states": states if states else "No mastery data yet — this is a new student for these competencies.",
        }


@tool(args_schema=GetQuestionContextInput)
async def get_question_context(question_id: str) -> dict:
    """Look up the MCQ question the student was working on.

    ALWAYS call this before responding. The result gives you the question text,
    all answer options (with which is correct), the tagged competency, and difficulty.
    Use this to understand what the student was trying to solve.
    """
    try:
        qid = uuid.UUID(question_id)
    except (ValueError, AttributeError):
        return {"error": f"Invalid question_id: '{question_id}'. Pass the UUID from the SPARK CONTEXT."}

    async with async_session_maker() as db:
        question = await db.get(Question, qid)
        if not question:
            return {"error": "Question not found"}

        comp = await db.get(Competency, question.competency_id)
        comp_name = comp.name if comp else question.competency_id

        options = question.options or []
        correct_label = next((o["label"] for o in options if o.get("is_correct")), None)

        return {
            "question_id": str(question.id),
            "text": question.text,
            "options": [
                {"label": o["label"], "text": o["text"], "is_correct": o.get("is_correct", False)}
                for o in options
            ],
            "correct_label": correct_label,
            "competency_id": question.competency_id,
            "competency_name": comp_name,
            "difficulty": round(question.difficulty, 2),
        }


@tool(args_schema=SubmitEvidenceInput)
async def submit_evidence(
    student_id: str,
    competency_id: str,
    outcome: float,
    evidence_text: str,
) -> dict:
    """Submit a mastery evidence signal to the BKT learning engine.

    Call this ONLY after you have diagnosed the student's skill gap through
    conversation (at least 1-2 exchanges). The engine uses this to update the
    student's mastery probability. Do NOT call this for hints — only for diagnoses.
    """
    try:
        sid = uuid.UUID(student_id)
    except (ValueError, AttributeError):
        return {"error": f"Invalid student_id: '{student_id}'. Pass the UUID from the SPARK CONTEXT."}

    async with async_session_maker() as db:
        data = EvidenceCreate(
            student_id=sid,
            competency_id=competency_id,
            outcome=max(0.0, min(1.0, outcome)),
            source="llm_spark",
            ai_interaction="conversation",
        )
        event, updates = await evidence_service.process_evidence(db, data)

        return {
            "submitted": True,
            "event_id": str(event.id),
            "updates": [
                {
                    "competency_id": u.competency_id,
                    "p_learned_before": round(u.p_learned_before, 3),
                    "p_learned_after": round(u.p_learned_after, 3),
                    "stage_before": u.stage_before,
                    "stage_after": u.stage_after,
                }
                for u in updates
            ],
        }
