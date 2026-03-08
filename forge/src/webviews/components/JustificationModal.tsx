import React, { useState } from 'react';

interface JustificationModalProps {
    challenge: string;
    onSubmit: (text: string) => void;
}

const JustificationModal: React.FC<JustificationModalProps> = ({ challenge, onSubmit }) => {
    const [text, setText] = useState('');
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    return (
        <div className="absolute inset-0 z-[100] bg-bg/95 backdrop-blur-md flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4">
            <header className="mb-6">
                <div className="bg-btn-bg/10 text-btn-bg text-[10px] font-black uppercase px-2 py-1 inline-block mb-3 border border-btn-bg/30">
                    System Constraint
                </div>
                <h2 className="text-xl font-bold text-fg leading-tight">
                    {challenge}
                </h2>
                <p className="text-fg/40 text-xs mt-2 italic">
                    Specify rationale for the detected architectural deviation to proceed.
                </p>
            </header>

            <div className="flex-1 flex flex-col gap-3">
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Provide technical justification, trade-offs, and compliance rationale..."
                    className="flex-1 bg-input-bg border border-input-border p-4 text-sm focus:outline-none focus:border-btn-bg transition-all resize-none font-sans leading-relaxed text-fg"
                />
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className={wordCount < 50 ? 'text-red-500' : 'text-btn-bg'}>
                        Complexity Score: {wordCount} / 50 min
                    </span>
                    <span className="text-fg/20">
                        Protocol: High Precision
                    </span>
                </div>
            </div>

            <footer className="mt-6 flex flex-col gap-3">
                <button 
                    onClick={() => onSubmit(text)}
                    disabled={wordCount < 50}
                    className="w-full py-4 bg-btn-bg hover:bg-btn-hover disabled:opacity-20 text-btn-fg font-black transition-all uppercase tracking-tighter"
                >
                    Authorize Change
                </button>
            </footer>
        </div>
    );
};

export default JustificationModal;
