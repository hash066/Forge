import React, { useState } from 'react';
import { QuizQuestion } from '../../extension/comprehensionValidator';

interface QuizModalProps {
    quiz: QuizQuestion;
    onSubmit: (correct: boolean) => void;
    onClose: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ quiz, onSubmit, onClose }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);

    const handleAnswerSubmit = () => {
        if (selectedOption === null) return;
        
        const isCorrect = selectedOption === quiz.correctIndex;
        setResult(isCorrect ? 'correct' : 'incorrect');
        onSubmit(isCorrect);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-bg/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-bg border border-border shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <header className="p-6 bg-header/20 border-b border-border">
                    <h2 className="text-[11px] font-black text-fg uppercase tracking-widest flex items-center gap-2">
                        Architectural Checksum
                    </h2>
                    <p className="text-fg/40 text-[9px] font-bold uppercase tracking-widest mt-1">
                        Validate implementation rationale to maintain system integrity.
                    </p>
                </header>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    <div className="bg-header/10 p-4 border border-border">
                        <pre className="text-[10px] text-fg/60 font-mono leading-tight whitespace-pre-wrap">
                            {quiz.codeSnippet}
                        </pre>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-fg uppercase tracking-tight">{quiz.question}</h3>
                        <div className="space-y-2">
                            {quiz.options.map((option, i) => (
                                <label 
                                    key={i} 
                                    className={`block p-4 border cursor-pointer transition-all ${
                                        selectedOption === i 
                                        ? 'border-btn-bg bg-btn-bg/10 text-fg' 
                                        : 'border-border hover:border-fg/10 text-fg/40 bg-header/5'
                                    }`}
                                >
                                    <input 
                                        type="radio" name="quiz-option" value={i} 
                                        checked={selectedOption === i} onChange={() => setSelectedOption(i)}
                                        className="hidden"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {result && (
                        <div className={`p-4 border ${
                            result === 'correct' ? 'bg-btn-bg/10 border-btn-bg/30 text-btn-bg' : 'bg-red-500/10 border-red-500/30 text-red-500'
                        }`}>
                            <h4 className="font-black uppercase text-[10px] mb-1 tracking-widest">
                                {result === 'correct' ? 'VALIDATION PASS' : 'VALIDATION FAIL'}
                            </h4>
                            <p className="text-[11px] font-bold opacity-80 uppercase tracking-tight">{quiz.explanation}</p>
                        </div>
                    )}
                </div>

                <footer className="p-6 border-t border-border bg-header/20 flex gap-4">
                    {result ? (
                        <button 
                            onClick={onClose}
                            className="w-full py-3 bg-btn-bg hover:bg-btn-hover text-btn-fg text-[11px] font-black uppercase tracking-widest shadow-md transition-all active:translate-y-0.5"
                        >
                            Return to Terminal
                        </button>
                    ) : (
                        <button 
                            onClick={handleAnswerSubmit}
                            disabled={selectedOption === null}
                            className="w-full py-3 bg-btn-bg hover:bg-btn-hover disabled:opacity-20 text-btn-fg text-[11px] font-black uppercase tracking-widest shadow-md transition-all active:translate-y-0.5"
                        >
                            Submit Analysis
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default QuizModal;
