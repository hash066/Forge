import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Shield } from 'lucide-react';

interface MentorPanelProps {
    onSendMessage: (msg: string) => void;
}

export const MentorPanel: React.FC<MentorPanelProps> = ({ onSendMessage }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            role: 'system',
            content: "Architecture Advisor initialized. Ready for system query.",
            time: '00:00:00'
        },
        {
            role: 'user',
            content: "Why should I use Redis instead of just caching in memory?",
            time: '2:16 PM'
        },
        {
            role: 'system',
            content: "Analysis complete:\n\n1. Persistence: Redis provides durable storage beyond process lifecycle.\n2. Concurrency: Unified state for multi-node deployments.\n3. Latency: Sub-millisecond performance for common data structures.\n\nLocal memory caching is restricted to the host instance.",
            time: '00:00:05'
        }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        // Add user message to UI
        const newMsg = {
            role: 'user',
            content: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages([...messages, newMsg]);
        setInput('');
        onSendMessage(input);
        
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'system',
                content: "Executing cross-reference with established architecture blueprints. System integrity remains optimal. Further elaboration required on specific pattern implementation?",
                time: new Date().toLocaleTimeString('en-GB')
            }]);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in slide-in-from-right-2 duration-300">
            <header className="bg-bg border border-border p-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1 border border-border">
                        <Terminal size={12} className="text-btn-bg" />
                    </div>
                    <div>
                        <h2 className="text-[9px] font-black uppercase text-fg/40 tracking-widest">Architectural Analyst</h2>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-btn-bg"></span>
                            <span className="text-[9px] font-bold text-fg/40 uppercase">Session Active</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-4 py-4 pr-1"
            >
                {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col max-w-[95%] ${m.role === 'user' ? 'ml-auto items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-1 opacity-40">
                            {m.role === 'system' && <Shield size={8} className="text-btn-bg" />}
                            <span className="text-[8px] font-black tracking-widest uppercase text-fg/40">
                                {m.role === 'system' ? 'System Process' : 'Terminal User'}
                            </span>
                        </div>
                        <div className={`p-3 text-[11px] leading-relaxed border ${m.role === 'user' ? 'bg-bg text-fg border-border' : 'bg-header/20 border-l-2 border-l-btn-bg border-border text-fg'}`}>
                            <div className="whitespace-pre-line">{m.content}</div>
                        </div>
                        <span className="text-[8px] font-mono text-fg/20 mt-1 uppercase tracking-tighter">{m.time}</span>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="shrink-0 space-y-2 mt-auto">
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {['Microservices', 'Caching', 'Observability'].map(chip => (
                        <button key={chip} onClick={() => setInput(`Query: ${chip}`)} className="px-2 py-0.5 border border-border text-[9px] font-bold uppercase tracking-tight text-fg/40 whitespace-nowrap hover:text-fg hover:border-btn-bg transition-all">
                            {chip}
                        </button>
                    ))}
                </div>
                
                <div className="relative flex border border-border bg-input-bg">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="INPUT QUERY..."
                        className="flex-1 bg-transparent py-2.5 px-3 text-[10px] text-fg placeholder-fg/20 focus:outline-none font-mono uppercase tracking-tight"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="w-10 flex items-center justify-center bg-btn-bg hover:bg-btn-hover disabled:opacity-20 text-btn-fg transition-colors"
                    >
                        <Send size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
};
