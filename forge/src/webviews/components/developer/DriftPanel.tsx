import React from 'react';
import { ExternalLink, ShieldAlert, GitMerge, Activity } from 'lucide-react';
import { Violation } from '../../../shared/types';

interface DriftPanelProps {
    violations: Violation[];
    hasBlueprint: boolean;
    onAction: (action: string) => void;
}

export const DriftPanel: React.FC<DriftPanelProps> = ({ violations, hasBlueprint, onAction }) => {
    
    const getSeverityDetails = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return { status: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500/5 border-red-500/30' };
            case 'high': return { status: 'HIGH', color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/30' };
            case 'medium': return { status: 'MEDIUM', color: 'text-fg/40', bg: 'bg-header/5 border-border' };
            default: return { status: 'LOW', color: 'text-fg/20', bg: 'bg-header/5 border-border' };
        }
    };

    const driftScore = violations.length > 0 
        ? Math.max(0, 100 - (violations.length * 15)) 
        : 100;
    
    const circumference = 2 * Math.PI * 24;
    const strokeDashoffset = circumference - (driftScore / 100) * circumference;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest border-b border-border pb-2">
                <div>
                    <span className="text-fg/30 block">Reference</span>
                    <span className="text-fg/60">{hasBlueprint ? 'blueprint-v1.2' : 'Null Reference'}</span>
                </div>
                <div className="text-right">
                    <span className="text-fg/30 block">Verification</span>
                    <span className="text-fg/60">Success</span>
                </div>
            </header>

            {/* Alignment Score */}
            <div className="bg-bg border border-border p-4 flex items-center justify-between relative overflow-hidden">
                <div className="z-10">
                    <h2 className="text-[9px] font-black uppercase text-fg/40 tracking-widest mb-1 flex items-center gap-1">
                        Alignment Matrix
                    </h2>
                    <p className="text-[10px] font-bold text-fg/60 uppercase tracking-tight">Sync Integrity Verified</p>
                </div>
                
                <div className="relative w-14 h-14 flex items-center justify-center z-10">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="28" cy="28" r="24" className="stroke-border" strokeWidth="1" fill="none" />
                        <circle 
                            cx="28" 
                            cy="28" 
                            r="24" 
                            className="stroke-btn-bg transition-all duration-1000 ease-out" 
                            strokeWidth="2" 
                            fill="none" 
                            strokeLinecap="square"
                            style={{ strokeDasharray: circumference, strokeDashoffset }}
                        />
                    </svg>
                    <span className="absolute text-[10px] font-black text-fg/80">{driftScore}%</span>
                </div>
            </div>

            {/* Violations */}
            <section>
                <h2 className="text-[9px] font-black uppercase text-fg/40 mb-3 tracking-widest flex items-center gap-2">
                    Active Deviations ({violations.length})
                </h2>
                
                {!hasBlueprint ? (
                    <div className="text-center p-8 border border-dashed border-border">
                        <p className="text-[9px] text-fg/20 mb-3 uppercase tracking-widest font-black">Null constraints specified</p>
                        <button 
                            onClick={() => onAction('showForm')}
                            className="px-4 py-2 bg-btn-bg hover:bg-btn-hover text-btn-fg text-[9px] font-black tracking-widest uppercase transition-all"
                        >
                            Define System Specs
                        </button>
                    </div>
                ) : violations.length === 0 ? (
                    <div className="bg-header/5 border border-border p-4 text-center">
                        <span className="text-fg/40 font-black text-[9px] uppercase tracking-widest">State: Aligned</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {violations.map((v, i) => {
                            const details = getSeverityDetails(v.severity);
                            return (
                                <div key={i} className={`p-3 border ${details.bg}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${details.color}`}>
                                            {details.status}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-fg/80 font-bold mb-1 uppercase tracking-tight">
                                        {v.description}
                                    </div>
                                    <div className="text-[9px] text-fg/40 font-bold border-l border-border pl-2 ml-1 uppercase">
                                        Resolution: {v.fix}
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button className="flex-1 text-[8px] uppercase font-black tracking-widest py-1.5 border border-border hover:bg-header/10 text-fg/40">
                                            Acknowledge
                                        </button>
                                        <button 
                                            onClick={() => onAction('autoFixSecurity')}
                                            className="flex-1 text-[8px] uppercase font-black tracking-widest py-1.5 bg-btn-bg hover:bg-btn-hover text-btn-fg shadow-md flex items-center justify-center gap-1"
                                        >
                                            Execute Correction
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};
