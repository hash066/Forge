/**
 * Typed configuration accessor. All settings declared in package.json
 * `contributes.configuration` should be read through here so callers get
 * IntelliSense and defaults that don't drift.
 */
import * as vscode from 'vscode';

export interface DevForgeConfig {
  apiUrl: string;
  apiKey: string;
  tenantId: string;
  mode: 'student' | 'developer';
  autoAnalyzeOnSave: boolean;
  budgetMonthlyUsd: number;
}

export function getConfig(): DevForgeConfig {
  const cfg = vscode.workspace.getConfiguration('devforge');
  return {
    apiUrl: cfg.get<string>('apiUrl', 'http://localhost:8000').replace(/\/$/, ''),
    apiKey: cfg.get<string>('apiKey', 'dev-local-key'),
    tenantId: cfg.get<string>('tenantId', 'local-dev'),
    mode: cfg.get<'student' | 'developer'>('mode', 'developer'),
    autoAnalyzeOnSave: cfg.get<boolean>('autoAnalyzeOnSave', true),
    budgetMonthlyUsd: cfg.get<number>('budgetMonthlyUsd', 100),
  };
}

export function onConfigChange(callback: (cfg: DevForgeConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('devforge')) callback(getConfig());
  });
}
