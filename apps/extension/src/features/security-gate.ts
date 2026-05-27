/**
 * Security gate — surfaces critical/high findings as VS Code diagnostics so
 * they appear inline in the editor + in the Problems panel. On critical
 * findings, also pops a blocking modal that explains the finding and offers
 * the fix.
 */
import * as vscode from 'vscode';
import type { SecurityFinding, SecurityResponse } from '../api';

const diagnostics = vscode.languages.createDiagnosticCollection('devforge');

const SEVERITY_MAP: Record<SecurityFinding['severity'], vscode.DiagnosticSeverity> = {
  critical: vscode.DiagnosticSeverity.Error,
  high: vscode.DiagnosticSeverity.Error,
  medium: vscode.DiagnosticSeverity.Warning,
  low: vscode.DiagnosticSeverity.Information,
  info: vscode.DiagnosticSeverity.Hint,
};

export function applySecurityFindings(
  document: vscode.TextDocument,
  scan: SecurityResponse,
): void {
  const items: vscode.Diagnostic[] = scan.findings.map((f) => {
    const lineIdx = Math.max(0, (f.line ?? 1) - 1);
    const line = document.lineAt(Math.min(lineIdx, document.lineCount - 1));
    const range = new vscode.Range(line.range.start, line.range.end);
    const diag = new vscode.Diagnostic(
      range,
      `${f.title} — ${f.recommendation}`,
      SEVERITY_MAP[f.severity],
    );
    diag.source = 'DevForge';
    diag.code = { value: f.id, target: vscode.Uri.parse('https://devforge.io/docs/security/' + f.id) };
    return diag;
  });
  diagnostics.set(document.uri, items);
}

export function clearSecurityFindings(uri: vscode.Uri): void {
  diagnostics.delete(uri);
}

/**
 * If critical findings present, raise a modal once per save. We dedupe by
 * file + finding id so users don't get spammed if they don't fix immediately.
 */
const recentlyWarned = new Map<string, number>();
const WARN_COOLDOWN_MS = 30_000;

export async function maybeShowCriticalGate(
  document: vscode.TextDocument,
  scan: SecurityResponse,
): Promise<void> {
  const criticals = scan.findings.filter((f) => f.severity === 'critical');
  if (criticals.length === 0) return;

  const key = `${document.uri.toString()}::${criticals.map((c) => c.id).join('|')}`;
  const last = recentlyWarned.get(key);
  if (last && Date.now() - last < WARN_COOLDOWN_MS) return;
  recentlyWarned.set(key, Date.now());

  const first = criticals[0]!;
  const choice = await vscode.window.showErrorMessage(
    `🚨 ${first.title}\n\n${first.recommendation}` +
      (criticals.length > 1 ? `\n(+${criticals.length - 1} more critical issue${criticals.length > 2 ? 's' : ''})` : ''),
    { modal: true },
    'Go to line',
    'Suppress for session',
  );
  if (choice === 'Go to line' && first.line) {
    const pos = new vscode.Position(Math.max(0, first.line - 1), 0);
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
  } else if (choice === 'Suppress for session') {
    // Lock the cooldown to effectively infinity for this key.
    recentlyWarned.set(key, Number.MAX_SAFE_INTEGER);
  }
}

export const securityDiagnostics = diagnostics;
