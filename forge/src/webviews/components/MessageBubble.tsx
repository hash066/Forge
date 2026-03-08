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
        <div className={`flex flex-col mb-4 ${isAi ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl border leading-relaxed ${
                isAi 
                ? 'bg-[#1a1a1a] text-white border-[#2b2b2b]' 
                : 'bg-traycer-blue text-white border-transparent shadow-lg'
            }`}>
                <div className="text-[14px] whitespace-pre-wrap font-medium">
                    {content}
                </div>
            </div>
            <span className="text-[10px] font-bold text-text-dim mt-2 px-1">
                {isAi ? 'Traycer' : 'You'} • {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
        </div>
    );
};

export default MessageBubble;
