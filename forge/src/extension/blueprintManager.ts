import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Blueprint } from '../shared/types';

export class BlueprintManager {
    private workspaceRoot: string | undefined;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    }

    private getFilePath(): string | undefined {
        if (!this.workspaceRoot) {
            return undefined;
        }
        return path.join(this.workspaceRoot, '.devforge', 'architecture.json');
    }

    private ensureDirectory(): void {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspaceRoot) {
            return;
        }
        const dir = path.join(workspaceRoot, '.devforge');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    public async loadBlueprint(): Promise<Blueprint | undefined> {
        const filePath = this.getFilePath();
        if (!filePath || !fs.existsSync(filePath)) {
            return undefined;
        }

        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data) as Blueprint;
        } catch (error) {
            console.error('Failed to load blueprint:', error);
            return undefined;
        }
    }

    public async saveBlueprint(blueprint: Blueprint): Promise<void> {
        this.ensureDirectory();
        const filePath = this.getFilePath();
        if (!filePath) {
            return;
        }

        try {
            fs.writeFileSync(filePath, JSON.stringify(blueprint, null, 2), 'utf8');
        } catch (error) {
            console.error('Failed to save blueprint:', error);
        }
    }

    public createDefaultBlueprint(): Blueprint {
        return {
            constraints: {
                scale: 'startup',
                budget: 1000,
                teamSize: 3,
                architectureType: 'monolith'
            },
            components: [],
            connections: [],
            version: '1.0.0'
        };
    }

    public validateBlueprint(blueprint: any): blueprint is Blueprint {
        return (
            blueprint &&
            typeof blueprint.constraints === 'object' &&
            Array.isArray(blueprint.components) &&
            Array.isArray(blueprint.connections) &&
            typeof blueprint.version === 'string'
        );
    }
}
