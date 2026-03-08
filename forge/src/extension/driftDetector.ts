import { Blueprint, Violation } from '../shared/types';

export class DriftDetector {
    /**
     * Detects architectural drift by comparing the code content against the blueprint.
     * @param blueprint The target architecture blueprint
     * @param code The current code content
     * @param fileName The name of the file being analyzed
     */
    public detectDrift(blueprint: Blueprint, code: string, fileName: string): Violation[] {
        const violations: Violation[] = [];

        // 1. Check for Unauthorized Technologies
        // This is a simple mock implementation using keywords
        blueprint.components.forEach(component => {
            // For example, if the blueprint says 'PostgreSQL' but the code uses 'MongoDB'
            if (fileName.includes('db') || fileName.includes('repository')) {
                if (code.includes('mongoose') || code.includes('mongodb')) {
                    const tech = component.technology.toLowerCase();
                    if (!tech.includes('mongo')) {
                        violations.push({
                            type: 'drift',
                            severity: 'high',
                            description: `Database drift: Code uses MongoDB but Blueprint specifies ${component.technology}`,
                            fix: `Migrate to ${component.technology} or update the Blueprint`
                        });
                    }
                }
            }
        });

        // 2. Check Protocols
        if (code.includes('axios') || code.includes('fetch')) {
            const hasRest = blueprint.connections.some(c => c.type.toLowerCase().includes('http') || c.type.toLowerCase().includes('rest'));
            if (!hasRest) {
                 violations.push({
                    type: 'protocol',
                    severity: 'medium',
                    description: 'Protocol drift: Found HTTP/REST usage, but Blueprint specifies gRPC/GraphQL',
                    fix: 'Use the blueprint-approved communication protocol'
                });
            }
        }

        // 3. Check for unauthorized services/imports
        if (code.includes('aws-sdk') && !blueprint.components.some(c => c.technology.toLowerCase().includes('aws'))) {
            violations.push({
                type: 'security',
                severity: 'medium',
                description: 'Unauthorized Service: AWS SDK detected but not authorized in blueprint constraints',
                fix: 'Remove unauthorized cloud dependency or add to blueprint'
            });
        }

        // 4. ML Pipeline Validator (Stub)
        if (fileName.endsWith('.py') && code.includes('train_test_split')) {
            if (code.includes('StandardScaler') && code.indexOf('StandardScaler') < code.indexOf('train_test_split')) {
                violations.push({
                    type: 'vulnerability',
                    severity: 'critical',
                    description: 'ML Pipeline Data Leakage: Scaler fitted before train/test split.',
                    fix: 'Fit the scaler ON THE TRAINING DATA ONLY after the split.'
                });
            }
        }

        return violations;
    }

    public calculateDriftScore(violations: Violation[]): number {
        if (violations.length === 0) {
            return 0;
        }
        // Simple score Calculation: 10% per violation, capped at 100%
        return Math.min(violations.length * 0.1, 1.0);
    }
}
