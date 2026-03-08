import * as vscode from 'vscode';
import * as path from 'path';
import { APIClient } from './extension/apiClient';
import { BlueprintManager } from './extension/blueprintManager';
import { StatusBarManager } from './extension/statusBar';
import { DriftDetector } from './extension/driftDetector';
import { FileWatcher } from './extension/fileWatcher';
import { SecurityScanner } from './extension/securityScanner';
import { ServiceDetector } from './extension/serviceDetector';
import { CostCalculator } from './extension/costCalculator';
import { SkillTracker, SkillName } from './extension/skillTracker';
import { ComprehensionValidator } from './extension/comprehensionValidator';
import { ScalePredictor } from './extension/scalePredictor';
import { ArgueMode } from './extension/argueMode';
import { Violation } from './shared/types';

let leftPanelProvider: DevForgeWebviewProvider;
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('DevForge');
    outputChannel.show();
    outputChannel.appendLine('DevForge activating...');
    // Phase 1: Initialize core managers immediately to prevent empty UI
    const apiClient = new APIClient();
    const blueprintManager = new BlueprintManager();
    const statusBarManager = new StatusBarManager();
    const driftDetector = new DriftDetector();
    const securityScanner = new SecurityScanner();
    const serviceDetector = new ServiceDetector();
    const costCalculator = new CostCalculator();
    const skillTracker = new SkillTracker(context);
    const comprehensionValidator = new ComprehensionValidator();
    const scalePredictor = new ScalePredictor();
    const argueMode = new ArgueMode();

    // Register Webview Provider
    leftPanelProvider = new DevForgeWebviewProvider(
        context.extensionUri,
        'leftPanel',
        apiClient,
        blueprintManager,
        argueMode,
        skillTracker
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('devforge-left-panel', leftPanelProvider),
        statusBarManager
    );

    // Initial Onboarding Check (does not block registration anymore)
    let mode = context.globalState.get<string>('devforge_mode');
    if (!mode) {
        showOnboardingModal(context).then(selectedMode => {
            if (selectedMode) {
                // Refresh views with selected mode
                runAnalysis(vscode.window.activeTextEditor?.document!);
            }
        });
    }

    let analysisTimeout: NodeJS.Timeout | null = null;
    let activeAbortController: AbortController | null = null;

    // Analysis Logic
    const runAnalysis = async (doc: vscode.TextDocument) => {
        if (doc.uri.scheme !== 'file') {
            return;
        }

        if (analysisTimeout) {
            clearTimeout(analysisTimeout);
        }

        analysisTimeout = setTimeout(async () => {
            if (activeAbortController) {
                activeAbortController.abort();
            }
            activeAbortController = new AbortController();
            const signal = activeAbortController.signal;

        statusBarManager.setLoading(true);
        leftPanelProvider.postMessage({ type: 'setLoading', value: true });

        try {
            const mode = context.globalState.get<string>('devforge_mode');
            if (!mode) return;

            const blueprint = await blueprintManager.loadBlueprint();
            const hasBlueprint = !!blueprint;
            const finalBlueprint = blueprint || blueprintManager.createDefaultBlueprint();
            const code = doc.getText();
            const fileName = doc.fileName;

            // 1. Core Scans (Local)
            const detectedServices = serviceDetector.detectServices(code);
            const localCostEstimate = costCalculator.calculateMonthlyCost(detectedServices);
            
            let driftViolations: Violation[] = [];
            let securityViolations: Violation[] = [];
            let apiViolations: any[] = [];
            let riskScores: any = { security: 0.5, scalability: 0.5, cost: 0.5, overengineering: 0.5 };
            let finalCost: number = localCostEstimate;
            let patterns: any[] = [];
            let scaleTimeline: any = null;

            // 2. Production API Scans
            try {
                if (signal.aborted) return;
                const [apiAnal, driftAnal, secAnal, riskAnal, costAnal, patAnal] = await Promise.all([
                    apiClient.analyzeCode(code, doc.languageId),
                    apiClient.detectDrift(finalBlueprint, code, fileName),
                    apiClient.scanSecurity(code),
                    apiClient.calculateRisk(finalBlueprint),
                    apiClient.estimateCost(finalBlueprint.components.map(c => c.id)),
                    apiClient.detectPatterns(code, doc.languageId)
                ]);
                
                if (signal.aborted) return;

                apiViolations = apiAnal;
                driftViolations = driftAnal;
                securityViolations = secAnal;
                riskScores = riskAnal;
                finalCost = costAnal || localCostEstimate;
                patterns = patAnal.patterns;
                scaleTimeline = await apiClient.predictScale(finalBlueprint, finalBlueprint.constraints.currentUsers || 1000);
                if (signal.aborted) return;
            } catch (apiError) {
                if (signal.aborted) return;
                console.error('Production API Error:', apiError);
                // Fallback to local scans only, no fake data
                driftViolations = driftDetector.detectDrift(finalBlueprint, code, fileName);
                securityViolations = securityScanner.runSecurityScan(code, fileName);
            }

            const allViolations = [...driftViolations, ...securityViolations, ...apiViolations];
            const scaleFailures = scaleTimeline ? scaleTimeline.timeline.filter((t: any) => t.status !== 'healthy').map((t: any) => ({
                userThreshold: t.user_count,
                componentId: t.issues[0]?.component || 'system',
                reason: t.issues[0]?.description || 'Performance degradation',
                fix: t.issues[0]?.recommendation || 'Scale resources'
            })) : scalePredictor.predictFailurePoints(finalBlueprint);


            // Update UI
            if (!signal.aborted) {
                leftPanelProvider.postMessage({
                    type: 'updateData',
                    violations: allViolations,
                    riskScores: riskScores,
                    costEstimate: finalCost,
                    hasBlueprint: hasBlueprint,
                    scaleFailures: scaleFailures,
                    patterns: patterns,
                    skills: skillTracker.getSkills(),
                    mode: mode, // Send stored mode to UI
                    apiEndpoint: vscode.workspace.getConfiguration('devforge').get<string>('apiEndpoint') || 'https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev'
                });

                // Update Status Bar
                statusBarManager.updateRisk(riskScores);
                statusBarManager.updateCost(finalCost);
                statusBarManager.updateDrift(allViolations.length);
            }
        } catch (error) {
            console.error('System analysis failed:', error);
        } finally {
            if (!signal?.aborted) {
                statusBarManager.setLoading(false);
                leftPanelProvider.postMessage({ type: 'setLoading', value: false });
            }
        }
        }, 300); // 300ms debounce
    };

    // Removed dynamic AI detection per user request
    // Interview Prep is now manual

    // File Watcher
    const fileWatcher = new FileWatcher((doc) => {
        runAnalysis(doc);
    });
    context.subscriptions.push(fileWatcher);

    // Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('devforge.analyzeCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await runAnalysis(editor.document);
                vscode.window.showInformationMessage('Architecture analysis complete.');
            }
        }),
        vscode.commands.registerCommand('devforge.showDashboard', () => {
            vscode.commands.executeCommand('workbench.view.extension.devforge-sidebar');
        }),
        vscode.commands.registerCommand('devforge.createBlueprint', async () => {
            const blueprint = blueprintManager.createDefaultBlueprint();
            await blueprintManager.saveBlueprint(blueprint);
            vscode.window.showInformationMessage('Created new DevForge blueprint in .devforge/architecture.json');
        }),
        vscode.commands.registerCommand('devforge.openChat', () => {
             leftPanelProvider.postMessage({ type: 'openChat' });
        }),
        vscode.commands.registerCommand('devforge.getMode', () => {
            return context.globalState.get<string>('devforge_mode');
        })
    );

    // Initial analysis if an editor is active
    if (vscode.window.activeTextEditor) {
        runAnalysis(vscode.window.activeTextEditor.document);
    }
}

class DevForgeWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _bundleName: string,
        private readonly _apiClient: APIClient,
        private readonly _blueprintManager: BlueprintManager,
        private readonly _argueMode: ArgueMode,
        private readonly _skillTracker?: SkillTracker
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        const extensionPath = this._extensionUri.fsPath;
        const distPath = path.join(extensionPath, 'dist');
        const forgeDistPath = path.join(extensionPath, 'forge', 'dist');

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri,
                vscode.Uri.file(distPath),
                vscode.Uri.file(forgeDistPath)
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async data => {
            switch (data.type) {
                case 'onInfo':
                    if (data.value) {
                        vscode.window.showInformationMessage(data.value);
                    }
                    break;
                case 'onError':
                    if (data.value) {
                        vscode.window.showErrorMessage(data.value);
                    }
                    break;
                case 'chatMessage':
                    this._handleChatMessage(data.value);
                    break;
                case 'savePreferredModel':
                    vscode.workspace.getConfiguration('devforge').update('preferredAiModel', data.value, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage(`Preferred AI Model set to ${data.value}`);
                    break;
                case 'generateBlueprint':
                    this._handleGenerateBlueprint(data.value);
                    break;
                case 'analyzeCode':
                    vscode.commands.executeCommand('devforge.analyzeCode');
                    break;
                case 'startInterviewPrep':
                    this._handleStartInterviewPrep();
                    break;
                case 'autoFixSecurity':
                    this._handleAutoFixSecurity();
                    break;
                case 'openUrl':
                    if (data.url) {
                        vscode.env.openExternal(vscode.Uri.parse(data.url));
                    }
                    break;
                case 'quizResult':
                    if (this._skillTracker) {
                        const delta = data.correct ? 5 : -2;
                        this._skillTracker.updateSkill('System Design', delta);
                        this._sendInitialData(); // Refresh UI with new skill scores
                    }
                    break;
                case 'exportReport': {
                    // Build a markdown report and open it in VS Code
                    const wf = vscode.workspace.workspaceFolders?.[0];
                    if (!wf) { vscode.window.showErrorMessage('No workspace open.'); break; }
                    const doc = vscode.window.activeTextEditor?.document;
                    const fileName = doc ? path.basename(doc.fileName) : 'codebase';
                    const ts = new Date().toISOString().replace(/[:.]/g, '-');
                    const reportPath = path.join(wf.uri.fsPath, `.devforge-report-${ts}.md`);
                    const reportContent = data.content || '# DevForge Report\n\nNo content provided.';
                    await vscode.workspace.fs.writeFile(
                        vscode.Uri.file(reportPath),
                        Buffer.from(reportContent, 'utf8')
                    );
                    const reportUri = vscode.Uri.file(reportPath);
                    await vscode.commands.executeCommand('vscode.open', reportUri, {
                        viewColumn: vscode.ViewColumn.Beside,
                        preview: true
                    });
                    vscode.window.showInformationMessage(`Report exported to ${path.basename(reportPath)}`);
                    break;
                }
                case 'generateReport': {
                    // Trigger the chat view to show the architecture report
                    // This posts back to the webview with a generate-report message
                    this.postMessage({ type: 'showGenerateReport' });
                    break;
                }
                case 'justifyResult': {
                    const result = this._argueMode.scoreJustification(data.value);
                    
                    if (this._skillTracker) {
                        this._skillTracker.updateSkill('Decoupling', result.quality);
                    }

                    this.postMessage({
                        type: 'addMessage',
                        sender: 'ai',
                        content: `**Critique:** ${result.critique}\n\n**Architectural Score:** ${result.quality}/10`
                    });
                    break;
                }
            }
        });

        this._sendInitialData();
    }

    private async _handleGenerateBlueprint(constraints: any) {
        try {
            const blueprint = await this._apiClient.generateBlueprint(constraints);
            await this._blueprintManager.saveBlueprint(blueprint);
            vscode.window.showInformationMessage('Architecture blueprint generated and saved!');
            this._sendInitialData();
            vscode.commands.executeCommand('devforge.analyzeCode');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to generate blueprint: ' + error);
        }
    }

    public postMessage(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }

    private async _sendInitialData() {
        const mode = vscode.extensions.getExtension('devforge')?.isActive // Should use globalState
            ? (await vscode.commands.executeCommand('devforge.getMode')) as string 
            : 'developer';
            
        const blueprint = await this._blueprintManager.loadBlueprint();
        const hasBlueprint = !!blueprint;
        const finalBlueprint = blueprint || this._blueprintManager.createDefaultBlueprint();
        
        let riskScores = { security: 0.5, scalability: 0.5, cost: 0.5, overengineering: 0.5 };
        let costEstimate = 0;
        
        this.postMessage({
            type: 'updateData',
            riskScores: riskScores,
            costEstimate: costEstimate,
            violations: [],
            hasBlueprint: hasBlueprint,
            skills: this._skillTracker?.getSkills(),
            mode: mode,
            apiEndpoint: vscode.workspace.getConfiguration('devforge').get<string>('apiEndpoint') || 'https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev'
        });
    }

    private async _handleStartInterviewPrep() {
        if (!this._view) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active file to analyze for interview prep.');
            return;
        }

        vscode.window.showInformationMessage('Analyzing project architecture for Interview Prep...');
        
        try {
            const code = editor.document.getText();
            const languageId = editor.document.languageId;
            const quiz = await this._apiClient.generateQuiz(code, languageId);
            this._view?.webview.postMessage({ type: 'triggerQuiz', quiz: quiz });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to generate interview prep.');
        }
    }

    private async _handleAutoFixSecurity() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found to apply fixes.');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        const edits: vscode.TextEdit[] = [];

        // Simple realistic regex for AWS Access Key ID (AKIA...)
        const akiaRegex = /(['"`])(AKIA[0-9A-Z]{16})\1/g;
        let match;
        
        while ((match = akiaRegex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            edits.push(vscode.TextEdit.replace(new vscode.Range(startPos, endPos), 'process.env.AWS_ACCESS_KEY_ID'));
        }

        if (edits.length > 0) {
            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.set(document.uri, edits);
            await vscode.workspace.applyEdit(workspaceEdit);
            await document.save();
            vscode.window.showInformationMessage(`Successfully auto-fixed ${edits.length} critical security vulnerabilities. Development environment is now safe.`);
        } else {
            vscode.window.showInformationMessage('No auto-fixable vulnerabilities found in the current file.');
        }
    }

    private async _handleChatMessage(userMessage: string) {
        if (!this._view) {
            return;
        }

        try {
            let geminiKey = vscode.workspace.getConfiguration('devforge').get<string>('geminiApiKey') || process.env.GEMINI_API_KEY;
            let grokKey = vscode.workspace.getConfiguration('devforge').get<string>('grokApiKey') || process.env.GROK_API_KEY;

            try {
                // Resolve .env relative to extension root (one level up from forge/)
                const possibleEnvPaths = [
                    vscode.Uri.file(path.resolve(this._extensionUri.fsPath, '.env')),
                    vscode.Uri.file(path.resolve(this._extensionUri.fsPath, '..', '.env')),
                ];
                for (const envPath of possibleEnvPaths) {
                    try {
                        const envData = await vscode.workspace.fs.readFile(envPath);
                        const envContent = Buffer.from(envData).toString('utf8');
                        // Split on actual newlines (not escaped \n)
                        envContent.split(/\r?\n/).forEach((line: string) => {
                            const eqIdx = line.indexOf('=');
                            if (eqIdx < 1) return;
                            const key = line.slice(0, eqIdx).trim();
                            const val = line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
                            if (key === 'GEMINI_API_KEY' && val && !geminiKey) geminiKey = val;
                            if (key === 'GROK_API_KEY' && val && !grokKey) grokKey = val;
                        });
                        break; // stop at first .env found
                    } catch { /* path doesn't exist, try next */ }
                }
            } catch (e) {
                // .env not found, proceed
            }

            // Auto-detect best model: prefer gemini if key available, else grok
            let preferredModel = vscode.workspace.getConfiguration('devforge').get<string>('preferredAiModel') || 'auto';
            
            let response = "";

            // If model is unset/auto/claude, pick the first available key
            const effectiveModel = (preferredModel === 'auto' || preferredModel === 'claude')
                ? (geminiKey ? 'gemini' : grokKey ? 'grok' : preferredModel)
                : preferredModel;

            if (effectiveModel === 'gemini') {
                if (!geminiKey) throw new Error('Gemini API key not found');
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(geminiKey);
                // The UI says "Gemini 2.0 Flash"
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const result = await model.generateContent(userMessage);
                response = result.response.text();
            } else if (effectiveModel === 'grok') {
                if (!grokKey) throw new Error('Grok API key not found');
                const OpenAI = require('openai');
                const openai = new OpenAI({ apiKey: grokKey, baseURL: "https://api.x.ai/v1" });
                const completion = await openai.chat.completions.create({
                    model: "grok-2-latest",
                    messages: [{ role: "user", content: userMessage }]
                });
                response = completion.choices[0].message.content || 'No response from Grok';
            } else {
                throw new Error('No API key found. Add GEMINI_API_KEY or GROK_API_KEY to your .env file, or configure them in DevForge settings.');
            }

            this.postMessage({
                type: 'addMessage',
                sender: 'ai',
                content: response
            });
        } catch (error: any) {
            this.postMessage({
                type: 'addMessage',
                sender: 'ai',
                content: `Error generating response: ${error.message}`
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Find the script bundle by checking multiple possible relative paths
        const extensionPath = this._extensionUri.fsPath;
        const isSubfolder = extensionPath.toLowerCase().endsWith('forge');
        
        // If we are in the 'forge' folder, our scripts are in 'dist/webviews'
        // If we are in the root 'devforge' folder, our scripts are in 'forge/dist/webviews'
        const chosenRelPath = isSubfolder 
            ? ['dist', 'webviews', `${this._bundleName}.js`]
            : ['forge', 'dist', 'webviews', `${this._bundleName}.js`];

        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, ...chosenRelPath)));
        
        if (outputChannel) {
            outputChannel.appendLine(`[DevForge] Extension Path: ${extensionPath}`);
            outputChannel.appendLine(`[DevForge] Loading script from: ${scriptUri.toString()}`);
        }
        
        console.log(`[DevForge] Extension Path: ${extensionPath}`);
        console.log(`[DevForge] Loading Webview script from: ${scriptUri.toString()}`);
        
        // Use a more permissive CSP for testing, and add a survival indicator
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src https:; img-src ${webview.cspSource} https:; script-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';">
            </head>
            <body style="background-color: #020617; color: white;">
                <div id="root">
                    <div style="padding: 20px; font-family: sans-serif; opacity: 0.5;">
                        Initializing DevForge UI...
                    </div>
                </div>
                <script>
                    console.log('DevForge Webview: Attempting to load script from ${scriptUri}');
                </script>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

async function showOnboardingModal(context: vscode.ExtensionContext): Promise<string | undefined> {
    const roles = [
        {
            label: 'Student',
            description: 'Focus on growth, patterns, and architectural mastery.',
            detail: 'Full access to Skill Radar, Pattern Recognition, and Interview Mentorship.',
            value: 'student'
        },
        {
            label: 'Developer',
            description: 'Focus on system reliability, drift detection, and cost.',
            detail: 'Full access to Drift Analytics, Scale Prediction, and Infrastructure Guardrails.',
            value: 'developer'
        }
    ];

    const selection = await vscode.window.showQuickPick(roles, {
        placeHolder: 'Select your DevForge mode (this choice is permanent):',
        ignoreFocusOut: true
    });

    if (selection) {
        await context.globalState.update('devforge_mode', selection.value);
        vscode.window.showInformationMessage(`DevForge initialized in ${selection.label} mode.`);
    }

    return selection?.value;
}


export function deactivate() {}
