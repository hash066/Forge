import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { UserSkills } from '../../../extension/skillTracker';
import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react';

interface SkillsPanelProps {
    skills: UserSkills | null;
}

// Circular progress ring component
const CircleProgress: React.FC<{ score: number; color: string; size?: number }> = ({ score, color, size = 52 }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const filled = (score / 100) * circumference;
    const gap = circumference - filled;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
            {/* Track */}
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5}
            />
            {/* Fill */}
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={color}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${gap}`}
                strokeDashoffset={circumference / 4}
                style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <text
                x={size / 2} y={size / 2 + 1}
                textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize="9" fontWeight="900"
            >
                {score}
            </text>
        </svg>
    );
};

export const SkillsPanel: React.FC<SkillsPanelProps> = ({ skills }) => {
    const defaultScores = {
        'Error Handling': 72,
        'System Design': 65,
        'Security': 45,
        'Decoupling': 78,
        'Performance': 55,
        'Inclusion': 38
    };

    const skillData = skills?.scores || defaultScores;

    const chartData = Object.keys(skillData).map(key => ({
        subject: key,
        A: skillData[key as keyof typeof skillData],
        fullMark: 100,
    }));

    const getSkillMeta = (score: number) => {
        if (score >= 80) return { label: 'OPTIMAL', color: '#22d3ee', hex: '#22d3ee', icon: Zap };
        if (score >= 60) return { label: 'STABLE', color: '#a3a3a3', hex: '#a3a3a3', icon: Zap };
        if (score >= 40) return { label: 'DEVIANT', color: '#f59e0b', hex: '#f59e0b', icon: AlertTriangle };
        return { label: 'CRITICAL', color: '#ef4444', hex: '#ef4444', icon: ShieldAlert };
    };

    const totalScore = Math.round(
        Object.values(skillData).reduce((a, b) => a + b, 0) / Object.values(skillData).length
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Radar Chart */}
            <section className="bg-header/5 border border-border p-4">
                <h3 className="text-[9px] font-black uppercase text-fg/40 tracking-widest mb-4">Competency Matrix</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                            <PolarGrid stroke="var(--vscode-panel-border)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--vscode-foreground)', fontSize: 9, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Skills"
                                dataKey="A"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                fill="#f59e0b"
                                fillOpacity={0.15}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Overall ring */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <CircleProgress score={totalScore} color="#f59e0b" size={64} />
                    <div>
                        <div className="text-[9px] font-black uppercase text-fg/40 tracking-widest">Overall Protocol Score</div>
                        <div className="text-[20px] font-black text-white">{totalScore}<span className="text-[11px] text-fg/40">/100</span></div>
                        <div className={`text-[8px] font-black uppercase tracking-widest ${totalScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                            {totalScore >= 80 ? 'OPTIMAL' : totalScore >= 60 ? 'PROGRESSING' : 'NEEDS WORK'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Detailed Breakdown with circles */}
            <section>
                <h3 className="text-[9px] font-black uppercase text-fg/40 tracking-widest mb-3">Protocol Proficiency Breakdown</h3>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(skillData).map(([skill, score]) => {
                        const meta = getSkillMeta(score);
                        const Icon = meta.icon;

                        return (
                            <div key={skill} className="bg-bg border border-border p-3 hover:bg-header/10 transition-colors flex items-center gap-3">
                                <CircleProgress score={score} color={meta.hex} size={48} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <Icon size={9} className="text-fg/20" />
                                        <span className="text-[8px] font-bold text-fg/60 uppercase truncate">{skill}</span>
                                    </div>
                                    <div className="flex justify-between text-[8px] font-black tracking-tighter mt-1">
                                        <span style={{ color: meta.hex }}>{meta.label}</span>
                                        <span className="text-fg/20 uppercase cursor-pointer hover:text-fg/60 underline">Data_Log</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};
