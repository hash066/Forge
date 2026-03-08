import { Blueprint, RiskScores, Violation, Constraints } from '../shared/types';

import * as vscode from 'vscode';

export class APIClient {
    private get infraApiBase() {
        return vscode.workspace.getConfiguration('devforge').get<string>('infraApiEndpoint') || 'https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev';
    }
    private get devforgeApiBase() {
        return vscode.workspace.getConfiguration('devforge').get<string>('apiEndpoint') || 'https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev';
    }

    public async checkHealth(): Promise<boolean> {
        try {
            const res = await fetch(`${this.devforgeApiBase}/health`);
            return res.ok;
        } catch {
            return false;
        }
    }

    public async analyzeCode(code: string, language: string): Promise<Violation[]> {
        const res = await fetch(`${this.infraApiBase}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language })
        });
        if (res.ok) return await res.json();
        return [];
    }

    public async calculateRisk(architecture: Blueprint): Promise<RiskScores> {
        const res = await fetch(`${this.infraApiBase}/risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(architecture)
        });
        if (res.ok) return await res.json();
        return { security: 0.5, scalability: 0.5, cost: 0.5, overengineering: 0.5 };
    }

    public async estimateCost(services: string[]): Promise<number> {
        const res = await fetch(`${this.infraApiBase}/cost`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ services })
        });
        if (res.ok) {
            const data = await res.json();
            return data.cost;
        }
        return 0; // Return 0 and let local cost calculator handle it in extension.ts
    }

    public async generateBlueprint(constraints: Constraints): Promise<Blueprint> {
        const res = await fetch(`${this.devforgeApiBase}/generate-blueprint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(constraints)
        });
        if (res.ok) return await res.json();
        throw new Error('Could not generate blueprint from API.');
    }

    public async scanSecurity(code: string): Promise<Violation[]> {
        const res = await fetch(`${this.infraApiBase}/security`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        if (res.ok) return await res.json();
        return [];
    }

    public async detectDrift(blueprint: Blueprint, code: string, fileName: string): Promise<Violation[]> {
        try {
            const res = await fetch(`${this.infraApiBase}/drift`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blueprint, code, fileName })
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.error('API /drift failed, falling back to mock.', e);
        }
        return [];
    }

    public async predictScale(architecture: any, currentUsers: number): Promise<any> {
        try {
            const res = await fetch(`${this.infraApiBase}/predict-scale`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ architecture, current_users: currentUsers })
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.error('API /predict-scale failed.', e);
        }
        return {
            current_users: currentUsers,
            timeline: [],
            summary: { action_required: false },
            timestamp: new Date().toISOString()
        };
    }

    public async generateQuiz(code: string, language: string): Promise<any> {
        try {
            const res = await fetch(`${this.devforgeApiBase}/generate-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language })
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.error('API /generate-quiz failed.', e);
        }
        return {
            question: "Why is the current database connection pattern problematic for scaling?",
            options: [
                "It uses too much memory on the client side",
                "Connection exhaustion occurs at high concurrency",
                "It violates PostgreSQL security protocols",
                "The connection string is too long"
            ],
            correct_index: 1,
            explanation: "Creating a new connection per request quickly exhausts the database's available connection pool.",
            difficulty: "medium"
        };
    }

    public async detectPatterns(code: string, language: string): Promise<any> {
        const res = await fetch(`${this.devforgeApiBase}/detect-patterns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language })
        });
        if (res.ok) return await res.json();
        return { patterns: [] };
    }
}

