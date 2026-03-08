import React from 'react';
import { Bot, Zap, LucideIcon, Sparkles, Brain, CheckCircle2 } from 'lucide-react';

interface ModelInfo {
    id: string;
    name: string;
    desc: string;
    speed: string;
    cost: string;
    icon: LucideIcon;
    color: string;
}

const models: ModelInfo[] = [
    {
        id: 'claude',
        name: 'Claude Sonnet 4 (Bedrock)',
        desc: 'Best for: Architecture reasoning',
        speed: 'Fast',
        cost: 'Low',
        icon: Brain,
        color: 'text-traycer-blue'
    },
    {
        id: 'gemini',
        name: 'Gemini 2.0 Flash',
        desc: 'Best for: Fast responses',
        speed: 'Very Fast',
        cost: 'Very Low',
        icon: Zap,
        color: 'text-check-green'
    },
    {
        id: 'grok',
        name: 'Grok 2',
        desc: 'Best for: Creative solutions',
        speed: 'Fast',
        cost: 'Medium',
        icon: Sparkles,
        color: 'text-yellow-500'
    }
];

interface ModelSelectorProps {
    selectedModel: string;
    onSelect: (id: string) => void;
    onSave: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelect, onSave }) => {
    return (
        <div className="bg-input-container-bg border border-card-border rounded-xl p-5 space-y-6 animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-[11px] font-black text-text-dim uppercase tracking-widest text-center">Choose AI Model</h3>
            
            <div className="space-y-3">
                {models.map((model) => (
                    <div 
                        key={model.id}
                        onClick={() => onSelect(model.id)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer group flex items-start gap-4 ${selectedModel === model.id ? 'bg-card-bg border-traycer-blue/40 shadow-xl' : 'bg-app-bg border-card-border/50 hover:border-card-border shadow-none opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`p-2 bg-[#222] rounded-lg ${model.color} group-hover:scale-110 transition-transform`}>
                            <model.icon size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[12px] font-black uppercase tracking-tight ${selectedModel === model.id ? 'text-white' : 'text-text-dim group-hover:text-white'}`}>{model.name}</span>
                                {selectedModel === model.id && <CheckCircle2 size={16} className="text-traycer-blue" />}
                            </div>
                            <p className="text-[10px] text-text-dim font-bold mb-3 opacity-60">{model.desc}</p>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-dim opacity-40">Speed:</span>
                                    <span className="text-[10px] font-bold text-text-main">{model.speed}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-dim opacity-40">Cost:</span>
                                    <span className="text-[10px] font-bold text-text-main">{model.cost}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={onSave}
                className="w-full py-3 bg-white hover:bg-white/90 rounded-lg text-black text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
                Save Preference
            </button>
        </div>
    );
};

export default ModelSelector;
