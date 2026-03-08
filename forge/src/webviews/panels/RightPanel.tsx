import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
    Plus, History, Paperclip, MoreHorizontal, 
    ChevronLeft, ChevronRight, Sparkles, 
    Layers, Layout, Search, CheckCircle2,
    AtSign, Send
} from 'lucide-react';
import MessageBubble from '../components/MessageBubble';
import JustificationModal from '../components/JustificationModal';
import '../styles.css';

import { vscode } from '../vscodeApi';

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: number;
}

const RightPanel = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [challenge, setChallenge] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'addMessage':
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        content: message.content,
                        sender: message.sender,
                        timestamp: Date.now()
                    }]);
                    setLoading(false);
                    break;
                case 'triggerChallenge':
                    setChallenge(message.value);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            content: inputText,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        inputText && vscode.postMessage({ type: 'chatMessage', value: inputText });
        setInputText('');
        setLoading(true);
    };

    const WelcomeScreen = () => (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700">
            <div className="relative">
                <div className="w-16 h-16 bg-traycer-blue/10 rounded-2xl flex items-center justify-center animate-pulse">
                    <Sparkles size={32} className="text-traycer-blue" />
                </div>
            </div>
            
            <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tighter text-white leading-tight">
                    What can I help you<br/>build today?
                </h1>
                <p className="text-[14px] text-text-dim max-w-sm mx-auto font-bold uppercase tracking-widest opacity-60">
                    Infrastructure-First AI Assistance
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xl mt-6">
                {[
                    { id: 'epic', icon: Sparkles, label: 'Epic', desc: 'Managed end-to-end with AI.' },
                    { id: 'phases', icon: Layers, label: 'Phases', desc: 'Break task into phases.' },
                    { id: 'plan', icon: Layout, label: 'Plan', desc: 'Detailed file-level plan.' },
                    { id: 'review', icon: Search, label: 'Review', desc: 'Identify system deviations.' }
                ].map((item) => (
                    <div key={item.id} className="traycer-card text-left group hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <item.icon size={20} className="text-text-dim group-hover:text-white" />
                        </div>
                        <h3 className="text-[14px] font-black mb-1.5 text-white uppercase tracking-tight">{item.label}</h3>
                        <p className="text-[12px] text-text-dim leading-relaxed font-bold opacity-60">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-app-bg text-text-main overflow-hidden font-sans">
            {challenge && (
                <JustificationModal 
                    challenge={challenge} 
                    onSubmit={(text) => { setChallenge(null); vscode.postMessage({ type: 'justifyResult', value: text }); }} 
                />
            )}
            
            <header className="traycer-header border-none py-4">
                <div className="flex items-center gap-5">
                    <span className="text-white font-black italic text-[16px] tracking-tighter hover:opacity-80 cursor-pointer transition-opacity">DEVFORGE</span>
                    <div className="flex items-center gap-3">
                        <ChevronLeft size={18} className="text-text-dim cursor-pointer hover:text-white" />
                        <ChevronRight size={18} className="text-text-dim cursor-pointer hover:text-white" />
                    </div>
                    <span className="text-white/40 text-[12px] font-black uppercase tracking-widest ml-2 italic">Architecture Copilot</span>
                </div>
                <div className="flex items-center gap-5 text-text-dim">
                    <Plus size={20} className="hover:text-white cursor-pointer" />
                    <History size={20} className="hover:text-white cursor-pointer" />
                    <Paperclip size={20} className="hover:text-white cursor-pointer" />
                    <MoreHorizontal size={20} className="hover:text-white cursor-pointer" />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
                {messages.length === 0 ? <WelcomeScreen /> : (
                    <div className="p-6 space-y-6 max-w-3xl mx-auto w-full">
                        {messages.map(msg => (
                            <MessageBubble 
                                key={msg.id}
                                content={msg.content}
                                sender={msg.sender}
                                timestamp={msg.timestamp}
                            />
                        ))}
                        {loading && (
                            <div className="flex gap-2 items-center p-4 bg-card-bg border border-card-border w-fit rounded-lg">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75"></div>
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="p-6 bg-app-bg border-t border-card-border/40">
                <div className="input-bar-v2 group focus-within:border-[#444] transition-all bg-[#0d0d0d] p-4">
                    <textarea 
                        className="w-full bg-transparent border-none outline-none text-[15px] text-text-main placeholder-text-dim resize-none min-h-[50px] max-h-[300px] leading-relaxed font-bold tracking-tight"
                        placeholder="Describe your architectural task..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleSendMessage();
                            }
                        }}
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-card-border/50">
                        <div className="flex items-center gap-4 text-text-dim">
                            <Plus size={20} className="hover:text-white cursor-pointer" />
                            <AtSign size={20} className="hover:text-white cursor-pointer" />
                            <div className="h-4 w-[1px] bg-card-border mx-1"></div>
                            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest hover:text-white cursor-pointer bg-[#111] px-2 py-1 rounded-md">
                                <span>Blueprints</span>
                                <ChevronRight size={12} className="rotate-90 opacity-60" />
                            </div>
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            disabled={loading || !inputText.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-white/90 disabled:bg-[#222] disabled:text-text-dim rounded-lg text-black text-[12px] font-black uppercase tracking-widest transition-all shadow-lg shadow-white/5 active:scale-95"
                        >
                            <span>Send</span>
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<RightPanel />);
}
