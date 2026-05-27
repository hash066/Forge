import React, { useState, useEffect } from 'react';
import { ArchitectureStore, StoreEvents } from '../store/architecture-store';
import { RiskScores, FeedbackItem } from '../types';
import {
    ShieldAlert,
    MessageSquare,
    DollarSign,
    Lock
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskPanelContent } from './layer1-risk-panel';
import { MentorContent } from './layer1-mentor-console';

interface DevForgeOverlayProps {
    store: ArchitectureStore;
}

export const DevForgeOverlay: React.FC<DevForgeOverlayProps> = ({ store }) => {
    const [scores, setScores] = useState<RiskScores>(store.getScores());
    const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(store.getFeedback());
    const [cost, setCost] = useState<number>(store.getEstimatedCost());
    const [budgetCap, setBudgetCap] = useState<number>(store.getBudgetCap());
    const [trend, setTrend] = useState<'improving' | 'declining' | 'stable'>(store.getTrend());

    useEffect(() => {
        const unsubScores = store.subscribe(StoreEvents.scoresUpdated, (newScores: RiskScores) => {
            setScores(newScores);
        });
        const unsubFeedback = store.subscribe(StoreEvents.feedbackUpdated, (newFeedback: FeedbackItem[]) => {
            setFeedbackItems(newFeedback);
        });
        const unsubBlueprint = store.subscribe(StoreEvents.blueprintUpdated, () => {
            setCost(store.getEstimatedCost());
            setBudgetCap(store.getBudgetCap());
            setTrend(store.getTrend());
        });

        return () => {
            unsubScores();
            unsubFeedback();
            unsubBlueprint();
        };
    }, [store]);

    const maxRisk = Math.max(...Object.values(scores));
    const hasCriticalFeedback = feedbackItems.some(f => f.severity === 'critical');

    return (
        <div className="fixed right-5 top-5 z-50 flex flex-col gap-2 p-3 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl">
            {/* Risk Launcher */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-white/10">
                        <ShieldAlert className="h-5 w-5 text-blue-400" />
                        {maxRisk > 0 && (
                            <Badge
                                variant={maxRisk >= 70 ? "destructive" : "secondary"}
                                className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px]"
                            >
                                {maxRisk}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 bg-black/90 border-white/20 backdrop-blur-xl">
                    <RiskPanelContent store={store} />
                </PopoverContent>
            </Popover>

            {/* Mentor Launcher */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-white/10">
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                        {feedbackItems.length > 0 && (
                            <Badge
                                variant={hasCriticalFeedback ? "destructive" : "secondary"}
                                className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px]"
                            >
                                {feedbackItems.length}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-80 bg-black/90 border-white/20 backdrop-blur-xl">
                    <MentorContent store={store} />
                </PopoverContent>
            </Popover>

            {/* Cost Launcher */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-white/10">
                        <DollarSign className="h-5 w-5 text-green-400" />
                        <Badge variant="secondary" className="absolute -top-1 -right-1 px-1 h-[18px] text-[10px]">
                            ${cost}
                        </Badge>
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-56 bg-black/90 border-white/20 backdrop-blur-xl">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm">Estimated Monthly Cost</h3>
                        <div className="flex justify-between items-baseline">
                            <span className="text-2xl font-bold text-green-400">${cost}</span>
                            <span className="text-xs text-muted-foreground">/ month</span>
                        </div>
                        <div className="pt-2 border-t border-white/10">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Budget Cap</span>
                                <span>${budgetCap.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Trend</span>
                                <span className={trend === 'improving' ? 'text-green-400' : trend === 'declining' ? 'text-red-400' : 'text-yellow-400'}>
                                    {trend.charAt(0).toUpperCase() + trend.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Gates Launcher */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-white/10">
                        <Lock className="h-5 w-5 text-orange-400" />
                        <Badge variant="outline" className="absolute -top-1 -right-1 px-1 h-[18px] text-[10px] bg-black text-orange-400 border-orange-400/50">
                            ON
                        </Badge>
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-64 bg-black/90 border-white/20 backdrop-blur-xl">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-orange-400">Critical Gates Active</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Design boundaries and critical thresholds are being monitored. Violations will trigger blockages.
                        </p>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
