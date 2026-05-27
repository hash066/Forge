import React, { useState, useEffect } from 'react';
import { ArchitectureStore, StoreEvents } from '../store/architecture-store';
import { RiskScores } from '../types';
import { Progress } from "@/components/ui/progress";

export class RiskScorePanel {
    constructor(private store: ArchitectureStore) { }

    register(): void {
        // No-op: rendered via React overlay
    }
}

interface RiskPanelContentProps {
    store: ArchitectureStore;
}

const getScoreColor = (score: number) => {
    if (score < 40) return 'bg-green-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-red-500';
};

export const RiskPanelContent: React.FC<RiskPanelContentProps> = ({ store }) => {
    const [scores, setScores] = useState<RiskScores>(store.getScores());

    useEffect(() => {
        const unsubscribe = store.subscribe(StoreEvents.scoresUpdated, (newScores: RiskScores) => {
            setScores(newScores);
        });
        return unsubscribe;
    }, [store]);

    const rows: { label: string, key: keyof RiskScores }[] = [
        { label: 'Scalability', key: 'scalability' },
        { label: 'Overengineering', key: 'overengineering' },
        { label: 'Security', key: 'security' },
        { label: 'Consistency', key: 'consistency' },
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-sm">Architecture Risk Scores</h3>
            {rows.map(({ label, key }) => {
                const value = scores[key];
                return (
                    <div key={key} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-mono font-medium">{value}%</span>
                        </div>
                        <Progress
                            value={value}
                            className="h-1.5"
                            indicatorClassName={getScoreColor(value)}
                        />
                    </div>
                );
            })}
        </div>
    );
};
