/**
 * Core type definitions for DevForge Architecture Enforcement System
 */

export interface SystemConstraint {
    id: string;
    text: string;
    severity: 'critical' | 'warning' | 'info';
    category: 'communication' | 'performance' | 'layer_boundary' | 'security';
}

export interface ArchitectureDefinition {
    id: string;
    name: string;
    expectedScale: number;
    architectureType: 'monolith' | 'microservices';
    constraints: SystemConstraint[];
    approved: boolean;
    createdAt: Date;
}

export interface Component {
    name: string;
    type: 'service' | 'layer' | 'gateway' | 'cache' | 'database';
    responsibilities: string[];
}

export interface CommunicationPattern {
    protocol: 'REST' | 'gRPC' | 'Function_Call' | 'Message_Queue';
    description: string;
}

export interface Blueprint {
    id: string;
    architectureType: 'monolith' | 'microservices';
    expectedScale: number;
    components: Component[];
    communicationPatterns: CommunicationPattern[];
    constraints: SystemConstraint[];
    estimatedMonthlyCost: number;
    createdAt: Date;
}

export interface Violation {
    constraintId: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
}

export interface ValidationResult {
    passed: boolean;
    violations: Violation[];
    timestamp: Date;
}

export interface Drift {
    type: 'undefined_component' | 'invalid_communication' | 'layer_violation';
    description: string;
    severity: 'critical' | 'warning';
}

export interface DriftResult {
    hasDrift: boolean;
    drifts: Drift[];
    driftScore: number;
    timestamp: Date;
}

export interface RiskScores {
    scalability: number;
    overengineering: number;
    security: number;
    consistency: number;
}

export interface FeedbackItem {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    recommendation: string;
    timestamp: Date;
}

export interface GateResult {
    triggered: boolean;
    type: 'security' | 'cost' | 'deployment_risk';
    message: string;
    suggestion: string;
    canOverride: boolean;
}

/**
 * Panel State Interfaces for Layer 1
 */

export interface RiskScorePanelState {
    scores: RiskScores;
    trend: 'improving' | 'declining' | 'stable';
}

export interface MentorConsolePanelState {
    items: FeedbackItem[];
    filter: 'all' | 'critical' | 'warning' | 'info';
}

export interface CostTickerState {
    estimatedCost: number;
    budgetCap: number;
    currency: string;
}
