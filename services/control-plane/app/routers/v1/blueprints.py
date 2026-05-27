"""
POST /v1/blueprints — blueprint CRUD + AI generation.

Phase 0: in-memory store (will move to Postgres in Phase 1).
"""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import Field

from app.deps import TenantContext, tenant_context
from app.schemas.common import AnalysisMetadata, StrictModel
from app.services.bedrock import BedrockError, get_bedrock_client
from app.services.prompts import SYSTEM_PROMPT

router = APIRouter(prefix="/blueprints", tags=["blueprints"])


class Constraints(StrictModel):
    current_users: int = Field(..., ge=0)
    projected_users_6mo: int = Field(..., ge=0)
    monthly_budget_usd: float = Field(..., ge=0)
    team_size: int = Field(..., ge=1)
    architecture_type: str = Field(default="modular_monolith")
    domain: str = Field(default="web")


class BlueprintComponent(StrictModel):
    id: str
    type: str
    name: str
    technology: str
    justification: str
    estimated_cost_monthly: float = 0.0


class BlueprintConnection(StrictModel):
    source: str
    target: str
    kind: str = "sync"


class Blueprint(StrictModel):
    id: str
    version: int
    project_name: str
    constraints: Constraints
    components: list[BlueprintComponent]
    connections: list[BlueprintConnection]
    total_estimated_cost: float
    notes: str = ""
    created_at: datetime
    metadata: AnalysisMetadata


class GenerateRequest(StrictModel):
    project_name: str = Field(..., max_length=120)
    constraints: Constraints
    existing_code: str | None = Field(default=None, max_length=20_000)


# Tenant-scoped in-memory store. Phase 1: move to `blueprints` table.
_STORE: dict[str, dict[str, Blueprint]] = {}


@router.post("/generate", response_model=Blueprint, summary="Generate a blueprint from constraints")
async def generate(
    payload: GenerateRequest,
    ctx: TenantContext = Depends(tenant_context),
) -> Blueprint:
    start = time.perf_counter()
    bedrock = get_bedrock_client()

    prompt = _build_blueprint_prompt(payload)
    try:
        result = await bedrock.invoke(prompt, system=SYSTEM_PROMPT, temperature=0.3, max_tokens=3000)
    except BedrockError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    parsed = result.json_payload or {}
    blueprint = Blueprint(
        id=str(uuid.uuid4()),
        version=1,
        project_name=payload.project_name,
        constraints=payload.constraints,
        components=[BlueprintComponent(**c) for c in parsed.get("components", [])],
        connections=[BlueprintConnection(**c) for c in parsed.get("connections", [])],
        total_estimated_cost=float(parsed.get("total_estimated_cost", 0.0)),
        notes=str(parsed.get("notes", "")),
        created_at=datetime.now(timezone.utc),
        metadata=AnalysisMetadata(
            request_id=ctx.request_id,
            tenant_id=ctx.tenant_id,
            model_used=result.model_id,
            latency_ms=round((time.perf_counter() - start) * 1000.0, 2),
            created_at=datetime.now(timezone.utc),
        ),
    )

    _STORE.setdefault(ctx.tenant_id, {})[blueprint.id] = blueprint
    return blueprint


@router.get("/{blueprint_id}", response_model=Blueprint)
async def get_blueprint(blueprint_id: str, ctx: TenantContext = Depends(tenant_context)) -> Blueprint:
    bp = _STORE.get(ctx.tenant_id, {}).get(blueprint_id)
    if not bp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Blueprint not found")
    return bp


@router.get("", response_model=list[Blueprint])
async def list_blueprints(ctx: TenantContext = Depends(tenant_context)) -> list[Blueprint]:
    return list(_STORE.get(ctx.tenant_id, {}).values())


def _build_blueprint_prompt(payload: GenerateRequest) -> str:
    c = payload.constraints
    return (
        f"Generate an AWS infrastructure blueprint for '{payload.project_name}'.\n\n"
        f"Constraints:\n"
        f"  - current users: {c.current_users}\n"
        f"  - projected users (6mo): {c.projected_users_6mo}\n"
        f"  - monthly budget: ${c.monthly_budget_usd}\n"
        f"  - team size: {c.team_size}\n"
        f"  - architecture type: {c.architecture_type}\n"
        f"  - domain: {c.domain}\n\n"
        + (f"Existing code excerpt:\n```\n{payload.existing_code[:1500]}\n```\n\n" if payload.existing_code else "")
        + 'Return JSON: { "components": [...], "connections": [...], "total_estimated_cost": 0, "notes": "..." }.\n'
        'Each component: {"id","type","name","technology","justification","estimated_cost_monthly"}.\n'
        'Each connection: {"source","target","kind"}.\n'
        "Stay within budget. Prefer the simplest architecture that meets the scale target."
    )
