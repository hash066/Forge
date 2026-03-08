import React from 'react';
import { Network, AlertTriangle, CheckCircle2, Lightbulb, ExternalLink } from 'lucide-react';

interface PatternsPanelProps {
    patterns: any[];
}

export const PatternsPanel: React.FC<PatternsPanelProps> = ({ patterns }) => {
    const displayPatterns = patterns;

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle size={14} className="text-amber-500" />;
            case 'success': return <CheckCircle2 size={14} className="text-btn-bg" />;
            case 'info': return <Lightbulb size={14} className="text-btn-bg" />;
            default: return <Network size={14} className="text-fg/20" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <header className="bg-header/10 border border-border p-4 flex items-center gap-3">
                <div className="p-2 bg-btn-bg/5 border border-btn-bg/20">
                    <Network size={16} className="text-btn-bg" />
                </div>
                <div>
                    <h2 className="text-[9px] font-black uppercase text-fg/40 tracking-widest">Analytics Interface</h2>
                    <p className="text-[10px] font-bold text-fg/60">Computational complexity audit report</p>
                </div>
            </header>

            <section>
                <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                    <h3 className="text-[9px] font-black uppercase text-fg/40 tracking-tightest">
                        Identified Structures ({displayPatterns.length})
                    </h3>
                </div>
                
                <div className="space-y-3">
                    {displayPatterns.length === 0 ? (
                        <div className="p-8 border border-dashed border-border text-center">
                            <span className="text-[10px] font-bold text-fg/20 uppercase tracking-widest">No patterns detected in current scope</span>
                        </div>
                    ) : displayPatterns.map((p, idx) => (
                        <div key={idx} className="bg-header/5 border border-border p-4 relative overflow-hidden group hover:border-fg/20 transition-colors">
                            <div className="flex items-start gap-2 mb-3">
                                <div className="mt-0.5">{getIcon(p.type)}</div>
                                <div className="flex-1">
                                    <h4 className="text-[10px] font-black tracking-widest uppercase text-fg/80">
                                        {p.pattern || p.title}
                                    </h4>
                                    <div className="text-[9px] text-fg/40 font-bold mt-0.5 uppercase">
                                        REF: <span className="text-fg/60 font-mono tracking-tighter">{p.file || 'SOURCE'}::{p.line || 'global'}</span>
                                    </div>
                                </div>
                                <div className="text-[9px] font-black bg-header/20 px-1.5 py-0.5 border border-border text-fg/40 uppercase tracking-tighter">
                                    {p.complexity}
                                </div>
                            </div>

                            {/* Practice Vectors */}
                            <div className="mt-4 bg-bg border border-border p-3">
                                <h5 className="text-[8px] font-black uppercase text-fg/40 tracking-widest mb-2 border-b border-border pb-1">Recommended Practice Vectors</h5>
                                <ul className="space-y-2">
                                    {(p.leetcode_problems || p.problems || []).map((prob: any, j: number) => (
                                        <li key={j} className="text-[10px]">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <a 
                                                    href={prob.url || `https://leetcode.com/problems/${(prob.name || prob.title).toLowerCase().replace(/ /g, '-')}`} 
                                                    target="_blank" 
                                                    className="text-btn-bg hover:underline font-bold flex items-center gap-1 transition-colors"
                                                >
                                                    {prob.name || prob.title} <ExternalLink size={8} />
                                                </a>
                                                <span className="text-[8px] uppercase tracking-tighter text-fg/20 font-black">
                                                    {prob.diff || prob.difficulty}
                                                </span>
                                            </div>
                                            {(prob.details || prob.suggestion) && <span className="text-[9px] text-fg/40 block leading-tight">{prob.details || prob.suggestion}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-3 flex items-start gap-2 text-[9px] text-fg/60 font-bold bg-header/5 p-2 border-l-2 border-l-amber-500/50">
                                <Lightbulb size={10} className="text-amber-500 mt-0.5 opacity-60" />
                                <span>{p.suggestion}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
