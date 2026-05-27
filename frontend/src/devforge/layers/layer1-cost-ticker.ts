import { ArchitectureStore } from '../store/architecture-store';

export class CostTickerStatusBar {
    constructor(private store: ArchitectureStore) { }

    /**
     * Register the status bar item.
     * In this phase, the actual cost UI is rendered by the DevForgeOverlay React component.
     */
    register(): void {
        // No-op: rendered via React overlay
    }
}
