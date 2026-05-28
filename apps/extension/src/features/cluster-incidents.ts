/**
 * "Cluster Incidents" tree view — DevForge OS in the IDE.
 *
 * Polls the control plane for live Kubernetes incidents and renders each with
 * its AI root cause and proposed remediation, so engineers see cluster health
 * (and what DevForge is fixing) without leaving the editor.
 */
import * as vscode from 'vscode';
import { api, type K8sIncident, type Severity } from '../api';

type Node =
  | { kind: 'incident'; incident: K8sIncident }
  | { kind: 'detail'; label: string; tooltip?: string; icon?: string };

function statusLabel(status: string): string {
  switch (status) {
    case 'resolved':
      return '✓ resolved';
    case 'remediating':
      return 'remediating…';
    case 'suggested':
      return 'awaiting approval';
    case 'failed':
      return '✗ failed';
    default:
      return status;
  }
}

function severityColor(severity: Severity): vscode.ThemeColor {
  const map: Record<string, string> = {
    critical: 'charts.red',
    high: 'charts.orange',
    medium: 'charts.yellow',
    low: 'charts.blue',
    info: 'charts.foreground',
  };
  return new vscode.ThemeColor(map[severity] ?? 'charts.foreground');
}

function incidentIcon(i: K8sIncident): vscode.ThemeIcon {
  if (i.status === 'resolved') return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
  if (i.status === 'failed') return new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
  if (i.status === 'remediating') return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.purple'));
  return new vscode.ThemeIcon('warning', severityColor(i.severity));
}

export class ClusterIncidentsProvider implements vscode.TreeDataProvider<Node>, vscode.Disposable {
  static readonly viewType = 'devforge.incidents';

  private readonly _onDidChange = new vscode.EventEmitter<Node | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  private incidents: K8sIncident[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;
  private reachable = true;

  start(intervalMs = 5000): void {
    void this.refresh();
    this.timer = setInterval(() => void this.refresh(), intervalMs);
  }

  async refresh(): Promise<void> {
    try {
      this.incidents = await api.listIncidents(50);
      this.reachable = true;
    } catch {
      this.incidents = [];
      this.reachable = false;
    }
    this._onDidChange.fire();
  }

  getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === 'incident') {
      const i = node.incident;
      const item = new vscode.TreeItem(
        `${i.reason} · ${i.name}`,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      item.description = `${i.namespace} — ${statusLabel(i.status)}`;
      const md = new vscode.MarkdownString();
      md.appendMarkdown(`**${i.summary}**\n\n`);
      md.appendMarkdown(`${i.root_cause}\n\n`);
      md.appendMarkdown(
        `**Fix:** \`${i.remediation.action}\` → ${i.remediation.target} (${i.remediation.risk ?? 'low'} risk)`,
      );
      item.tooltip = md;
      item.iconPath = incidentIcon(i);
      item.contextValue = 'devforgeIncident';
      return item;
    }
    const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None);
    if (node.tooltip) item.tooltip = node.tooltip;
    if (node.icon) item.iconPath = new vscode.ThemeIcon(node.icon);
    return item;
  }

  getChildren(element?: Node): Node[] {
    if (!element) {
      if (!this.reachable) {
        return [{ kind: 'detail', label: 'Control plane offline — set API URL', icon: 'debug-disconnect' }];
      }
      if (this.incidents.length === 0) {
        return [{ kind: 'detail', label: 'No incidents — cluster healthy', icon: 'pass-filled' }];
      }
      return this.incidents.map((incident) => ({ kind: 'incident', incident }));
    }
    if (element.kind === 'incident') {
      const i = element.incident;
      const children: Node[] = [
        { kind: 'detail', label: `Root cause: ${i.root_cause}`, icon: 'lightbulb' },
        {
          kind: 'detail',
          label: `Fix: ${i.remediation.action} → ${i.remediation.target}`,
          icon: 'tools',
        },
      ];
      const cmd = i.remediation.commands?.[0];
      if (cmd) children.push({ kind: 'detail', label: cmd, icon: 'terminal' });
      children.push({
        kind: 'detail',
        label: `Confidence ${Math.round((i.confidence ?? 0) * 100)}% · ${i.model_used ?? 'n/a'}`,
        icon: 'info',
      });
      return children;
    }
    return [];
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this._onDidChange.dispose();
  }
}
