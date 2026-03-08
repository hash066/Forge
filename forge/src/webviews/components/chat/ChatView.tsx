import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreHorizontal, MessageSquare, History, Plus, Brain, Sparkles, Zap, DollarSign } from 'lucide-react';
import MessageBubble from '../MessageBubble';
import { ChatInput } from './ChatInput';
import ModelSelector from './ModelSelector';
import ArchitectureReport from './ArchitectureReport';

import { vscode } from '../../vscodeApi';

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: number;
    type?: 'report';
    reportData?: any;
}

interface ChatViewProps {
    onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onBack }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            content: "Hi! I'm your architecture copilot. Ask me anything or try:",
            sender: 'ai',
            timestamp: Date.now()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModelSelector, setShowModelSelector] = useState(true);
    const [selectedModel, setSelectedModel] = useState('claude');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'addMessage') {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    content: message.content,
                    sender: message.sender,
                    timestamp: Date.now()
                }]);
                setLoading(false);
            }
            if (message.type === 'showGenerateReport') {
                // Auto-trigger report generation when navigated from Cost panel
                handleTriggerReport();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleTriggerReport = () => {
        setLoading(true);
        setTimeout(() => {
            const mockReportData = {
                timestamp: new Date().toLocaleString(),
                healthScore: 52,
                patterns: 'Monolith + Cloud Storage',
                components: ['Express API', 'MongoDB', 'Redis Cache', 'AWS S3', 'Lambda/Bedrock'],
                security: {
                    score: 28,
                    critical: [
                        'Hardcoded AWS_SECRET_KEY in index.js (line 9)',
                        'SQL Injection via string concatenation (line 11)',
                        'JWT_SECRET hardcoded in source (line 10)',
                        'Prototype pollution via Object.assign(global, payload) (line 117)'
                    ],
                    high: [
                        'Public S3 bucket ACL on analytics exports',
                        'No authentication middleware on any routes',
                        'No rate limiting — DDoS vulnerable'
                    ]
                },
                scalability: {
                    score: 41,
                    limits: [
                        'O(n\u00b3) triple loop in buildRecommendationMatrix — unscalable at >1K users',
                        'O(n\u00b2) nested loop in mergeCatalogs — degrades at >10K products',
                        'New MongoDB connection created per HTTP request — exhausts connection pool'
                    ],
                    recommendations: [
                        'Replace triple loop with pre-indexed HashMap approach (O(n))',
                        'Initialize MongoClient singleton at startup',
                        'Add Redis caching layer for product catalog lookups'
                    ]
                },
                cost: {
                    total: '$5.00',
                    budget: '$100.00',
                    breakdown: [
                        { service: 'RDS', amount: '$1.95', percentage: '39%' },
                        { service: 'EC2', amount: '$1.60', percentage: '32%' },
                        { service: 'ElastiCache', amount: '$0.90', percentage: '18%' },
                        { service: 'S3', amount: '$0.35', percentage: '7%' },
                        { service: 'Lambda', amount: '$0.20', percentage: '4%' }
                    ],
                    savings: [
                        'Reserve instance migration identified: -$5.50/mo',
                        'Lifecycle policy optimization: -$1.20/mo'
                    ]
                },
                drift: {
                    score: 45,
                    violations: [
                        'Database: Code uses MongoDB — Blueprint specifies PostgreSQL',
                        'External Service: AWS SDK used without blueprint authorization',
                        'Security: No auth middleware despite blueprint requirement'
                    ]
                },
                immediateActions: [
                    'Rotate AWS credentials immediately (remove from source)',
                    'Fix SQL injection — use parameterized queries',
                    'Fix prototype pollution in /pay route',
                    'Initialize MongoClient connection pool at startup',
                    'Add Express auth middleware (JWT verification)',
                    'Replace O(n\u00b3) recommendation loop with HashMap index'
                ]
            };
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                content: 'Architecture Analysis Report Generated',
                sender: 'ai',
                timestamp: Date.now(),
                type: 'report',
                reportData: mockReportData
            }]);
            setLoading(false);
        }, 800);
    };

    const handleSendMessage = (text?: string) => {
        const content = text || inputText;
        if (!content.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            content,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        vscode.postMessage({ type: 'chatMessage', value: content });
        setInputText('');
        setLoading(true);

        if (content.toLowerCase().includes('generate report') || content.toLowerCase().includes('report')) {
            handleTriggerReport();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-app-bg text-text-main animate-in slide-in-from-right duration-400">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-4 border-b border-card-border/60 bg-header-bg">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-[#333] border border-card-border rounded-lg transition-all active:scale-95">
                        <ChevronLeft size={18} className="text-text-dim" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-black uppercase tracking-widest text-white italic">Architecture Copilot</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 bg-check-green rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-text-dim uppercase font-black tracking-tighter opacity-60">
                                {selectedModel === 'claude' ? 'Claude Sonnet 4' : 'Gemini 2.0 Flash'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-text-dim">
                    <History size={18} className="hover:text-white cursor-pointer opacity-60 transition-opacity" />
                    <MoreHorizontal size={18} className="hover:text-white cursor-pointer opacity-60 transition-opacity" />
                </div>
            </header>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                {showModelSelector && (
                    <div className="p-4">
                        <ModelSelector 
                            selectedModel={selectedModel} 
                            onSelect={setSelectedModel} 
                            onSave={() => {
                                setShowModelSelector(false);
                                vscode.postMessage({ type: 'savePreferredModel', value: selectedModel });
                            }} 
                        />
                    </div>
                )}

                <div className="p-6 space-y-6">
                    {messages.map(msg => (
                        <div key={msg.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {msg.type === 'report' ? (
                                <ArchitectureReport data={msg.reportData} />
                            ) : (
                                <MessageBubble 
                                    content={msg.content}
                                    sender={msg.sender}
                                    timestamp={msg.timestamp}
                                />
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-2 items-center p-4 bg-card-bg border border-card-border w-fit rounded-lg animate-pulse">
                            <div className="w-1.5 h-1.5 bg-traycer-blue fill-traycer-blue rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-traycer-blue fill-traycer-blue rounded-full animate-bounce delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-traycer-blue fill-traycer-blue rounded-full animate-bounce delay-150"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Overlay Actions */}
            <div className="px-6 flex gap-2">
                {messages.length < 5 && (
                    <>
                        <button onClick={() => handleSendMessage('Generate Report')} className="px-3 py-1.5 bg-[#222] border border-card-border rounded-lg text-[10px] text-text-dim font-black uppercase tracking-widest hover:text-white transition-all">Generate Report</button>
                        <button onClick={() => handleSendMessage('Explain Code')} className="px-3 py-1.5 bg-[#222] border border-card-border rounded-lg text-[10px] text-text-dim font-black uppercase tracking-widest hover:text-white transition-all">Explain Code</button>
                    </>
                )}
            </div>

            {/* Chat Input */}
            <ChatInput 
                value={inputText}
                onChange={setInputText}
                onSend={() => handleSendMessage()}
                onGenerateReport={() => handleSendMessage('Generate Report')}
                loading={loading}
            />
        </div>
    );
};

export default ChatView;
