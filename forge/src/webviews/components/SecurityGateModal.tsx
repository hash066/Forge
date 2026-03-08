import React from 'react';
import { Violation } from '../../shared/types';

interface SecurityGateModalProps {
    violations: Violation[];
    onFixAll: () => void;
    onFixManually: () => void;
}

const SecurityGateModal: React.FC<SecurityGateModalProps> = ({ violations, onFixAll, onFixManually }) => {
    if (violations.length === 0) return null;

    // Highest severity violations first
    const sortedViolations = [...violations].sort((a, b) => {
        const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
        return (severityMap[b.severity] || 0) - (severityMap[a.severity] || 0);
    });

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg/95 backdrop-blur-sm p-6 overflow-hidden">
            <div className="bg-bg border border-red-500/50 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <header className="p-6 border-b border-red-500/30 bg-red-500/5 text-center">
                    <h2 className="text-[14px] font-black text-red-500 uppercase tracking-widest">
                        System Security Exception
                    </h2>
                    <p className="text-fg/40 text-[9px] mt-2 font-bold uppercase tracking-widest">
                        Security violations detected. CI/CD Pipeline Blocked.
                    </p>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sortedViolations.map((v, i) => (
                        <div key={i} className="bg-header/10 border border-border p-4 transition-all hover:border-red-500/50 group">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 ${
                                    v.severity === 'critical' ? 'bg-red-500 text-bg' : 'border border-red-500 text-red-500'
                                }`}>
                                    {v.severity}
                                </span>
                                {v.line && <span className="text-[9px] text-fg/20 font-mono tracking-tighter">LINE::{v.line}</span>}
                            </div>
                            <h3 className="text-[11px] font-bold text-fg/80 uppercase tracking-tight">
                                {v.description}
                            </h3>
                            <div className="mt-3 p-3 bg-bg border border-border text-[10px] text-fg/60 font-mono border-l-2 border-l-red-500">
                                <span className="text-red-500 font-black mr-2 uppercase">Resolution:</span> {v.fix}
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="p-6 border-t border-border bg-header/20 flex flex-col gap-2">
                    <button 
                        onClick={onFixAll}
                        className="w-full py-3 bg-red-500 hover:bg-red-600 text-bg text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:translate-y-0.5"
                    >
                        Initialize Auto-Remediation
                    </button>
                    <button 
                        onClick={onFixManually}
                        className="w-full py-3 border border-border hover:bg-header/10 text-fg/40 hover:text-fg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        Manual Protocol Correction
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SecurityGateModal;
