import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import SecurityGateModal from '../components/SecurityGateModal';
import BlueprintForm from '../components/BlueprintForm';
import QuizModal from '../components/QuizModal';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { DeveloperDashboard } from '../components/developer/DeveloperDashboard';
import { DriftPanel } from '../components/developer/DriftPanel';
import { ScalePanel } from '../components/developer/ScalePanel';
import { CostPanel } from '../components/developer/CostPanel';
import { StudentDashboard } from '../components/student/StudentDashboard';
import { SkillsPanel } from '../components/student/SkillsPanel';
import { PatternsPanel } from '../components/student/PatternsPanel';
import { MentorPanel } from '../components/student/MentorPanel';
import '../styles.css';
import { RiskScores, Violation } from '../../shared/types';
import { QuizQuestion } from '../../extension/comprehensionValidator';
import { UserSkills } from '../../extension/skillTracker';
import { ScaleFailurePoint } from '../../extension/scalePredictor';

// @ts-ignore
const vscode = acquireVsCodeApi();

const LeftPanel = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [mode, setMode] = useState<'student' | 'developer'>('developer');

    const devTabs = ['Dashboard', 'Live Map', 'Drift', 'Scale', 'Cost'];
    const studentTabs = ['Dashboard', 'Live Map', 'Skills', 'Patterns', 'Mentor'];
    const currentTabs = mode === 'developer' ? devTabs : studentTabs;

    useEffect(() => {
        if (!currentTabs.includes(activeTab)) {
            setActiveTab('Dashboard');
        }
    }, [mode]);

    const [riskScores, setRiskScores] = useState<RiskScores>({
        security: 0.5,
        scalability: 0.5,
        cost: 0.5,
        overengineering: 0.5
    });
    const [violations, setViolations] = useState<Violation[]>([]);
    const [costEstimate, setCostEstimate] = useState<number>(0);
    const [showForm, setShowForm] = useState(false);
    const [hasBlueprint, setHasBlueprint] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const [currQuiz, setCurrQuiz] = useState<QuizQuestion | null>(null);
    const [skills, setSkills] = useState<UserSkills | null>(null);
    const [scaleFailures, setScaleFailures] = useState<ScaleFailurePoint[]>([]);
    const [patterns, setPatterns] = useState<any[]>([]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'updateData':
                    if (message.riskScores) setRiskScores(message.riskScores);
                    if (message.violations) setViolations(message.violations);
                    if (message.costEstimate !== undefined) setCostEstimate(message.costEstimate);
                    if (message.hasBlueprint !== undefined) setHasBlueprint(message.hasBlueprint);
                    if (message.skills) setSkills(message.skills);
                    if (message.isDemo !== undefined) setIsDemo(message.isDemo);
                    if (message.scaleFailures) setScaleFailures(message.scaleFailures);
                    if (message.patterns) setPatterns(message.patterns);
                    if (message.mode) setMode(message.mode);
                    break;
                case 'setLoading':
                    setLoading(message.value);
                    break;
                case 'triggerQuiz':
                    if (mode === 'student') setCurrQuiz(message.quiz);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [mode]);

    const handleAction = (action: string, payload?: any) => {
        switch(action) {
            case 'showForm': setShowForm(true); break;
            case 'hideForm': setShowForm(false); break;
            case 'autoFixSecurity': vscode.postMessage({ type: 'autoFixSecurity' }); break;
            case 'startInterviewPrep': vscode.postMessage({ type: 'startInterviewPrep' }); break;
            case 'sendMessage': vscode.postMessage({ type: 'chatMessage', value: payload }); break;
        }
    };

    const handleGenerateBlueprint = (data: any) => {
        setLoading(true);
        setShowForm(false);
        vscode.postMessage({ type: 'generateBlueprint', value: data });
    };

    const handleQuizSubmit = (correct: boolean) => {
        vscode.postMessage({ type: 'quizResult', correct });
    };

    return (
        <div className="flex flex-col min-h-screen">
            {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><BlueprintForm onClose={() => setShowForm(false)} onSubmit={handleGenerateBlueprint} /></div>}
            {currQuiz && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><QuizModal quiz={currQuiz} onSubmit={handleQuizSubmit} onClose={() => setCurrQuiz(null)} /></div>}
            
            {violations.filter(v => v.severity === 'critical').length > 0 && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
                    <SecurityGateModal 
                        violations={violations.filter(v => v.severity === 'critical')}
                        onFixAll={() => vscode.postMessage({ type: 'autoFixSecurity' })}
                        onFixManually={() => vscode.postMessage({ type: 'onInfo', value: 'Please fix the highlighted lines in your editor.' })}
                    />
                </div>
            )}

            {/* Content Rendering */}
            <div className="flex-1 flex flex-col bg-app-bg text-text-main">
                {/* Previous Header with Learner/Engineer Toggle */}
                <header className="flex items-center justify-between px-4 py-4 border-b border-card-border">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-traycer-blue rounded-full"></div>
                        <span className="text-xl font-black italic tracking-tighter">DEVFORGE</span>
                    </div>
                    <div className="flex bg-[#111] p-0.5 rounded-lg border border-card-border">
                        <button 
                            onClick={() => setMode('student')}
                            className={`px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-md ${mode === 'student' ? 'bg-[#222] text-white' : 'text-text-dim hover:text-white'}`}
                        >
                            Learner
                        </button>
                        <button 
                            onClick={() => setMode('developer')}
                            className={`px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-md ${mode === 'developer' ? 'bg-[#222] text-white' : 'text-text-dim hover:text-white'}`}
                        >
                            Engineer
                        </button>
                    </div>
                </header>

                {/* Minimalist Tabs */}
                <div className="flex bg-[#181818] border-b border-card-border overflow-x-auto no-scrollbar">
                    {currentTabs.map(t => (
                        <button 
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-4 py-3 text-[12px] font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === t ? 'border-traycer-blue text-white bg-[#222]' : 'border-transparent text-text-dim hover:text-white'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="p-4 flex-1">
                    {activeTab === 'Live Map' && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <ArchitectureDiagram />
                        </div>
                    )}
                    
                    {mode === 'developer' ? (
                        <>
                            {activeTab === 'Dashboard' && <DeveloperDashboard riskScores={riskScores} violations={violations} costEstimate={costEstimate} hasBlueprint={hasBlueprint} onAction={handleAction} />}
                            {activeTab === 'Drift' && <DriftPanel violations={violations} hasBlueprint={hasBlueprint} onAction={handleAction} />}
                            {activeTab === 'Scale' && <ScalePanel scaleFailures={scaleFailures} />}
                            {activeTab === 'Cost' && <CostPanel costEstimate={costEstimate} />}
                        </>
                    ) : (
                        <>
                            {activeTab === 'Dashboard' && <StudentDashboard skills={skills} onAction={handleAction} />}
                            {activeTab === 'Skills' && <SkillsPanel skills={skills} />}
                            {activeTab === 'Patterns' && <PatternsPanel patterns={patterns} />}
                            {activeTab === 'Mentor' && <MentorPanel onSendMessage={(msg) => handleAction('sendMessage', msg)} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const rootId = document.getElementById('root');
if (rootId) {
    const root = createRoot(rootId);
    root.render(<LeftPanel />);
}
