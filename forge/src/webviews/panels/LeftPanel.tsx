import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings } from 'lucide-react';
import SecurityGateModal from '../components/SecurityGateModal';
import BlueprintForm from '../components/BlueprintForm';
import QuizModal from '../components/QuizModal';
// import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { LiveMap } from '../components/LiveMap';
import { DeveloperDashboard } from '../components/developer/DeveloperDashboard';
import { DriftPanel } from '../components/developer/DriftPanel';
import { ScalePanel } from '../components/developer/ScalePanel';
import { CostPanel } from '../components/developer/CostPanel';
import { StudentDashboard } from '../components/student/StudentDashboard';
import { SkillsPanel } from '../components/student/SkillsPanel';
import { PatternsPanel } from '../components/student/PatternsPanel';
import { MentorPanel } from '../components/student/MentorPanel';
import ChatView from '../components/chat/ChatView';
import { DashboardChatTrigger } from '../components/chat/ChatInput';
import '../styles.css';
import { RiskScores, Violation } from '../../shared/types';
import { QuizQuestion } from '../../extension/comprehensionValidator';
import { UserSkills } from '../../extension/skillTracker';
import { ScaleFailurePoint } from '../../extension/scalePredictor';

import { vscode } from '../vscodeApi';

const LeftPanel = () => {
    const [view, setView] = useState<'DASHBOARD' | 'CHAT'>('DASHBOARD');
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
    const [dismissedViolationsCode, setDismissedViolationsCode] = useState<string>('');
    const [apiEndpoint, setApiEndpoint] = useState<string>('https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev');

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
                    if (message.apiEndpoint) setApiEndpoint(message.apiEndpoint);
                    break;
                case 'setLoading':
                    setLoading(message.value);
                    break;
                case 'triggerQuiz':
                    if (mode === 'student') setCurrQuiz(message.quiz);
                    break;
                case 'showGenerateReport':
                    setView('CHAT');
                    break;
                case 'openChat':
                    setView('CHAT');
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
            case 'generateReport':
                vscode.postMessage({ type: 'generateReport' });
                setView('CHAT');
                break;
            case 'exportReport':
                vscode.postMessage({ type: 'exportReport', content: payload });
                break;
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

    useEffect(() => {
        if (activeTab === 'Mentor') {
            setView('CHAT');
            setActiveTab('Dashboard'); // Reset tab so when user comes back they aren't stuck
        }
    }, [activeTab]);

    if (view === 'CHAT') {
        return <ChatView onBack={() => setView('DASHBOARD')} />;
    }

    return (
        <div className="flex flex-col h-screen bg-app-bg text-text-main overflow-hidden">
            {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><BlueprintForm onClose={() => setShowForm(false)} onSubmit={handleGenerateBlueprint} /></div>}
            {currQuiz && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><QuizModal quiz={currQuiz} onSubmit={handleQuizSubmit} onClose={() => setCurrQuiz(null)} /></div>}
            
            {violations.filter(v => v.severity === 'critical').length > 0 && 
             violations.filter(v => v.severity === 'critical').map(v => v.description).join('|') !== dismissedViolationsCode && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
                    <SecurityGateModal 
                        violations={violations.filter(v => v.severity === 'critical')}
                        onFixAll={() => vscode.postMessage({ type: 'autoFixSecurity' })}
                        onFixManually={() => vscode.postMessage({ type: 'onInfo', value: 'Please fix the highlighted lines in your editor.' })}
                        onDismiss={() => setDismissedViolationsCode(violations.filter(v => v.severity === 'critical').map(v => v.description).join('|'))}
                    />
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between px-4 py-4 border-b border-card-border bg-header-bg shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-traycer-blue rounded-full shadow-[0_0_10px_rgba(163,163,163,0.2)]"></div>
                    <span className="text-xl font-black italic tracking-tighter">DEVFORGE</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-[#1a1a1a] p-0.5 rounded-lg border border-card-border/50">
                        <button 
                            onClick={() => setMode('student')}
                            className={`px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-md ${mode === 'student' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-text-dim hover:text-white'}`}
                        >
                            Student
                        </button>
                        <button 
                            onClick={() => setMode('developer')}
                            className={`px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-md ${mode === 'developer' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-text-dim hover:text-white'}`}
                        >
                            Developer
                        </button>
                    </div>
                    <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors group">
                        <Settings size={18} className="text-text-dim group-hover:text-white transition-colors" />
                    </button>
                </div>
            </header>

            {/* Tabs Area */}
            <div className="flex bg-header-bg border-b border-card-border overflow-x-auto no-scrollbar shrink-0">
                {currentTabs.map(t => (
                    <button 
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeTab === t ? 'border-traycer-blue text-white bg-[#222]' : 'border-transparent text-text-dim hover:text-white'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Main Content Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="p-4 space-y-6">
                    {activeTab === 'Live Map' && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <LiveMap code={undefined} services={[]} />
                        </div>
                    )}
                    
                    {mode === 'developer' ? (
                        <>
                            {activeTab === 'Dashboard' && <DeveloperDashboard riskScores={riskScores} violations={violations} costEstimate={costEstimate} hasBlueprint={hasBlueprint} onAction={handleAction} />}
                            {activeTab === 'Drift' && <DriftPanel violations={violations} hasBlueprint={hasBlueprint} onAction={handleAction} />}
                            {activeTab === 'Scale' && <ScalePanel scaleFailures={scaleFailures} />}
                            {activeTab === 'Cost' && <CostPanel costEstimate={costEstimate} onAction={handleAction} />}
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

            {/* Fixed Chat Trigger Area */}
            <DashboardChatTrigger onClick={() => setView('CHAT')} />
        </div>
    );
};

window.onerror = function(msg, url, lineNo, columnNo, error) {
    const rootId = document.getElementById('root');
    if (rootId) {
        rootId.innerHTML = `<div style="color:red;background:black;padding:20px;z-index:9999;position:fixed;inset:0;">
            <h3>Runtime Error!</h3>
            <p>${msg}</p>
            <pre style="white-space:pre-wrap;font-size:10px">${error?.stack}</pre>
        </div>`;
    }
    return false;
};

const rootId = document.getElementById('root');
if (rootId) {
    try {
        const root = createRoot(rootId);
        root.render(<LeftPanel />);
    } catch (err: any) {
        rootId.innerHTML = `<div style="color:red">Sync Error: ${err.message}</div>`;
    }
}
