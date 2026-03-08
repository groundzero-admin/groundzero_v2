from pydantic import BaseModel, Field


class PillarCreate(BaseModel):
    id: str = Field(..., pattern=r"^[a-z_]+$", description="e.g. communication, creativity")
    name: str
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$", description="Hex color e.g. #E53E3E")
    description: str


class PillarOut(BaseModel):
    id: str
    name: str
    color: str
    description: str

    model_config = {"from_attributes": True}


class CapabilityCreate(BaseModel):
    id: str = Field(..., max_length=1, description="Single letter A-P")
    pillar_id: str
    name: str
    description: str


class CapabilityOut(BaseModel):
    id: str
    pillar_id: str
    name: str
    description: str

    model_config = {"from_attributes": True}


class CompetencyCreate(BaseModel):
    id: str = Field(..., pattern=r"^C\d+\.\d+$", description="e.g. C1.1, C4.19")
    capability_id: str
    name: str
    description: str
    assessment_method: str = Field(..., pattern=r"^(mcq|llm|both)$")
    default_params: dict = Field(
        default={"pL0": 0.10, "pT": 0.15, "pG": 0.25, "pS": 0.10},
        description="BKT parameters",
    )


class CompetencyOut(BaseModel):
    id: str
    capability_id: str
    name: str
    description: str
    assessment_method: str
    default_params: dict

    model_config = {"from_attributes": True}


class PrerequisiteEdgeOut(BaseModel):
    source_id: str
    target_id: str
    min_stage: int

    model_config = {"from_attributes": True}


class CodevelopmentEdgeOut(BaseModel):
    source_id: str
    target_id: str
    transfer_weight: float
    rationale: str | None = None

    model_config = {"from_attributes": True}


class SkillGraphOut(BaseModel):
    competencies: list[CompetencyOut]
    prerequisite_edges: list[PrerequisiteEdgeOut]
    codevelopment_edges: list[CodevelopmentEdgeOut]
    pillars: list[PillarOut]
    capabilities: list[CapabilityOut]
