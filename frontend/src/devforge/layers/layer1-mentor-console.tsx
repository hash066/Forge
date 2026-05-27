import React, { useState, useEffect } from 'react';
import { ArchitectureStore, StoreEvents } from '../store/architecture-store';
import { FeedbackItem } from '../types';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export class MentorConsolePanel {
    constructor(private store: ArchitectureStore) { }

    register(): void {
        // No-op: rendered via React overlay
    }
}

interface MentorContentProps {
    store: ArchitectureStore;
}

const SeverityBadge: React.FC<{ severity: FeedbackItem['severity'] }> = ({ severity }) => {
    switch (severity) {
        case 'critical':
            return <Badge variant="destructive">Critical</Badge>;
        case 'warning':
            return <Badge variant="secondary">Warning</Badge>;
        case 'info':
            return <Badge variant="outline">Info</Badge>;
        default:
            return null;
    }
};

export const MentorContent: React.FC<MentorContentProps> = ({ store }) => {
    const [feedback, setFeedback] = useState<FeedbackItem[]>(store.getFeedback());

    useEffect(() => {
        const unsubscribe = store.subscribe(StoreEvents.feedbackUpdated, (newFeedback: FeedbackItem[]) => {
            setFeedback(newFeedback);
        });
        return unsubscribe;
    }, [store]);

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-sm">Design Mentor Feedback</h3>
            <ScrollArea className="h-[300px] pr-4">
                {feedback.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-4">No feedback yet. Keep designing!</p>
                ) : (
                    <div className="space-y-4">
                        {feedback.map((item) => (
                            <div key={item.id} className="space-y-1.5 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-medium text-sm leading-none">{item.title}</span>
                                    <SeverityBadge severity={item.severity} />
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {item.description}
                                </p>
                                <p className="text-xs italic text-blue-400/80">
                                    <span className="font-semibold not-italic text-blue-400">Recommendation:</span> {item.recommendation}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};
