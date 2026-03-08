import React from 'react';
import { Target, Trophy, Flame, Play } from 'lucide-react';
import { UserSkills } from '../../../extension/skillTracker';

interface StudentDashboardProps {
    skills: UserSkills | null;
    onAction: (action: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ skills, onAction }) => {
    // Generate an aggregate score based on individual skills
    const calculateOverallScore = () => {
        if (!skills || Object.keys(skills.scores).length === 0) return 0;
        const total = Object.values(skills.scores).reduce((a, b) => a + b, 0);
        return Math.round(total / Object.keys(skills.scores).length);
    };

    const score = calculateOverallScore();
    const circumference = 2 * Math.PI * 24;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Aggregate Score */}
            <div className="traycer-card p-4 flex justify-between items-center relative overflow-hidden bg-[#1a1a1a]">
                <div className="z-10">
                    <h2 className="text-[12px] font-bold tracking-tight text-white mb-1">Performance Index</h2>
                    <p className="text-[11px] text-traycer-blue font-semibold">Level: Intermediate</p>
                </div>
                
                <div className="relative w-16 h-16 flex items-center justify-center z-10">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="26" className="stroke-[#252525]" strokeWidth="4" fill="none" />
                        <circle 
                            cx="32" 
                            cy="32" 
                            r="26" 
                            className="stroke-traycer-blue transition-all duration-1000 ease-out" 
                            strokeWidth="4" 
                            fill="none" 
                            strokeLinecap="round"
                            style={{ strokeDasharray: 2 * Math.PI * 26, strokeDashoffset: (2 * Math.PI * 26) - (score / 100) * (2 * Math.PI * 26) }}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-bold text-white leading-none">{score}</span>
                        <span className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Rank</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="traycer-card p-4 hover:border-[#444] transition-colors">
                    <h3 className="text-[11px] font-bold text-text-dim flex items-center gap-2 mb-3">
                        <Target size={14} /> Active Sessions
                    </h3>
                    <ul className="text-[12px] space-y-2 text-white/80">
                        <li>3 assessments completed</li>
                        <li>2 patterns identified</li>
                        <li>15m analysis time</li>
                    </ul>
                </div>
                <div className="traycer-card p-4 hover:border-[#444] transition-colors">
                    <h3 className="text-[11px] font-bold text-text-dim flex items-center gap-2 mb-3">
                        <Trophy size={14} /> Milestones
                    </h3>
                    <ul className="text-[12px] space-y-2 text-white/80">
                        <li className="flex items-center gap-2">Architect: Tier I</li>
                        <li className="flex items-center gap-2 text-text-dim"><Flame size={14} /> 3-day runtime</li>
                    </ul>
                </div>
            </div>

            {/* Suggested Next Steps */}
            <div className="traycer-card bg-[#1a1a1a]/50 p-4 border border-card-border">
                <h3 className="text-[12px] font-bold text-traycer-blue mb-4 tracking-tight uppercase">Architectural Plan</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-[13px] font-medium bg-[#222] p-3 rounded-xl border border-transparent hover:border-[#444] cursor-pointer transition-all">
                        <span className="text-white/90">Analysis: Two Sum Optimization</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px] font-medium bg-[#222] p-3 rounded-xl border border-transparent hover:border-[#444] cursor-pointer transition-all">
                        <span className="text-white/90">Review: Resilience Patterns</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <button 
                onClick={() => onAction('startInterviewPrep')}
                className="w-full py-3 bg-traycer-blue hover:bg-traycer-blue/90 text-white text-[13px] font-bold rounded-xl transition-all shadow-lg active:scale-95"
            >
                Initialize Assessment
            </button>
        </div>
    );
};
