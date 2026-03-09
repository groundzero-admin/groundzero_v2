import uuid

from pydantic import BaseModel, Field


class ActivityCreate(BaseModel):
    id: str = Field(..., description="Unique activity ID e.g. L1-W1-S1-warmup")
    module_id: str = Field(..., description="Module ID e.g. level_1, math_v1")
    name: str
    type: str = Field(..., description="warmup | key_topic | diy | ai_lab | artifact")
    week: int | None = None
    session_number: int | None = None
    duration_minutes: int | None = None
    grade_bands: list[str] | None = None
    description: str | None = None
    learning_outcomes: list[str] | None = None
    primary_competencies: list[dict] | None = Field(
        None, description='[{"competency_id": "C1.1", "expected_gain": 0.15}]'
    )
    secondary_competencies: list[dict] | None = None
    prerequisites: list[dict] | None = Field(
        None, description='[{"competency_id": "C1.1", "min_stage": 2}]'
    )


class ActivityOut(BaseModel):
    id: str
    module_id: str
    name: str
    type: str
    week: int | None = None
    session_number: int | None = None
    duration_minutes: int | None = None
    grade_bands: list[str] | None = None
    description: str | None = None
    learning_outcomes: list[str] | None = None
    primary_competencies: list[dict] | None = None
    secondary_competencies: list[dict] | None = None
    prerequisites: list[dict] | None = None

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    module_id: str
    competency_id: str = Field(..., description="Competency ID e.g. C1.1")
    text: str
    type: str = Field("mcq", description="mcq | short_answer")
    options: list[dict] | None = Field(
        None, description='[{"label": "A", "text": "...", "isCorrect": true}]'
    )
    correct_answer: str | None = None
    difficulty: float = Field(..., ge=0.0, le=1.0, description="0.0 (easy) to 1.0 (hard)")
    grade_band: str = Field(..., pattern=r"^(4-5|6-7|8-9)$")
    topic_id: str | None = Field(None, description="Optional curriculum topic ID e.g. cbse-math-6-fractions")
    explanation: str | None = None


class QuestionOut(BaseModel):
    id: uuid.UUID
    module_id: str
    competency_id: str
    text: str
    type: str
    options: list[dict] | None = None
    correct_answer: str | None = None
    difficulty: float
    grade_band: str
    topic_id: str | None = None
    explanation: str | None = None

    model_config = {"from_attributes": True}


class ActivityUpdate(BaseModel):
    name: str | None = None
    module_id: str | None = None
    type: str | None = None
    week: int | None = None
    session_number: int | None = None
    duration_minutes: int | None = None
    grade_bands: list[str] | None = None
    description: str | None = None
    learning_outcomes: list[str] | None = None
    primary_competencies: list[dict] | None = None
    secondary_competencies: list[dict] | None = None
    prerequisites: list[dict] | None = None


class QuestionUpdate(BaseModel):
    module_id: str | None = None
    competency_id: str | None = None
    text: str | None = None
    type: str | None = None
    options: list[dict] | None = None
    correct_answer: str | None = None
    difficulty: float | None = None
    grade_band: str | None = None
    topic_id: str | None = None
    explanation: str | None = None
