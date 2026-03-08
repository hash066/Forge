import React from 'react';
import { Shield, Activity, Settings, GitCommit, AlertTriangle, AlertCircle } from 'lucide-react';
import { RiskScores, Violation } from '../../../shared/types';

interface DeveloperDashboardProps {
    riskScores: RiskScores;
    violations: Violation[];
    costEstimate: number;
    hasBlueprint: boolean;
    onAction: (action: string) => void;
}

const colorMap = (score: number, invert = false) => {
    const percentage = score * 100;
    const isBad = invert ? percentage > 60 : percentage < 40;
    const isWarn = invert ? percentage > 30 : percentage < 70;
    
    if (isBad) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (isWarn) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-fg/60 bg-bg border-border';
};

const barColor = (score: number, invert = false) => {
    const percentage = score * 100;
    const isBad = invert ? percentage > 70 : percentage < 30;
    const isWarn = invert ? percentage > 40 : percentage < 60;
    if (isBad) return 'bg-red-500';
    if (isWarn) return 'bg-amber-500';
    return 'bg-btn-bg';
};

// New ScoreCard props and internal logic based on the provided snippet
const ScoreCard = ({ type, label, score }: { type: string, label: string, score: number }) => {
    const percentage = Math.round(score * 100);

    let Icon;
    let colorClass = { text: '', bg: '' };
    let invert = false;

    switch (type) {
        case 'security':
            Icon = Shield;
            colorClass = { text: 'text-btn-bg', bg: 'bg-btn-bg' };
            break;
        case 'scalability':
            Icon = Activity;
            colorClass = { text: 'text-fg/40', bg: 'bg-fg/40' };
            break;
        case 'cost':
            Icon = Settings;
            colorClass = { text: 'text-fg/40', bg: 'bg-fg/40' };
            invert = true;
            break;
        case 'consistency':
            Icon = GitCommit;
            colorClass = { text: 'text-fg/40', bg: 'bg-fg/40' };
            break;
        default:
            Icon = AlertTriangle;
            colorClass = { text: 'text-fg/60', bg: 'bg-fg/60' };
    }

    const bar = barColor(score, invert);
    
    return (
        <div className="bg-[#1a1a1a] border border-[#2b2b2b] p-4 transition-all hover:bg-[#1f1f1f] cursor-pointer rounded-xl">
            <div className="flex justify-between items-start mb-3">
                <h4 className="text-[11px] font-bold text-text-dim tracking-tight">{label}</h4>
                <div className="p-1.5 bg-[#252525] rounded-lg">
                    <Icon size={14} className={colorClass.text} />
                </div>
            </div>
            <div className="text-2xl font-bold text-white mb-3 tracking-tight">{percentage}%</div>
            <div className="h-1.5 w-full bg-[#252525] rounded-full overflow-hidden">
                <div className={`h-full ${bar} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
};

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ riskScores, violations, costEstimate, hasBlueprint, onAction }) => {
    const criticalIssues = violations.filter(v => ['critical', 'high'].includes(v.severity.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Architecture Health */}
            <section>
                <h2 className="text-[12px] font-bold text-white mb-4 tracking-tight flex items-center gap-2">
                    <Activity size={16} className="text-traycer-blue" />
                    Structural Analysis
                </h2>
                {/* Score Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <ScoreCard type="security" label="Security Audit" score={riskScores.security} />
                    <ScoreCard type="scalability" label="Load Factor" score={riskScores.scalability} />
                    <ScoreCard type="cost" label="Resource Cap" score={riskScores.overengineering} />
                    <ScoreCard type="consistency" label="Draft Align" score={0.8} />
                </div>
            </section>

            {/* Critical Issues */}
            <section className="traycer-card bg-[#1a1a1a]/50 p-5 border border-card-border">
                <h3 className="text-[12px] font-bold text-white mb-4 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" /> Active Violations ({violations.length})
                </h3>
                {criticalIssues.length > 0 ? (
                    <div className="space-y-2">
                        {criticalIssues.slice(0, 3).map((v, i) => (
                            <div key={i} className="flex items-start gap-3 text-[13px] bg-[#222] p-3 rounded-lg border border-transparent hover:border-[#333] transition-all">
                                <div className={`w-2 h-2 rounded-full ${v.severity.toLowerCase() === 'critical' ? 'bg-red-500' : 'bg-amber-500'} mt-1.5 shrink-0`} />
                                <div className="flex-1">
                                    <div className="font-bold text-white/90 leading-snug">{v.description}</div>
                                    {v.line && <div className="text-text-dim text-[11px] font-mono mt-1">Line {v.line}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[12px] text-text-dim font-medium italic">
                        System alignment verified. 0 issues detected.
                    </div>
                )}
            </section>

            {/* Cost Summary */}
            <section className="traycer-card bg-gradient-to-br from-[#1a1a1a] to-[#121212] p-5">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-[11px] font-bold text-text-dim tracking-tight mb-1 uppercase">Resource Burn Rate</h2>
                        <div className="text-3xl font-bold text-white tracking-tighter">${costEstimate.toFixed(2)}<span className="text-[14px] text-text-dim font-medium ml-1">/ mo</span></div>
                    </div>
                    <div className="text-[11px] text-text-dim text-right font-bold">
                        <div className="mb-0.5">Quota: $100.00</div>
                        <div className="text-traycer-blue">{Math.round((costEstimate / 100) * 100)}% utilization</div>
                    </div>
                </div>
                <div className="h-2 w-full bg-[#252525] rounded-full overflow-hidden">
                    <div className={`h-full ${costEstimate > 100 ? 'bg-red-500' : 'bg-traycer-blue'} transition-all duration-1000`} style={{ width: `${Math.min(100, (costEstimate / 100) * 100)}%` }} />
                </div>
            </section>

            {/* Actions */}
            <button 
                onClick={() => onAction('showForm')}
                className="w-full py-4 bg-traycer-blue hover:bg-traycer-blue/90 text-white text-[14px] font-bold rounded-xl transition-all shadow-xl active:scale-95"
            >
                {hasBlueprint ? 'Sync Architectural Specs' : 'Initialize System Blueprint'}
            </button>
        </div>
    );
};
