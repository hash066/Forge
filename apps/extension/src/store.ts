/**
 * In-memory event bus for cross-component state. Risk panel subscribes to
 * `state-changed` and re-renders. Status bar subscribes to update its label.
 *
 * Keeping this minimal — VS Code already provides event types we lean on.
 */
import * as vscode from 'vscode';
import type {
  AnalysisResponse,
  SecurityResponse,
  CostResponse,
  RiskScores,
} from './api';

export interface DevForgeState {
  lastAnalyzedFile: string | null;
  lastAnalysis: AnalysisResponse | null;
  lastSecurityScan: SecurityResponse | null;
  lastCostEstimate: CostResponse | null;
  isAnalyzing: boolean;
  apiReachable: boolean;
}

const initial: DevForgeState = {
  lastAnalyzedFile: null,
  lastAnalysis: null,
  lastSecurityScan: null,
  lastCostEstimate: null,
  isAnalyzing: false,
  apiReachable: false,
};

class Store {
  private state: DevForgeState = { ...initial };
  private emitter = new vscode.EventEmitter<DevForgeState>();

  readonly onChange = this.emitter.event;

  get(): Readonly<DevForgeState> {
    return this.state;
  }

  patch(partial: Partial<DevForgeState>): void {
    this.state = { ...this.state, ...partial };
    this.emitter.fire(this.state);
  }

  // Computed: highest severity across last scan + analysis
  worstSeverity(): 'info' | 'low' | 'medium' | 'high' | 'critical' {
    const a = this.state.lastAnalysis?.severity;
    const s = this.state.lastSecurityScan?.findings ?? [];
    const order: Array<'info' | 'low' | 'medium' | 'high' | 'critical'> = [
      'info',
      'low',
      'medium',
      'high',
      'critical',
    ];
    let max = order.indexOf(a ?? 'info');
    for (const f of s) {
      const idx = order.indexOf(f.severity);
      if (idx > max) max = idx;
    }
    return order[Math.max(0, max)]!;
  }

  // Aggregate risk score 0–100, derived from RiskScores object. Lower-is-worse
  // dimensions are inverted so a single bar represents overall health.
  overallScore(): number | null {
    const r: RiskScores | null | undefined = this.state.lastAnalysis?.risk_scores;
    if (!r) return null;
    const inv = (n: number) => 100 - n;
    const values = [
      r.scalability,
      inv(r.over_engineering),
      r.security,
      r.consistency,
    ];
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }
}

export const store = new Store();
