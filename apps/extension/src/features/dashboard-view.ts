/**
 * The DevForge dashboard webview — risk scores, recent violations, cost
 * breakdown. Renders raw HTML (no React build for the extension panel,
 * deliberately — keeps the bundle small and load instant).
 */
import * as vscode from 'vscode';
import { store, type DevForgeState } from '../store';
import { getConfig } from '../config';

export class DashboardViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'devforge.dashboard';
  private view?: vscode.WebviewView;
  private storeSub?: vscode.Disposable;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    this.render();
    this.storeSub?.dispose();
    this.storeSub = store.onChange(() => this.render());

    webviewView.onDidDispose(() => this.storeSub?.dispose());
  }

  private render(): void {
    if (!this.view) return;
    this.view.webview.html = this.html(store.get());
  }

  reveal(): void {
    this.view?.show?.(true);
  }

  private html(state: DevForgeState): string {
    const score = store.overallScore();
    const severity = store.worstSeverity();
    const cost = state.lastCostEstimate?.monthly_total;
    const budget = getConfig().budgetMonthlyUsd;
    const mode = getConfig().mode;

    const sevColor: Record<string, string> = {
      info: 'var(--vscode-foreground)',
      low: 'var(--vscode-charts-blue)',
      medium: 'var(--vscode-charts-yellow)',
      high: 'var(--vscode-charts-orange)',
      critical: 'var(--vscode-charts-red)',
    };
    const accent = sevColor[severity] ?? 'var(--vscode-foreground)';

    const violationsList = (state.lastAnalysis?.violations ?? []).slice(0, 5);
    const findingsList = (state.lastSecurityScan?.findings ?? []).slice(0, 5);
    const risks = state.lastAnalysis?.risk_scores;

    const apiBadge = state.apiReachable
      ? `<span class="badge ok">● connected</span>`
      : `<span class="badge offline">● offline</span>`;

    return /* html */ `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <style>
    :root { --accent: ${accent}; }
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-sideBar-background); padding: 16px; margin: 0; }
    h1 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vscode-descriptionForeground); margin: 0 0 8px; font-weight: 600; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vscode-descriptionForeground); margin: 20px 0 8px; font-weight: 600; }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .mode { font-size: 11px; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); letter-spacing: 0.08em; }
    .badge { font-size: 11px; }
    .badge.ok { color: var(--vscode-testing-iconPassed); }
    .badge.offline { color: var(--vscode-testing-iconErrored); }

    .score-card {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--vscode-editor-background);
    }
    .score-num { font-size: 36px; font-weight: 700; color: var(--accent); line-height: 1; min-width: 56px; }
    .score-meta .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vscode-descriptionForeground); }
    .score-meta .summary { font-size: 12px; color: var(--vscode-foreground); margin-top: 4px; line-height: 1.4; }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .stat { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 10px; }
    .stat .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vscode-descriptionForeground); }
    .stat .stat-value { font-size: 18px; font-weight: 600; margin-top: 4px; }

    ul { list-style: none; padding: 0; margin: 0; }
    li.item {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 6px;
      background: var(--vscode-editor-background);
    }
    li.item .head { display: flex; justify-content: space-between; align-items: center; }
    li.item .title { font-weight: 600; font-size: 12px; }
    li.item .sev { font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
    .sev.critical { background: rgba(255,80,80,0.15); color: var(--vscode-charts-red); }
    .sev.high { background: rgba(255,150,0,0.15); color: var(--vscode-charts-orange); }
    .sev.medium { background: rgba(220,200,0,0.15); color: var(--vscode-charts-yellow); }
    .sev.low { background: rgba(80,140,255,0.15); color: var(--vscode-charts-blue); }
    .sev.info { background: rgba(120,120,120,0.15); color: var(--vscode-descriptionForeground); }

    li.item .desc { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 6px; line-height: 1.4; }

    .empty { font-size: 11px; color: var(--vscode-descriptionForeground); font-style: italic; padding: 10px; text-align: center; }

    .actions { display: flex; gap: 6px; margin-top: 14px; }
    button {
      flex: 1;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none; border-radius: 4px;
      padding: 6px 10px;
      font-size: 12px; cursor: pointer;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
  </style>
</head>
<body>
  <div class="top">
    <h1>DevForge</h1>
    <span class="mode">${mode}</span>
  </div>

  <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:12px;">
    <span class="badge">file: ${state.lastAnalyzedFile ? esc(state.lastAnalyzedFile.split(/[\\/]/).pop() ?? '') : '—'}</span>
    ${apiBadge}
  </div>

  <div class="score-card">
    <div class="score-num">${score ?? '—'}</div>
    <div class="score-meta">
      <div class="label">Architecture health</div>
      <div class="summary">${
        state.lastAnalysis ? esc(state.lastAnalysis.summary) : 'Run analysis on a file to populate.'
      }</div>
    </div>
  </div>

  ${risks ? `
    <h2>Risk dimensions</h2>
    <div class="grid">
      ${dimensionCard('Scalability', risks.scalability)}
      ${dimensionCard('Security', risks.security)}
      ${dimensionCard('Consistency', risks.consistency)}
      ${dimensionCard('Over-engineering', 100 - risks.over_engineering, 'Lower is better')}
    </div>
  ` : ''}

  <h2>Violations</h2>
  ${
    violationsList.length === 0
      ? `<div class="empty">No violations from latest analysis.</div>`
      : `<ul>${violationsList.map(violationItem).join('')}</ul>`
  }

  <h2>Security findings</h2>
  ${
    findingsList.length === 0
      ? `<div class="empty">${state.lastSecurityScan ? 'Scan clean.' : 'No scan yet.'}</div>`
      : `<ul>${findingsList.map(findingItem).join('')}</ul>`
  }

  ${cost != null ? `
    <h2>Cost estimate</h2>
    <div class="stat">
      <div class="stat-label">Estimated monthly · ${esc(state.lastCostEstimate!.region)}</div>
      <div class="stat-value" style="color:${cost > budget ? 'var(--vscode-charts-red)' : cost > budget * 0.95 ? 'var(--vscode-charts-yellow)' : 'var(--vscode-charts-green)'}">
        $${cost.toFixed(2)} / mo
      </div>
      <div class="stat-label" style="margin-top:4px;">Budget $${budget.toFixed(0)} · ${budget > 0 ? ((cost / budget) * 100).toFixed(0) : '∞'}% used</div>
    </div>
  ` : ''}
</body>
</html>`;
  }
}

function dimensionCard(label: string, value: number, hint?: string): string {
  const color =
    value >= 75
      ? 'var(--vscode-charts-green)'
      : value >= 50
        ? 'var(--vscode-charts-yellow)'
        : 'var(--vscode-charts-red)';
  return `<div class="stat">
    <div class="stat-label">${label}${hint ? ` · ${hint}` : ''}</div>
    <div class="stat-value" style="color:${color}">${value}</div>
  </div>`;
}

function violationItem(v: { title: string; severity: string; description: string; recommendation?: string | null }): string {
  return `<li class="item">
    <div class="head">
      <span class="title">${esc(v.title)}</span>
      <span class="sev ${v.severity}">${v.severity}</span>
    </div>
    <div class="desc">${esc(v.description)}${v.recommendation ? ` <em>· ${esc(v.recommendation)}</em>` : ''}</div>
  </li>`;
}

function findingItem(f: { id: string; title: string; severity: string; recommendation: string; line?: number | null }): string {
  return `<li class="item">
    <div class="head">
      <span class="title">${esc(f.title)}</span>
      <span class="sev ${f.severity}">${f.severity}</span>
    </div>
    <div class="desc">${esc(f.recommendation)}${f.line ? ` <em>· line ${f.line}</em>` : ''}</div>
  </li>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
