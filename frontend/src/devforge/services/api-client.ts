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

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;
  private tenantId: string;

  constructor(
    baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
    apiKey = import.meta.env.VITE_API_KEY || 'dev-local-key',
    tenantId = 'local-dev'
  ) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.tenantId = tenantId;
  }

  private async request(method: string, endpoint: string, body?: any) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
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

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${error}`);
      throw error;
    }
  }

  async analyzeCode(code: string, language = 'typescript'): Promise<RiskScores> {
    const response: AnalyzeResponse = await this.request('POST', '/api/v1/analyze', {
      tenant_id: this.tenantId,
      code,
      language,
    });

    return response.risk_scores;
  }

  async diagnoseFailure(gitLog: string, gitDiff: string, stackTrace?: string, logs?: string): Promise<DiagnoseResponse> {
    return this.request('POST', '/api/v1/diagnose', {
      tenant_id: this.tenantId,
      git_log: gitLog,
      git_diff: gitDiff,
      stack_trace: stackTrace,
      local_logs: logs,
    });
  }

  async loadArchitecture(): Promise<ArchitectureDefinition> {
    // TODO: Implement GET /api/v1/architecture endpoint
    // For now, return a default
    return {
      id: 'default-arch',
      name: 'Standard Microservices Web App',
      expectedScale: 10000,
      architectureType: 'microservices',
      constraints: [
        { id: 'c1', name: 'Performance', description: 'P99 latency under 100ms', priority: 'critical' },
        { id: 'c2', name: 'Cost', description: 'Monthly infrastructure < $20k', priority: 'high' },
      ],
    };
  }

  async generateBlueprint(): Promise<Blueprint> {
    // TODO: Implement POST /api/v1/blueprint endpoint
    return {
      id: 'bp-1',
      name: 'Generated Blueprint',
      components: [],
      communicationPatterns: [],
      lastModified: new Date().toISOString(),
    };
  }

  async health(): Promise<{ status: string; version: string }> {
    return this.request('GET', '/health');
  }

  isConnected(): boolean {
    return !!this.baseUrl && !!this.apiKey;
  }
}
