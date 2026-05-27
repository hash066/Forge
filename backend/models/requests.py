from pydantic import BaseModel
from typing import Optional


class AnalyzeRequest(BaseModel):
    tenant_id: str
    code: str
    language: Optional[str] = "typescript"
    context: Optional[str] = None


class DiagnoseRequest(BaseModel):
    tenant_id: str
    git_log: str
    git_diff: str
    stack_trace: Optional[str] = None
    local_logs: Optional[str] = None


class BlueprintRequest(BaseModel):
    tenant_id: str
    architecture_type: str
    scale: int
    constraints: Optional[list[dict]] = None
