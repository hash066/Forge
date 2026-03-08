import { Blueprint, RiskScores, Violation, Constraints } from '../shared/types';

export class APIClient {
    private infraApiBase = 'https://1plv9rmbhb.execute-api.eu-north-1.amazonaws.com/dev';
    private devforgeApiBase = 'https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev';

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
        // This would call the /predict-scale endpoint
        // For now, it returns a realistic mock matching the Lambda logic
        const dbCapacity = 1000; // Mock for db.t3.micro
        return {
            current_users: currentUsers,
            timeline: [
                { user_count: currentUsers, status: 'healthy', health_score: 100, issues: [] },
                { user_count: dbCapacity * 0.8, status: 'degraded', health_score: 60, issues: [{ component: 'database', severity: 'warning', description: 'Database connection pool at 80% capacity', recommendation: 'Consider adding read replicas' }] },
                { user_count: dbCapacity, status: 'critical', health_score: 20, issues: [{ component: 'database', severity: 'critical', description: 'Database connection pool exhausted', recommendation: 'Immediate action: Add read replicas or increase connection limit', estimated_cost: '+$50/month for read replica' }] }
            ],
            summary: {
                first_failure_at: dbCapacity,
                failure_component: 'database',
                action_required: true,
                recommendation: 'Immediate action: Add read replicas or increase connection limit'
            },
            timestamp: new Date().toISOString()
        };
    }

    public async generateQuiz(code: string, language: string): Promise<any> {
        // This would call the /quiz/generate endpoint
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

