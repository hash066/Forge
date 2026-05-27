"""Request / response shapes for analysis-style endpoints."""

from __future__ import annotations

from pydantic import Field

from app.schemas.common import (
    AnalysisMetadata,
    Language,
    RiskScores,
    StrictModel,
    Violation,
)


class AnalysisRequest(StrictModel):
    code: str = Field(..., min_length=1, max_length=200_000)
    language: Language = "unknown"
    file_path: str | None = None
    blueprint_id: str | None = Field(default=None, description="Optional blueprint to compare against")


class AnalysisResponse(StrictModel):
    summary: str
    severity: str
    violations: list[Violation] = []
    risk_scores: RiskScores | None = None
    recommendations: list[str] = []
    metadata: AnalysisMetadata


class DriftRequest(StrictModel):
    blueprint_id: str
    code: str | None = None
    actual_resources: list[dict] | None = None


class DriftItem(StrictModel):
    resource_id: str
    drift_type: str  # missing | unmanaged | modified_property | wrong_technology
    severity: str
    expected: str | None = None
    actual: str | None = None
    description: str
    recommendation: str | None = None


class DriftResponse(StrictModel):
    drift_detected: bool
    drift_score: int = Field(..., ge=0, le=100)
    items: list[DriftItem] = []
    metadata: AnalysisMetadata


class RiskRequest(StrictModel):
    architecture: dict
    context: dict | None = None


class RiskResponse(StrictModel):
    scores: RiskScores
    rationale: dict[str, str]
    metadata: AnalysisMetadata
