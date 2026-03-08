import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Shield, BookOpen, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { vscode } from '../../vscodeApi';

interface MentorPanelProps {
    onSendMessage: (msg: string) => void;
}

const SAMPLE_QUIZZES = [
    {
        question: "Which sorting algorithm has O(n log n) average time complexity and is the most commonly used built-in sort?",
        options: ["Bubble Sort", "Merge Sort / Timsort", "Insertion Sort", "Selection Sort"],
        correct: 1,
        explanation: "Most language built-ins (Python's Timsort, JavaScript's Array.sort) use Merge Sort variants achieving O(n log n) average and worst-case complexity."
    },
    {
        question: "In a HashMap-based solution, what is the average time complexity for lookup?",
        options: ["O(n)", "O(n log n)", "O(1)", "O(log n)"],
        correct: 2,
        explanation: "HashMap (hash table) provides O(1) average-case lookup, insertion, and deletion due to direct index computation from the hash function."
    },
    {
        question: "When would you choose Binary Search over Linear Search?",
        options: [
            "When the array is unsorted",
            "When the array is sorted and n is large",
            "When elements are duplicated",
            "Only for strings"
        ],
        correct: 1,
        explanation: "Binary Search requires a sorted array and provides O(log n) complexity vs O(n) linear search. Ideal when n is large and sorting is already done."
    },
    {
        question: "What is a common technique to optimize recursive solutions and avoid re-computation?",
        options: ["Sorting", "Memoization (DP)", "Binary Search", "Two Pointers"],
        correct: 1,
        explanation: "Memoization caches results of expensive function calls, converting exponential recursion (e.g., O(2^n) Fibonacci) to O(n) by storing subproblem results."
    }
];

export const MentorPanel: React.FC<MentorPanelProps> = ({ onSendMessage }) => {
    const [view, setView] = useState<'chat' | 'quiz'>('chat');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<any[]>([
        {
            role: 'system',
            content: "Architecture Advisor initialized. Ask me anything about algorithms, system design, or your code patterns.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);

    // Quiz state
    const [quizIndex, setQuizIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [quizScore, setQuizScore] = useState(0);
    const [quizComplete, setQuizComplete] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'addMessage') {
                setMessages(prev => [...prev, {
                    role: message.sender === 'ai' ? 'system' : 'user',
                    content: message.content,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }
            if (message.type === 'triggerQuiz' && message.quiz) {
                const q = message.quiz;
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: `📋 Quiz: ${q.question}\n\nOptions:\n${q.options.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg = {
            role: 'user',
            content: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([...messages, newMsg]);
        setInput('');
        onSendMessage(input);
    };

    const handleAnswer = (optionIndex: number) => {
        if (selected !== null) return;
        setSelected(optionIndex);
        const q = SAMPLE_QUIZZES[quizIndex];
        const isCorrect = optionIndex === q.correct;
        if (isCorrect) setQuizScore(s => s + 1);
        vscode.postMessage({ type: 'quizResult', correct: isCorrect });
    };

    const handleNextQuestion = () => {
        if (quizIndex >= SAMPLE_QUIZZES.length - 1) {
            setQuizComplete(true);
        } else {
            setQuizIndex(i => i + 1);
            setSelected(null);
        }
    };

    const resetQuiz = () => {
        setQuizIndex(0);
        setSelected(null);
        setQuizScore(0);
        setQuizComplete(false);
    };

    const q = SAMPLE_QUIZZES[quizIndex];

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in slide-in-from-right-2 duration-300">
            {/* Header with tab switcher */}
            <header className="bg-bg border border-border p-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1 border border-border">
                        <Terminal size={12} className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-[9px] font-black uppercase text-fg/40 tracking-widest">Architecture Advisor</h2>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-cyan-400 animate-pulse inline-block" />
                            <span className="text-[8px] font-bold text-fg/40 uppercase">Session Active</span>
                        </div>
                    </div>
                </div>
                {/* Mode Toggle */}
                <div className="flex border border-border overflow-hidden">
                    <button
                        onClick={() => setView('chat')}
                        className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors ${view === 'chat' ? 'bg-cyan-400/10 text-cyan-400' : 'text-fg/30 hover:text-fg/60'}`}
                    >
                        <Terminal size={8} />Chat
                    </button>
                    <button
                        onClick={() => { setView('quiz'); resetQuiz(); }}
                        className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors border-l border-border ${view === 'quiz' ? 'bg-amber-400/10 text-amber-400' : 'text-fg/30 hover:text-fg/60'}`}
                    >
                        <BookOpen size={8} />Quiz
                    </button>
                </div>
            </header>

            {view === 'chat' ? (
                <>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex flex-col max-w-[95%] ${m.role === 'user' ? 'ml-auto items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-1.5 mb-1 opacity-40">
                                    {m.role === 'system' && <Shield size={8} className="text-cyan-400" />}
                                    <span className="text-[8px] font-black tracking-widest uppercase text-fg/40">
                                        {m.role === 'system' ? 'System Process' : 'Terminal User'}
                                    </span>
                                </div>
                                <div className={`p-3 text-[11px] leading-relaxed border ${m.role === 'user' ? 'bg-bg text-fg border-border' : 'bg-header/20 border-l-2 border-l-cyan-400/60 border-border text-fg'}`}>
                                    <div className="whitespace-pre-line">{m.content}</div>
                                </div>
                                <span className="text-[8px] font-mono text-fg/20 mt-1 uppercase tracking-tighter">{m.time}</span>
                            </div>
                        ))}
                    </div>
                    <div className="shrink-0 space-y-2 mt-auto">
                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {['Redis vs Memory Cache', 'SQL vs NoSQL', 'Debouncing'].map(chip => (
                                <button key={chip} onClick={() => setInput(chip)} className="px-2 py-0.5 border border-border text-[9px] font-bold uppercase tracking-tight text-fg/40 whitespace-nowrap hover:text-fg hover:border-cyan-400/40 transition-all">
                                    {chip}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex border border-border bg-input-bg">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="ASK ARCHITECTURE ADVISOR..."
                                className="flex-1 bg-transparent py-2.5 px-3 text-[10px] text-fg placeholder-fg/20 focus:outline-none font-mono uppercase tracking-tight"
                            />
                            <button onClick={handleSend} disabled={!input.trim()} className="w-10 flex items-center justify-center bg-cyan-400/10 hover:bg-cyan-400/20 disabled:opacity-20 text-cyan-400 transition-colors border-l border-border">
                                <Send size={10} />
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto p-4">
                    {quizComplete ? (
                        <div className="text-center py-12 space-y-6">
                            <div className="relative mx-auto w-24 h-24">
                                <svg viewBox="0 0 96 96" className="w-24 h-24 -rotate-90">
                                    <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                    <circle cx="48" cy="48" r="40" fill="none"
                                        stroke="#f59e0b" strokeWidth="8"
                                        strokeDasharray={`${(quizScore / SAMPLE_QUIZZES.length) * 251.2} 251.2`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-white">{quizScore}/{SAMPLE_QUIZZES.length}</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-[12px] font-black uppercase tracking-widest text-white">Quiz Complete</div>
                                <div className="text-[10px] text-fg/40 mt-1">{Math.round((quizScore / SAMPLE_QUIZZES.length) * 100)}% Score — Skills Updated</div>
                            </div>
                            <button onClick={resetQuiz} className="px-6 py-2 border border-border text-[9px] font-black uppercase tracking-widest text-fg/60 hover:text-white hover:border-fg/40 transition-all">
                                Retry Quiz
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Progress */}
                            <div className="flex items-center justify-between text-[8px] font-black uppercase text-fg/30 tracking-widest">
                                <span>Question {quizIndex + 1} of {SAMPLE_QUIZZES.length}</span>
                                <span className="text-amber-400">{quizScore} correct</span>
                            </div>
                            <div className="h-1 bg-border overflow-hidden">
                                <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${((quizIndex) / SAMPLE_QUIZZES.length) * 100}%` }} />
                            </div>

                            {/* Question */}
                            <div className="p-4 bg-header/5 border border-border">
                                <p className="text-[12px] font-bold text-white leading-relaxed">{q.question}</p>
                            </div>

                            {/* Options */}
                            <div className="space-y-2">
                                {q.options.map((opt, i) => {
                                    const isSelected = selected === i;
                                    const isCorrect = i === q.correct;
                                    let cls = 'border-border text-fg/70 hover:border-fg/30 hover:text-white';
                                    if (selected !== null) {
                                        if (isCorrect) cls = 'border-green-500/60 bg-green-500/5 text-green-400';
                                        else if (isSelected) cls = 'border-red-500/60 bg-red-500/5 text-red-400';
                                        else cls = 'border-border text-fg/30 opacity-50';
                                    }
                                    return (
                                        <button key={i} onClick={() => handleAnswer(i)}
                                            className={`w-full text-left p-3 border text-[11px] font-bold transition-all flex items-center gap-3 ${cls}`}>
                                            <span className="text-[9px] font-black w-5 h-5 border border-current flex items-center justify-center shrink-0">
                                                {selected !== null ? (isCorrect ? <CheckCircle2 size={10} /> : isSelected ? <XCircle size={10} /> : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                                            </span>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explanation */}
                            {selected !== null && (
                                <div className="p-3 bg-header/10 border-l-2 border-l-amber-400 border border-border text-[10px] text-fg/70 font-bold leading-relaxed animate-in fade-in duration-300">
                                    <span className="text-amber-400 font-black uppercase text-[8px] tracking-widest block mb-1">Explanation</span>
                                    {q.explanation}
                                </div>
                            )}

                            {selected !== null && (
                                <button onClick={handleNextQuestion}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[9px] font-black uppercase tracking-widest hover:bg-amber-400/20 transition-all">
                                    {quizIndex >= SAMPLE_QUIZZES.length - 1 ? 'View Results' : 'Next Question'}
                                    <ChevronRight size={12} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
