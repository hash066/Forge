import React from 'react';

interface MessageBubbleProps {
    content: string;
    sender: 'user' | 'ai';
    timestamp: number;
    isLoading?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ content, sender, timestamp, isLoading }) => {
    const isAi = sender === 'ai';

    return (
        <div className={`flex flex-col mb-4 space-y-1 ${isAi ? 'items-start' : 'items-end'}`}>
            <span className="text-[10px] font-black text-text-dim uppercase tracking-widest px-1 opacity-60">
                {isAi ? 'DevForge Copilot' : 'You'}
            </span>
            <div className={`max-w-[90%] p-4 rounded-2xl border leading-relaxed ${
                isAi 
                ? 'bg-card-bg text-text-main border-card-border shadow-sm' 
                : 'bg-input-container-bg text-white border-card-border/50 shadow-md'
            }`}>
                <div className="text-[13px] whitespace-pre-wrap font-bold tracking-tight">
                    {content}
                </div>
            </div>
            <span className="text-[9px] font-bold text-text-dim opacity-40 px-1">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
        </div>
    );
};

export default MessageBubble;
