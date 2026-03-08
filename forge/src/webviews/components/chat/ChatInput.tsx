import React from 'react';
import { Send, Sparkles, MessageSquare } from 'lucide-react';

interface DashboardChatTriggerProps {
    onClick: () => void;
}

export const DashboardChatTrigger: React.FC<DashboardChatTriggerProps> = ({ onClick }) => {
    return (
        <div className="p-4 bg-app-bg border-t border-card-border/60">
            <h3 className="text-[11px] font-black text-text-dim uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                <Sparkles size={14} className="text-traycer-blue" />
                Ask Architecture Copilot
            </h3>
            <div 
                onClick={onClick}
                className="input-bar-v2 group hover:border-[#444] transition-all cursor-text flex items-center justify-between p-4 bg-input-container-bg hover:bg-[#2a2a2a]"
            >
                <span className="text-[14px] text-text-dim font-bold tracking-tight opacity-60 italic">Type your question...</span>
                <div className="p-2 bg-traycer-blue/20 rounded-lg text-traycer-blue group-hover:bg-traycer-blue group-hover:text-black transition-all">
                    <Send size={16} />
                </div>
            </div>
        </div>
    );
};

interface ChatInputProps {
    value: string;
    onChange: (val: string) => void;
    onSend: () => void;
    onGenerateReport: () => void;
    loading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, onGenerateReport, loading }) => {
    return (
        <div className="p-4 bg-app-bg border-t border-card-border/60 space-y-4">
            <div className="input-bar-v2 focus-within:border-[#444] transition-all bg-input-container-bg p-4 flex flex-col gap-3">
                <textarea 
                    className="w-full bg-transparent border-none outline-none text-[15px] text-text-main placeholder-text-dim/40 resize-none min-h-[40px] max-h-[200px] leading-relaxed font-bold tracking-tight"
                    placeholder="Type your message..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                />
                
                <div className="flex items-center justify-between pt-2 border-t border-card-border/30">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onGenerateReport}
                            className="px-3 py-1.5 bg-traycer-blue/10 hover:bg-traycer-blue/20 border border-traycer-blue/20 rounded-lg text-traycer-blue text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            Generate Report
                        </button>
                    </div>
                    
                    <button 
                        onClick={onSend}
                        disabled={loading || !value.trim()}
                        className="p-2 bg-white hover:bg-white/90 disabled:bg-[#333] disabled:text-text-dim rounded-lg text-black transition-all active:scale-90"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
