from pydantic import BaseModel, Field


class CurriculumTopicCreate(BaseModel):
    id: str = Field(..., pattern=r"^[a-z0-9\-]+$", description="Slug e.g. cbse-math-6-fractions")
    board: str = Field(..., pattern=r"^(cbse|ib|icse)$", description="Curriculum board")
    subject: str = Field(..., description="e.g. mathematics, science")
    grade: int = Field(..., ge=4, le=9, description="Grade level 4-9")
    chapter_number: int = Field(..., ge=1, description="Chapter ordering within grade+subject")
    name: str = Field(..., description="Chapter/topic display name")
    description: str | None = None
    ncert_ref: str | None = Field(None, description="Source attribution e.g. 'Class 6, Ch 7'")
    content: list[dict] | None = Field(None, description="Content blocks for ContentRenderer")


class CurriculumTopicOut(BaseModel):
    id: str
    board: str
    subject: str
    grade: int
    chapter_number: int
    name: str
    description: str | None = None
    ncert_ref: str | None = None
    content: list[dict] | None = None

    model_config = {"from_attributes": True}


class TopicCompetencyMapCreate(BaseModel):
    competency_id: str = Field(..., description="Competency ID e.g. C4.15")
    relevance: float = Field(..., ge=0.0, le=1.0, description="How strongly this topic exercises this competency")


class TopicCompetencyMapOut(BaseModel):
    topic_id: str
    competency_id: str
    relevance: float

    model_config = {"from_attributes": True}


class TopicCompetencyDetailOut(BaseModel):
    """Competency mapping with name for display."""
    competency_id: str
    competency_name: str
    relevance: float


class CurriculumTopicDetailOut(BaseModel):
    """Topic with its mapped competencies — returned by GET /topics/{id}."""
    topic: CurriculumTopicOut
    competencies: list[TopicCompetencyDetailOut]


class RecommendedTopicOut(BaseModel):
    """A topic recommendation with score and reasoning."""
    topic: CurriculumTopicOut
    score: float = Field(..., description="Need score — higher means more beneficial to study")
    weak_competencies: list[dict] = Field(
        ..., description='[{"competency_id": "C4.14", "name": "...", "p_learned": 0.15, "stage": 1, "relevance": 0.8}]'
    )
