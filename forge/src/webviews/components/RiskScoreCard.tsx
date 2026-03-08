import React from 'react';

interface RiskScoreCardProps {
    score: number;
    label: string;
    type: 'security' | 'scalability' | 'cost' | 'overengineering';
    onClick?: () => void;
}

const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ score, label, type, onClick }) => {
    // Score is 0-10 for display purposes in the UI description
    // API returns 0-1, so let's multiply by 10
    const displayScore = Math.round(score * 10);
    
    let statusStyle = 'border-border text-fg opacity-60';
    if (displayScore >= 7) {
        statusStyle = 'border-red-500/50 text-red-500 bg-red-500/5';
    } else if (displayScore >= 4) {
        statusStyle = 'border-amber-500/50 text-amber-500 bg-amber-500/5';
    } else if (displayScore > 0) {
        statusStyle = 'border-btn-bg/50 text-btn-bg bg-btn-bg/5';
    }

    return (
        <div 
            onClick={onClick}
            className={`p-2.5 border transition-all hover:bg-header/10 cursor-pointer ${statusStyle}`}
        >
            <div className="text-[9px] uppercase font-black tracking-widest flex justify-between items-center opacity-70">
                <span>{label}</span>
                <span className="font-mono opacity-20">[{type.substring(0, 3).toUpperCase()}]</span>
            </div>
            <div className="text-xl font-black mt-0.5 tracking-tighter">
                {displayScore}.0
            </div>
        </div>
    );
};

export default RiskScoreCard;
