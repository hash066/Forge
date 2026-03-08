import React from 'react';
import { TrendingUp, Users, ServerCrash, CheckCircle2 } from 'lucide-react';
import { ScaleFailurePoint } from '../../../extension/scalePredictor';

interface ScalePanelProps {
    scaleFailures: ScaleFailurePoint[];
}

export const ScalePanel: React.FC<ScalePanelProps> = ({ scaleFailures }) => {
    // Generate an artificial timeline combining healthy states and failure states
    const generateTimeline = () => {
        const failureThresholds = scaleFailures.map(f => f.userThreshold);
        const minFailure = failureThresholds.length > 0 ? Math.min(...failureThresholds) : Number.MAX_SAFE_INTEGER;
        
        const timeline: { threshold: number; status: 'healthy' | 'failure'; msg: string; component?: string; fix?: string }[] = [];
        
        // Add healthy milestones before the first failure
        if (minFailure > 1000) timeline.push({ threshold: 1000, status: 'healthy', msg: 'All systems normal' });
        if (minFailure > 5000) timeline.push({ threshold: 5000, status: 'healthy', msg: 'Scale nominal' });
        
        // Add the failures
        scaleFailures.forEach(f => {
            timeline.push({ 
                threshold: f.userThreshold, 
                status: 'failure', 
                component: f.componentId,
                msg: f.reason,
                fix: f.fix
            });
        });

        return timeline.sort((a, b) => a.threshold - b.threshold);
    };

    const timeline = generateTimeline();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <header className="bg-bg border border-border p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-[9px] font-black uppercase text-fg/40 tracking-widest flex items-center gap-2 mb-1">
                        Infrastructure Load Analysis
                    </h2>
                    <div className="text-2xl font-black text-fg flex items-center gap-2 tracking-tighter">
                        1,024 <span className="text-[10px] text-fg/40 font-mono mt-1 opacity-60">SESSIONS_ACTIVE</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black text-btn-bg uppercase tracking-widest border border-btn-bg/30 px-2 py-1">STATUS::NOMINAL</span>
                </div>
            </header>

            <section>
                <h3 className="text-[9px] font-black uppercase text-fg/40 mb-4 tracking-widest">Scaling Vector Projections</h3>
                
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border">
                    {timeline.map((step, index) => (
                        <div key={index} className="relative flex items-start justify-between mb-6 group">
                            {/* Icon marker */}
                            <div className={`z-10 flex items-center justify-center w-8 h-8 border-2 border-bg shrink-0 ${step.status === 'healthy' ? 'bg-header/20' : 'bg-red-500'}`}>
                                {step.status === 'healthy' ? <div className="w-1.5 h-1.5 bg-fg/20" /> : <div className="w-1.5 h-1.5 bg-bg animate-pulse" />}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 ml-4 bg-bg border border-border p-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-tightest ${step.status === 'healthy' ? 'text-fg/60' : 'text-red-500'}`}>
                                        {(step.threshold / 1000).toFixed(0)}K SESSIONS
                                    </span>
                                    <span className="text-[8px] font-black text-fg/20 uppercase tracking-tighter">VECTOR::{step.status.toUpperCase()}</span>
                                </div>
                                
                                {step.status === 'healthy' ? (
                                    <p className="text-[10px] text-fg/40 font-bold uppercase tracking-tight">{step.msg}</p>
                                ) : (
                                    <div className="space-y-2 mt-2">
                                        <div className="text-[10px] font-bold text-fg/80 uppercase tracking-tight">
                                            <span className="text-red-500 font-black mr-2">BLOCK:</span> {step.msg}
                                        </div>
                                        <div className="text-[9px] font-bold text-fg/40 bg-header/10 p-2 border border-border border-l-2 border-l-btn-bg">
                                            <span className="text-btn-bg font-black mr-2">REMEDY:</span> {step.fix}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <button className="w-full py-2.5 bg-btn-bg hover:bg-btn-hover text-btn-fg text-[10px] font-black uppercase tracking-widest transition-all shadow-md">
                Initialize Stress Protocol
            </button>
        </div>
    );
};
