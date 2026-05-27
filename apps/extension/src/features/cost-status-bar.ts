/**
 * Status bar item showing live AWS cost estimate + drift/risk indicator.
 *
 * Color codes:
 *   • white → no data yet
 *   • green → under 60% budget, no critical findings
 *   • yellow → 60–95% budget OR medium severity
 *   • red → over budget OR high/critical findings
 */
import * as vscode from 'vscode';
import { getConfig } from '../config';
import { store } from '../store';

export function registerCostStatusBar(context: vscode.ExtensionContext): vscode.Disposable {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.command = 'devforge.openDashboard';
  item.tooltip = 'DevForge — click to open dashboard';
  context.subscriptions.push(item);

  const render = () => {
    const { apiReachable, lastCostEstimate, lastAnalysis, lastSecurityScan } = store.get();
    const budget = getConfig().budgetMonthlyUsd;
    const cost = lastCostEstimate?.monthly_total;
    const severity = store.worstSeverity();
    const violationCount =
      (lastAnalysis?.violations.length ?? 0) + (lastSecurityScan?.findings.length ?? 0);

    if (!apiReachable) {
      item.text = '$(circle-slash) DevForge offline';
      item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      item.show();
      return;
    }

    const parts: string[] = ['$(circuit-board) DevForge'];

    if (cost != null) {
      const pct = budget > 0 ? (cost / budget) * 100 : 0;
      parts.push(`· $${cost.toFixed(2)}/mo (${pct.toFixed(0)}%)`);
    }

    if (violationCount > 0) {
      const icon =
        severity === 'critical' || severity === 'high'
          ? '$(error)'
          : severity === 'medium'
            ? '$(warning)'
            : '$(info)';
      parts.push(`${icon} ${violationCount}`);
    }

    item.text = parts.join(' ');

    // Coloring
    if (severity === 'critical' || severity === 'high' || (cost && cost > budget)) {
      item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (severity === 'medium' || (cost && cost > budget * 0.95)) {
      item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      item.backgroundColor = undefined;
    }
    item.show();
  };

  render();
  const sub = store.onChange(render);
  return { dispose: () => sub.dispose() };
}
