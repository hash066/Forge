import * as vscode from 'vscode';
import { RiskScores } from '../shared/types';

export class StatusBarManager {
    private riskItem: vscode.StatusBarItem;
    private costItem: vscode.StatusBarItem;
    private driftItem: vscode.StatusBarItem;
    private isAnalyzing: boolean = false;

    constructor() {
        // Risk Score Item
        this.riskItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.riskItem.command = 'devforge.showDashboard';
        this.riskItem.tooltip = 'Click to show DevForge Architecture Insights';

        // Cost Item
        this.costItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
        this.costItem.tooltip = 'Estimated monthly infrastructure cost';

        // Drift/Warning Item
        this.driftItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
        this.driftItem.tooltip = 'Architectural drift warnings detected';
        this.driftItem.command = 'workbench.view.extension.devforge-sidebar';

        // Set initial values
        this.riskItem.text = `$(shield) Risk: --`;
        this.costItem.text = `$(credit-card) Cost: --`;
        this.driftItem.text = `$(check) DevForge Ready`;

        this.show();
    }

    public show() {
        this.riskItem.show();
        this.costItem.show();
        this.driftItem.show();
    }

    public updateRisk(scores: RiskScores) {
        // Average the scores for a general status or just pick high
        const maxScore = Math.max(scores.security, scores.scalability, scores.cost, scores.overengineering);
        const displayScore = Math.round(maxScore * 10);
        
        this.riskItem.text = `$(shield) Risk: ${displayScore}/10`;
        
        if (displayScore >= 7) {
            this.riskItem.color = new vscode.ThemeColor('errorForeground');
        } else if (displayScore >= 4) {
            this.riskItem.color = new vscode.ThemeColor('editorWarning.foreground');
        } else {
            this.riskItem.color = new vscode.ThemeColor('debugIcon.startForeground');
        }
    }

    public updateCost(cost: number) {
        this.costItem.text = `$(credit-card) Cost: $${cost.toFixed(0)}/mo`;
    }

    public updateDrift(count: number) {
        if (count === 0) {
            this.driftItem.text = `$(check) Architecture Match`;
            this.driftItem.color = undefined;
        } else {
            this.driftItem.text = `$(warning) ${count} Drift Warning${count > 1 ? 's' : ''}`;
            this.driftItem.color = new vscode.ThemeColor('editorWarning.foreground');
        }
    }

    public setLoading(loading: boolean) {
        this.isAnalyzing = loading;
        if (loading) {
            this.riskItem.text = `$(sync~spin) Analyzing...`;
            this.riskItem.command = undefined;
        } else {
            this.riskItem.command = 'devforge.showDashboard';
        }
    }

    public dispose() {
        this.riskItem.dispose();
        this.costItem.dispose();
        this.driftItem.dispose();
    }
}
