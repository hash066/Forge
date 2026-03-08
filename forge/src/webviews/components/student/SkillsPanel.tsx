import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { UserSkills } from '../../../extension/skillTracker';
import { AlertTriangle, ShieldAlert, Zap, Network, Crosshair, CheckCircle2 } from 'lucide-react';

interface SkillsPanelProps {
    skills: UserSkills | null;
}

export const SkillsPanel: React.FC<SkillsPanelProps> = ({ skills }) => {
    
    // Default fallback scores if skills haven't loaded
    const defaultScores = {
        'Error Handling': 72,
        'System Design': 65,
        'Security': 45,
        'Decoupling': 78,
        'Performance': 55,
        'Inclusion': 38
    };

    const skillData = skills?.scores || defaultScores;

    // Transform into Recharts format
    const chartData = Object.keys(skillData).map(key => ({
        subject: key,
        A: skillData[key as keyof typeof skillData],
        fullMark: 100,
    }));

    const getSkillMeta = (score: number) => {
        if (score >= 80) return { label: 'OPTIMAL', color: 'text-btn-bg', bg: 'bg-btn-bg', icon: Zap };
        if (score >= 60) return { label: 'STABLE', color: 'text-fg/60', bg: 'bg-fg/40', icon: Zap };
        if (score >= 40) return { label: 'DEVIANT', color: 'text-amber-500', bg: 'bg-amber-500', icon: AlertTriangle };
        return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500', icon: ShieldAlert };
    };

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
                                stroke="var(--vscode-button-background)"
                                strokeWidth={1}
                                fill="var(--vscode-button-background)"
                                fillOpacity={0.2}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Detailed Breakdown */}
            <section>
                <h3 className="text-[9px] font-black uppercase text-fg/40 tracking-widest mb-3">Protocol Proficiency Breakdown</h3>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(skillData).map(([skill, score]) => {
                        const meta = getSkillMeta(score);
                        const Icon = meta.icon;
                        
                        return (
                            <div key={skill} className="bg-bg border border-border p-3 hover:bg-header/10 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <Icon size={10} className="text-fg/20" />
                                        <span className="text-[9px] font-bold text-fg/60 uppercase">{skill}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-fg">{score}</span>
                                </div>
                                <div className="h-1 w-full bg-border overflow-hidden mb-1">
                                    <div className={`h-full bg-fg/40`} style={{ width: `${score}%` }} />
                                </div>
                                <div className="flex justify-between text-[8px] font-black tracking-tighter">
                                    <span className={meta.color}>{meta.label}</span>
                                    <span className="text-fg/20 uppercase cursor-pointer hover:text-fg/60 underline">Data_Log</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};
