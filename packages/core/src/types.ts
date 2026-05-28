/**
 * DevForge OS shared types — the single source of truth shared across the
 * dashboard, the VS Code extension, and the marketing site. Mirrors the
 * Pydantic schemas in `services/control-plane/app/schemas/k8s.py`.
 */

export type IncidentReason =
  | "CrashLoopBackOff"
  | "OOMKilled"
  | "ImagePullBackOff"
  | "ErrImagePull"
  | "ProbeFailure"
  | "StuckRollout"
  | "Unschedulable"
  | "MissingLimits"
  | "OverProvisioned"
  | "PrivilegedPod"
  | "HighRestarts"
  | "Unknown";

export type RemediationAction =
  | "restart_pod"
  | "rollback"
  | "set_resources"
  | "scale"
  | "patch_image"
  | "adjust_probe"
  | "add_limits"
  | "cordon_drain"
  | "none";

export type RiskLevel = "low" | "medium" | "high";
export type RemediationMode = "auto" | "suggest";
export type IncidentStatus =
  | "detected"
  | "diagnosing"
  | "remediating"
  | "suggested"
  | "resolved"
  | "failed";

export interface RemediationPlan {
  action: RemediationAction | string;
  target: string;
  rationale: string;
  patch: Record<string, unknown>;
  risk: RiskLevel;
  mode: RemediationMode;
  commands: string[];
}

export interface RCA {
  root_cause: string;
  summary: string;
  confidence: number;
  category: string;
  evidence: string[];
  remediation: RemediationPlan;
}

export interface Incident {
  id: string;
  tenant_id: string;
  cluster: string;
  namespace: string;
  kind: string;
  name: string;
  reason: string;
  severity: string;
  status: IncidentStatus | string;
  summary: string;
  root_cause: string;
  confidence: number;
  evidence: unknown[];
  remediation: Record<string, unknown>;
  model_used: string | null;
  detected_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface Remediation {
  id: string;
  tenant_id: string;
  incident_id: string;
  action: string;
  target: string;
  mode: string;
  status: string;
  rationale: string;
  patch: Record<string, unknown>;
  risk: string;
  applied_at: string | null;
  created_at: string;
}

export interface ClusterSnapshot {
  id: string;
  cluster: string;
  nodes: number;
  pods_total: number;
  pods_healthy: number;
  namespaces: number;
  health_score: number;
  monthly_cost_usd: number;
  monthly_waste_usd: number;
  security_findings: number;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  resource_type: string;
  resource_id: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface IncidentStats {
  total: number;
  open: number;
  resolved: number;
  detected: number;
  remediating: number;
  suggested: number;
}

export interface Overview {
  stats: IncidentStats;
  snapshot: ClusterSnapshot | null;
  recent_incidents: Incident[];
  recent_remediations: Remediation[];
}

export interface IncidentContext {
  cluster?: string;
  namespace: string;
  kind?: string;
  name: string;
  reason: IncidentReason | string;
  severity?: string;
  message?: string;
  events?: string[];
  logs?: string | null;
  container_statuses?: Record<string, unknown>[];
  spec_excerpt?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

export interface DiagnoseResponse {
  incident_id: string;
  remediation_id: string;
  status: string;
  rca: RCA;
  model_used: string | null;
  provider: string;
  latency_ms: number;
  cached: boolean;
}

export interface AskResponse {
  answer: string;
  sources: string[];
  model_used: string;
  provider: string;
}

export interface ClusterSnapshotInput {
  cluster?: string;
  nodes?: number;
  pods_total?: number;
  pods_healthy?: number;
  namespaces?: number;
  health_score?: number;
  monthly_cost_usd?: number;
  monthly_waste_usd?: number;
  security_findings?: number;
  detail?: Record<string, unknown>;
}

export interface RemediateReport {
  incident_id: string;
  remediation_id?: string;
  action?: string;
  target?: string;
  status?: "applied" | "failed" | "skipped" | "approved" | "proposed";
  detail?: string;
}

/** Live WebSocket event union pushed from the control plane. */
export type StreamEvent =
  | { type: "connected"; tenant_id: string }
  | { type: "ping" }
  | {
      type: "incident.diagnosed";
      tenant_id: string;
      incident: Incident;
      remediation_id: string;
      latency_ms: number;
    }
  | {
      type: "incident.remediated";
      tenant_id: string;
      incident: Incident;
      outcome: string;
      action: string;
    }
  | { type: "snapshot"; tenant_id: string; snapshot: ClusterSnapshot };

export const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};
