import React, { useState } from 'react';

interface BlueprintFormProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const BlueprintForm: React.FC<BlueprintFormProps> = ({ onClose, onSubmit }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Scale
        currentUsers: 0,
        projectedUsers: 1000,
        peakLoad: 100,
        // Step 2: Resources
        monthlyBudget: 500,
        teamSize: 3,
        deploymentFrequency: 'weekly',
        // Step 3: Architecture
        architectureType: 'monolith',
        domain: 'web'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: e.target.type === 'number' ? parseFloat(value) : value 
        }));
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 3) {
            onSubmit(formData);
        } else {
            nextStep();
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-fg uppercase tracking-widest opacity-60">Scale Parameters</h3>
                        <div className="space-y-2">
                            <label className="text-[9px] text-fg/40 uppercase font-black tracking-widest">Active Concurrent Users</label>
                            <input 
                                type="number" name="currentUsers" value={formData.currentUsers} onChange={handleChange}
                                className="w-full bg-input-bg border border-input-border px-3 py-2 text-xs focus:border-btn-bg outline-none text-fg font-mono uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] text-fg/40 uppercase font-black tracking-widest">Target Capacity (6M)</label>
                            <input 
                                type="number" name="projectedUsers" value={formData.projectedUsers} onChange={handleChange}
                                className="w-full bg-input-bg border border-input-border px-3 py-2 text-xs focus:border-btn-bg outline-none text-fg font-mono uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] text-fg/40 uppercase font-black tracking-widest">Peak Throughput (REQ/S)</label>
                            <input 
                                type="number" name="peakLoad" value={formData.peakLoad} onChange={handleChange}
                                className="w-full bg-input-bg border border-input-border px-3 py-2 text-xs focus:border-btn-bg outline-none text-fg font-mono uppercase"
                            />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-fg uppercase tracking-widest opacity-60">Resource Allocation</h3>
                        <div className="space-y-2">
                            <label className="text-[9px] text-fg/40 uppercase font-black tracking-widest">Monthly Quota (USD)</label>
                            <input 
                                type="number" name="monthlyBudget" value={formData.monthlyBudget} onChange={handleChange}
                                className="w-full bg-input-bg border border-input-border px-3 py-2 text-xs focus:border-btn-bg outline-none text-fg font-mono uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] text-fg/40 uppercase font-black tracking-widest">Team Velocity (FTE)</label>
                            <input 
                                type="number" name="teamSize" value={formData.teamSize} onChange={handleChange}
                                className="w-full bg-input-bg border border-input-border px-3 py-2 text-xs focus:border-btn-bg outline-none text-fg font-mono uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] text-fg/40 uppercase font-black tracking-widest">Release Cadence</label>
                            <select 
                                name="deploymentFrequency" value={formData.deploymentFrequency} onChange={handleChange}
                                className="w-full bg-input-bg border border-input-border px-3 py-2 text-xs focus:border-btn-bg outline-none text-fg font-bold uppercase"
                            >
                                <option value="daily">CONTINUOUS (DAILY)</option>
                                <option value="weekly">PERIODIC (WEEKLY)</option>
                                <option value="monthly">MILESTONE (MONTHLY)</option>
                            </select>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-fg uppercase tracking-widest opacity-60">System Architecture</h3>
                        <div className="space-y-2">
                            <label className="text-[9px] text-fg/40 uppercase font-black tracking-widest">Architectural Pattern</label>
                            <div className="grid grid-cols-1 gap-1">
                                {['monolith', 'microservices', 'serverless'].map(type => (
                                    <label key={type} className={`flex items-center p-3 border cursor-pointer transition-all ${
                                        formData.architectureType === type ? 'bg-btn-bg/10 border-btn-bg text-fg' : 'border-border text-fg/30 hover:border-fg/10'
                                    }`}>
                                        <input 
                                            type="radio" name="architectureType" value={type} 
                                            checked={formData.architectureType === type} onChange={handleChange} 
                                            className="hidden"
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] text-fg/40 uppercase font-black tracking-widest">System Domain</label>
                            <select 
                                name="domain" value={formData.domain} onChange={handleChange}
                                className="w-full bg-input-bg border border-input-border px-3 py-2 text-xs focus:border-btn-bg outline-none text-fg font-bold uppercase"
                            >
                                <option value="web">PUBLIC WEB APPLICATION</option>
                                <option value="blockchain">DISTRIBUTED LEDGER (WEB3)</option>
                                <option value="ml">AI / MACHINE LEARNING</option>
                                <option value="cybersec">INFRASTRUCTURE SECURITY</option>
                            </select>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center">
            <form onSubmit={handleSubmit} className="w-full max-w-sm bg-bg border border-border shadow-2xl overflow-hidden">
                <header className="p-6 border-b border-border bg-header/20">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[11px] font-black text-fg uppercase tracking-widest opacity-60">Blueprint Integration</h2>
                        <button type="button" onClick={onClose} className="text-fg/30 hover:text-fg font-mono text-[10px] uppercase">ESC</button>
                    </div>
                    {/* Progress Bar */}
                    <div className="flex gap-1.5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1 flex-1 transition-all ${step >= i ? 'bg-btn-bg' : 'bg-border'}`} />
                        ))}
                    </div>
                </header>

                <div className="p-6">
                    {renderStep()}
                </div>

                <footer className="p-6 border-t border-border bg-header/20 flex justify-between gap-2">
                    {step > 1 && (
                        <button 
                            type="button" onClick={prevStep}
                            className="flex-1 py-3 px-4 border border-border text-fg/40 font-black text-[10px] uppercase hover:bg-header/10 transition-all shadow-sm"
                        >
                            Return
                        </button>
                    )}
                    <button 
                        type="submit"
                        className="flex-1 py-3 px-4 transition-all bg-btn-bg hover:bg-btn-hover text-btn-fg font-black text-[10px] uppercase shadow-md active:translate-y-0.5"
                    >
                        {step === 3 ? 'Initialize System' : 'Proceed'}
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default BlueprintForm;
