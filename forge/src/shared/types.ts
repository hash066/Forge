export interface Constraints {
    scale: 'startup' | 'enterprise' | 'global';
    budget: number;
    teamSize: number;
    architectureType: 'monolith' | 'microservices' | 'serverless';
    // Extended fields for form/analysis
    currentUsers?: number;
    projectedUsers?: number;
    peakLoad?: number;
    deploymentFrequency?: string;
    domain?: string;
}

export interface Component {
    id: string;
    type: string;
    name: string;
    technology: string;
}

export interface Connection {
    source: string;
    target: string;
    type: string;
}

export interface Blueprint {
    constraints: Constraints;
    components: Component[];
    connections: Connection[];
    version: string;
}

export interface RiskScores {
    security: number;
    scalability: number;
    cost: number;
    overengineering: number;
}

export interface Violation {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    line?: number;
    description: string;
    fix: string;
}
