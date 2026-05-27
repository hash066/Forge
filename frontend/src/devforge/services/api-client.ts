import { ArchitectureDefinition, Blueprint, RiskScores, ValidationResult, DriftResult, FeedbackItem } from '../types';

interface AnalyzeResponse {
  tenant_id: string;
  risk_scores: RiskScores;
  feedback: string[];
  violations: Record<string, any>[];
}

interface DiagnoseResponse {
  tenant_id: string;
  diagnosis: string;
  suggested_fix?: string;
  confidence: number;
}

export interface BlueprintConstraints {
  current_users: number;
  projected_users: number;
  budget: number;
  team_size: number;
  architecture_type: 'microservices' | 'monolith' | string;
  domain: string;
}

export interface DevForgeApiEndpoints {
  /** Local FastAPI control plane (proxy + auth). */
  controlPlane: string;
  /** devforge-api gateway (blueprint / diagram / predict-scale / quiz / detect-patterns / health). */
  devforgeApi: string;
  /** infra-ai-api gateway (analyze / risk / drift / cost / security). */
  infraAiApi: string;
  /** devforge-realtime WebSocket. */
  realtimeWss: string;
}

const DEFAULT_ENDPOINTS: DevForgeApiEndpoints = {
  controlPlane: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  devforgeApi:
    import.meta.env.VITE_DEVFORGE_API_BASE_URL ||
    'https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev',
  infraAiApi:
    import.meta.env.VITE_INFRA_AI_API_BASE_URL ||
    'https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev',
  realtimeWss:
    import.meta.env.VITE_REALTIME_WSS_URL ||
    'wss://6fhd8botk8.execute-api.eu-north-1.amazonaws.com/dev/',
};

export class ApiClient {
  private endpoints: DevForgeApiEndpoints;
  private apiKey: string;
  private tenantId: string;

  constructor(
    endpoints: Partial<DevForgeApiEndpoints> = {},
    apiKey = import.meta.env.VITE_API_KEY || 'dev-local-key',
    tenantId = 'local-dev',
  ) {
    this.endpoints = { ...DEFAULT_ENDPOINTS, ...endpoints };
    this.apiKey = apiKey;
    this.tenantId = tenantId;
  }

  get baseUrl(): string {
    return this.endpoints.controlPlane;
  }

  private async request<T = any>(baseUrl: string, method: string, path: string, body?: unknown): Promise<T> {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`API request failed [${method} ${baseUrl}${path}]: ${error}`);
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Local control-plane endpoints (FastAPI in backend/)
  // -------------------------------------------------------------------------

  async analyzeCode(code: string, language = 'typescript'): Promise<RiskScores> {
    const response = await this.request<AnalyzeResponse>(
      this.endpoints.controlPlane,
      'POST',
      '/api/v1/analyze',
      { tenant_id: this.tenantId, code, language },
    );
    return response.risk_scores;
  }

  async diagnoseFailure(
    gitLog: string,
    gitDiff: string,
    stackTrace?: string,
    logs?: string,
  ): Promise<DiagnoseResponse> {
    return this.request<DiagnoseResponse>(this.endpoints.controlPlane, 'POST', '/api/v1/diagnose', {
      tenant_id: this.tenantId,
      git_log: gitLog,
      git_diff: gitDiff,
      stack_trace: stackTrace,
      local_logs: logs,
    });
  }

  async loadArchitecture(): Promise<ArchitectureDefinition> {
    // TODO: Implement GET /api/v1/architecture endpoint on the control plane.
    return {
      id: 'default-arch',
      name: 'Standard Microservices Web App',
      expectedScale: 10000,
      architectureType: 'microservices',
      constraints: [],
      approved: false,
      createdAt: new Date(),
    } as ArchitectureDefinition;
  }

  // -------------------------------------------------------------------------
  // devforge-api gateway (ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev)
  // -------------------------------------------------------------------------

  async generateBlueprint(
    constraints: BlueprintConstraints,
    projectName: string,
    code = '',
  ): Promise<Blueprint> {
    return this.request<Blueprint>(this.endpoints.devforgeApi, 'POST', '/generate-blueprint', {
      constraints,
      project_name: projectName,
      code,
    });
  }

  async generateDiagram(code: string, language: 'terraform' | 'cloudformation' = 'terraform') {
    return this.request(this.endpoints.devforgeApi, 'POST', '/diagram', { code, language });
  }

  async predictScale(architecture: Record<string, unknown>, currentUsers: number) {
    return this.request(this.endpoints.devforgeApi, 'POST', '/predict-scale', {
      architecture,
      current_users: currentUsers,
    });
  }

  async generateQuiz(code: string, language: string) {
    return this.request(this.endpoints.devforgeApi, 'POST', '/quiz/generate', { code, language });
  }

  async detectPatterns(code: string, language: string) {
    return this.request(this.endpoints.devforgeApi, 'POST', '/detect-patterns', { code, language });
  }

  // -------------------------------------------------------------------------
  // infra-ai-api gateway (1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev)
  // -------------------------------------------------------------------------

  async analyzeInfrastructure(payload: Record<string, unknown>) {
    return this.request(this.endpoints.infraAiApi, 'POST', '/analyze', payload);
  }

  async calculateRisk(payload: Record<string, unknown>): Promise<RiskScores> {
    return this.request<RiskScores>(this.endpoints.infraAiApi, 'POST', '/risk', payload);
  }

  async detectDrift(payload: Record<string, unknown>): Promise<DriftResult> {
    return this.request<DriftResult>(this.endpoints.infraAiApi, 'POST', '/drift', payload);
  }

  async estimateCost(payload: Record<string, unknown>) {
    return this.request(this.endpoints.infraAiApi, 'POST', '/cost', payload);
  }

  async securityScan(payload: Record<string, unknown>) {
    return this.request(this.endpoints.infraAiApi, 'POST', '/security', payload);
  }

  // -------------------------------------------------------------------------
  // Health + real-time
  // -------------------------------------------------------------------------

  async health(): Promise<{ status: string; version?: string }> {
    return this.request(this.endpoints.devforgeApi, 'GET', '/health');
  }

  openRealtimeSocket(): WebSocket {
    return new WebSocket(this.endpoints.realtimeWss);
  }

  isConnected(): boolean {
    return !!this.endpoints.controlPlane && !!this.apiKey;
  }
}
