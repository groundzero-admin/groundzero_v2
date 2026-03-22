import uuid

from pydantic import BaseModel, Field


class ActivityCreate(BaseModel):
    id: str = Field(..., description="Unique activity ID e.g. L1-W1-S1-warmup")
    module_id: str = Field(..., description="Module ID e.g. level_1, math_v1")
    name: str
    type: str = Field(..., description="warmup | key_topic | diy | ai_lab | artifact")
    mode: str | None = Field("default", description="timed_mcq | open_ended | discussion | default")
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
    pillar_id: str | None = Field(None, description="math_logic | communication | creativity | ai_systems")
    question_ids: list[str] | None = Field(None, description='["uuid1", "uuid2"]')


class ActivityUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    mode: str | None = None
    module_id: str | None = None
    week: int | None = None
    session_number: int | None = None
    duration_minutes: int | None = None
    grade_bands: list[str] | None = None
    description: str | None = None
    learning_outcomes: list[str] | None = None
    primary_competencies: list[dict] | None = None
    secondary_competencies: list[dict] | None = None
    prerequisites: list[dict] | None = None
    pillar_id: str | None = None
    question_ids: list[str] | None = None


class ActivityOut(BaseModel):
    id: str
    module_id: str
    name: str
    type: str
    mode: str = "default"
    week: int | None = None
    session_number: int | None = None
    duration_minutes: int | None = None
    grade_bands: list[str] | None = None
    description: str | None = None
    learning_outcomes: list[str] | None = None
    primary_competencies: list[dict] | None = None
    secondary_competencies: list[dict] | None = None
    prerequisites: list[dict] | None = None
    pillar_id: str | None = None
    question_ids: list[str] | None = None

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    module_id: str
    competency_id: str | None = Field(None, description="Legacy primary competency ID e.g. C1.1")
    competency_ids: list[str] | None = Field(None, description='List of competency IDs e.g. ["C1.1","C2.3"]')
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


class QuestionUpdate(BaseModel):
    text: str | None = None
    type: str | None = None
    options: list[dict] | None = None
    correct_answer: str | None = None
    difficulty: float | None = Field(None, ge=0.0, le=1.0)
    grade_band: str | None = None
    explanation: str | None = None
    competency_id: str | None = None
    competency_ids: list[str] | None = None


class QuestionOut(BaseModel):
    id: uuid.UUID
    module_id: str
    competency_id: str
    competency_ids: list[str] = Field(default_factory=list)
    text: str
    type: str
    options: list[dict] | None = None
    correct_answer: str | None = None
    difficulty: float
    grade_band: str
    topic_id: str | None = None
    explanation: str | None = None

    model_config = {"from_attributes": True}
