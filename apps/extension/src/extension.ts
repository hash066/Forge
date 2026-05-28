/**
 * DevForge VS Code extension entry point.
 *
 * activate() is invoked by VS Code at extension startup (we use
 * onStartupFinished to avoid blocking the editor). It wires:
 *   - DashboardViewProvider (sidebar webview)
 *   - cost status bar (live cost + risk indicator)
 *   - file watcher → analyzer (debounced)
 *   - commands: analyzeFile, openDashboard, setApiUrl
 */
import * as vscode from 'vscode';
import { api } from './api';
import { getConfig, onConfigChange } from './config';
import { store } from './store';
import { analyzeDocument } from './analyzer';
import { shouldAutoAnalyze } from './language';
import { registerCostStatusBar } from './features/cost-status-bar';
import { DashboardViewProvider } from './features/dashboard-view';
import { securityDiagnostics, clearSecurityFindings } from './features/security-gate';
import { ClusterIncidentsProvider } from './features/cluster-incidents';

let healthCheckInterval: NodeJS.Timeout | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('[devforge] activating…');

  // 1. Sidebar webview
  const provider = new DashboardViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(DashboardViewProvider.viewType, provider),
  );

  // 2. Status bar
  context.subscriptions.push(registerCostStatusBar(context));

  // 3. Diagnostics
  context.subscriptions.push(securityDiagnostics);

  // 3b. Cluster Incidents tree (DevForge OS)
  const incidents = new ClusterIncidentsProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(ClusterIncidentsProvider.viewType, incidents),
    incidents,
  );
  incidents.start();

  // 4. Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('devforge.analyzeFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        void vscode.window.showInformationMessage('DevForge: open a file first.');
        return;
      }
      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Window, title: 'DevForge analyzing…' },
        () => analyzeDocument(editor.document),
      );
    }),
    vscode.commands.registerCommand('devforge.openDashboard', async () => {
      await vscode.commands.executeCommand('workbench.view.extension.devforge');
      provider.reveal();
    }),
    vscode.commands.registerCommand('devforge.setApiUrl', async () => {
      const current = getConfig().apiUrl;
      const value = await vscode.window.showInputBox({
        prompt: 'DevForge control plane URL',
        value: current,
        placeHolder: 'https://api.devforge.io',
        validateInput: (v) => (/^https?:\/\//.test(v) ? null : 'Must start with http:// or https://'),
      });
      if (value) {
        await vscode.workspace.getConfiguration('devforge').update('apiUrl', value, vscode.ConfigurationTarget.Global);
        await pingApi();
      }
    }),
    vscode.commands.registerCommand('devforge.refreshIncidents', () => incidents.refresh()),
    vscode.commands.registerCommand('devforge.openClusterDashboard', async () => {
      await vscode.env.openExternal(vscode.Uri.parse(getConfig().dashboardUrl));
    }),
  );

  // 5. Auto-analyze on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (!getConfig().autoAnalyzeOnSave) return;
      if (!shouldAutoAnalyze(doc)) return;
      void analyzeDocument(doc);
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => clearSecurityFindings(doc.uri)),
  );

  // 6. Reflect config changes
  context.subscriptions.push(
    onConfigChange(() => {
      void pingApi();
    }),
  );

  // 7. Health check loop (every 30s)
  await pingApi();
  healthCheckInterval = setInterval(() => void pingApi(), 30_000);

  console.log('[devforge] activated.');
}

export function deactivate(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = undefined;
  }
}

async function pingApi(): Promise<void> {
  const ok = await api.health();
  store.patch({ apiReachable: ok });
}
