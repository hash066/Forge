import * as vscode from 'vscode';

export class FileWatcher {
    private disposable: vscode.Disposable;

    constructor(onFileChange: (document: vscode.TextDocument) => void) {
        const subscriptions: vscode.Disposable[] = [];

        // Watch for file saves
        vscode.workspace.onDidSaveTextDocument((doc) => {
            onFileChange(doc);
        }, null, subscriptions);


        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    public dispose() {
        this.disposable.dispose();
    }
}
