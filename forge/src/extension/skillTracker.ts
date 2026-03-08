import * as vscode from 'vscode';

export type SkillName = 'Security' | 'Error Handling' | 'System Design' | 'Performance' | 'Decoupling' | 'Inclusion';

export interface UserSkills {
    scores: Record<SkillName, number>;
    generationRatio: number; // Ratio of AI lines to human lines
}

export class SkillTracker {
    private readonly STORAGE_KEY = 'devforge.userSkills';
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public getSkills(): UserSkills {
        const stored = this.context.workspaceState.get<UserSkills>(this.STORAGE_KEY);
        if (stored) {
            return stored;
        }

        return {
            scores: {
                'Security': 50,
                'Error Handling': 50,
                'System Design': 50,
                'Performance': 50,
                'Decoupling': 50,
                'Inclusion': 50
            },
            generationRatio: 0.5
        };
    }

    public updateSkill(skill: SkillName, delta: number): void {
        const skills = this.getSkills();
        skills.scores[skill] = Math.max(0, Math.min(100, skills.scores[skill] + delta));
        this.context.workspaceState.update(this.STORAGE_KEY, skills);
    }

    public updateGenerationRatio(aiLines: number, humanLines: number): void {
        const skills = this.getSkills();
        const total = aiLines + humanLines;
        if (total > 0) {
            skills.generationRatio = aiLines / total;
            this.context.workspaceState.update(this.STORAGE_KEY, skills);
        }
    }
}
