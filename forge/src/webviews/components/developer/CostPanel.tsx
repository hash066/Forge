import React from 'react';
import { DollarSign, Lightbulb } from 'lucide-react';

interface CostPanelProps {
    costEstimate: number;
    onAction: (action: string, value?: any) => void;
}

export const CostPanel: React.FC<CostPanelProps> = ({ costEstimate, onAction }) => {
    const budget = 100;
    const percentUsed = Math.min(100, Math.round((costEstimate / budget) * 100));
    
    // Simulate a breakdown based on the total estimate
    const breakdown = [
        { name: 'RDS (db.t3.micro)', amount: costEstimate * 0.39, pct: 39 },
        { name: 'EC2 (t3.small)', amount: costEstimate * 0.32, pct: 32 },
        { name: 'ElastiCache (Redis)', amount: costEstimate * 0.18, pct: 18 },
        { name: 'S3 (storage + requests)', amount: costEstimate * 0.07, pct: 7 },
        { name: 'Lambda (1M invoc)', amount: costEstimate * 0.04, pct: 4 }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Main Header */}
            <div className="bg-bg border border-border p-4">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <h2 className="text-[9px] font-black uppercase text-fg/40 tracking-widest flex items-center gap-1 mb-1">
                            Resource Burn Rate
                        </h2>
                        <div className="text-2xl font-black text-fg">${costEstimate.toFixed(2)}<span className="text-[10px] text-fg/40 font-mono ml-1">/MO</span></div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] uppercase font-black text-fg/40 tracking-widest">Quota: $100.00</div>
                        <div className={`text-[9px] font-black tracking-widest uppercase ${percentUsed > 80 ? 'text-red-500' : 'text-fg/40'}`}>{percentUsed}% CAP</div>
                    </div>
                </div>
                
                <div className="h-1 w-full bg-border overflow-hidden">
                    <div 
                        className={`h-full ${percentUsed > 80 ? 'bg-red-500' : 'bg-btn-bg'}`} 
                        style={{ width: `${percentUsed}%` }} 
                    />
                </div>
            </div>

            {/* Breakdown */}
            <section>
                <h3 className="text-[9px] font-black uppercase text-fg/40 mb-4 tracking-widest">Service Allocation Analysis</h3>
                <div className="space-y-4">
                    {breakdown.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-end text-[9px]">
                                <span className="font-black text-fg/60 uppercase tracking-tight">{item.name}</span>
                                <span className="text-fg/40 font-mono">${item.amount.toFixed(2)} <span className="opacity-50">({item.pct}%)</span></span>
                            </div>
                            <div className="h-1 w-full bg-border overflow-hidden">
                                <div className="h-full bg-fg/20" style={{ width: `${item.pct}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Suggestions */}
            <section className="bg-header/10 border border-border p-4">
                <h3 className="text-[9px] font-black uppercase text-fg/40 mb-3 tracking-widest flex items-center gap-2">
                    Optimization Logic
                </h3>
                <ul className="space-y-2 text-[10px] font-bold text-fg/60 uppercase tracking-tight">
                    <li className="flex gap-2 items-start opacity-80">
                        <span className="text-btn-bg font-black">[ADVICE]</span> Reserve instance migration identified: -$5.50/mo
                    </li>
                    <li className="flex gap-2 items-start opacity-80">
                        <span className="text-btn-bg font-black">[ADVICE]</span> Lifecycle policy optimization: -$1.20/mo
                    </li>
                </ul>
            </section>

            <div className="flex gap-2">
                <button className="flex-1 py-2 bg-btn-bg hover:bg-btn-hover text-btn-fg text-[9px] font-black uppercase border border-border tracking-widest transition-all">
                    Configure Alert
                </button>
                <button
                    onClick={() => onAction('generateReport')}
                    className="flex-1 py-1.5 border border-border hover:bg-header/10 text-fg/40 hover:text-fg text-[9px] font-black uppercase tracking-widest transition-all"
                >
                    Generate Report
                </button>
            </div>
        </div>
    );
};
