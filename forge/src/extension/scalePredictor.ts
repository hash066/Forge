import { Blueprint } from '../shared/types';

export interface ScaleFailurePoint {
    userThreshold: number;
    componentId: string;
    reason: string;
    fix: string;
}

export class ScalePredictor {
    /**
     * Analyzes architecture for potential bottlenecks at scale.
     */
    public predictFailurePoints(blueprint: Blueprint): ScaleFailurePoint[] {
        const failurePoints: ScaleFailurePoint[] = [];

        // Simple mock capacity analysis
        const isMonolith = blueprint.constraints.architectureType === 'monolith';
        const budget = blueprint.constraints.budget;

        if (isMonolith) {
            failurePoints.push({
                userThreshold: 50000,
                componentId: 'monolith-core',
                reason: 'System fails at 50K users due to DB connection exhaustion and horizontal scaling limits of monolithic core.',
                fix: 'Implement database connection pooling and consider splitting core services into microservices for independent scaling.'
            });
        }

        if (budget < 100) {
            failurePoints.push({
                userThreshold: 5000,
                componentId: 'infrastructure',
                reason: 'Network throughput throttled at 5K users due to low-tier instance limits (budget constraint).',
                fix: 'Increase budget or implement heavy CDN caching to reduce origin load.'
            });
        }

        const database = blueprint.components.find(c => c.type === 'database');
        if (database && database.technology.toLowerCase().includes('sql')) {
            failurePoints.push({
                userThreshold: 100000,
                componentId: database.id,
                reason: 'Write latency spikes at 100K users due to lack of read replicas and single-node primary write bottleneck.',
                fix: 'Add Amazon Aurora Read Replicas or implement a caching layer like Redis.'
            });
        }

        return failurePoints;
    }
}
