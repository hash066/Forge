import {
    ArchitectureDefinition,
    Blueprint,
    RiskScores,
    FeedbackItem,
    DriftResult,
    ValidationResult
} from '../types';

export const StoreEvents = {
    architectureLoaded: 'architectureLoaded',
    blueprintUpdated: 'blueprintUpdated',
    scoresUpdated: 'scoresUpdated',
    feedbackUpdated: 'feedbackUpdated',
    driftUpdated: 'driftUpdated',
    validationUpdated: 'validationUpdated',
    architectureApproved: 'architectureApproved',
} as const;

export class ArchitectureStore {
    private architectureDefinition: ArchitectureDefinition | null = null;
    private blueprint: Blueprint | null = null;
    private scores: RiskScores = {
        scalability: 0,
        overengineering: 0,
        security: 0,
        consistency: 0
    };
    private feedbackItems: FeedbackItem[] = [];
    private driftResult: DriftResult | null = null;
    private validationResult: ValidationResult | null = null;
    private budgetCap: number = 20000;
    private trend: 'improving' | 'declining' | 'stable' = 'stable';
    private listeners: Map<string, Set<Function>> = new Map();

    /**
     * Load ArchitectureDefinition from API, with hardcoded fallback
     */
    async loadArchitectureDefinition(apiClient?: any): Promise<void> {
        try {
            if (apiClient) {
                this.architectureDefinition = await apiClient.loadArchitecture();
            } else {
                this.architectureDefinition = this.getDefaultArchitecture();
            }
        } catch (error) {
            console.warn('Failed to load architecture from API, using default:', error);
            this.architectureDefinition = this.getDefaultArchitecture();
        }

        this.emit(StoreEvents.architectureLoaded, this.architectureDefinition);
    }

    private getDefaultArchitecture(): ArchitectureDefinition {
        return {
            id: 'default-arch',
            name: 'Standard Microservices Web App',
            expectedScale: 10000,
            architectureType: 'microservices',
            constraints: [
                {
                    id: 'c1',
                    text: 'Shared database between services is forbidden.',
                    severity: 'critical',
                    category: 'communication'
                },
                {
                    id: 'c2',
                    text: 'Front-end must not call Database directly.',
                    severity: 'critical',
                    category: 'layer_boundary'
                }
            ],
            approved: false,
            createdAt: new Date()
        };
    }

    getArchitectureDefinition(): ArchitectureDefinition | null {
        return this.architectureDefinition;
    }

    setBlueprint(blueprint: Blueprint): void {
        this.blueprint = blueprint;
        this.emit(StoreEvents.blueprintUpdated, this.blueprint);
    }

    getBlueprint(): Blueprint | null {
        return this.blueprint;
    }

    updateScores(scores: RiskScores): void {
        this.scores = { ...scores };
        this.emit(StoreEvents.scoresUpdated, this.scores);
    }

    getScores(): RiskScores {
        return this.scores;
    }

    addFeedback(item: FeedbackItem): void {
        this.feedbackItems.push(item);
        this.emit(StoreEvents.feedbackUpdated, [...this.feedbackItems]);
    }

    getFeedback(): FeedbackItem[] {
        return [...this.feedbackItems];
    }

    removeFeedback(id: string): void {
        this.feedbackItems = this.feedbackItems.filter(item => item.id !== id);
        this.emit(StoreEvents.feedbackUpdated, [...this.feedbackItems]);
    }

    setDriftResult(result: DriftResult): void {
        this.driftResult = result;
        this.emit(StoreEvents.driftUpdated, this.driftResult);
    }

    getDriftResult(): DriftResult | null {
        return this.driftResult;
    }

    setValidationResult(result: ValidationResult): void {
        this.validationResult = result;
        this.emit(StoreEvents.validationUpdated, this.validationResult);
    }

    getValidationResult(): ValidationResult | null {
        return this.validationResult;
    }

    approveArchitecture(): void {
        if (this.architectureDefinition) {
            this.architectureDefinition.approved = true;
            this.emit(StoreEvents.architectureApproved, this.architectureDefinition);
        }
    }

    getEstimatedCost(): number {
        return this.blueprint?.estimatedMonthlyCost ?? 0;
    }

    getBudgetCap(): number {
        return this.budgetCap;
    }

    setBudgetCap(cap: number): void {
        this.budgetCap = cap;
        this.emit(StoreEvents.blueprintUpdated, this.blueprint);
    }

    getTrend(): 'improving' | 'declining' | 'stable' {
        return this.trend;
    }

    setTrend(trend: 'improving' | 'declining' | 'stable'): void {
        this.trend = trend;
        this.emit(StoreEvents.blueprintUpdated, this.blueprint);
    }

    /**
     * Subscribe to store events
     */
    subscribe(event: string, cb: Function): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(cb);

        return () => {
            const eventListeners = this.listeners.get(event);
            if (eventListeners) {
                eventListeners.delete(cb);
                if (eventListeners.size === 0) {
                    this.listeners.delete(event);
                }
            }
        };
    }

    /**
     * Internal event emitter
     */
    private emit(event: string, data?: unknown): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(cb => cb(data));
        }
    }
}
