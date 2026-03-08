import * as vscode from 'vscode';

export class FileWatcher {
    private disposable: vscode.Disposable;

    constructor(onFileChange: (document: vscode.TextDocument) => void) {
        const subscriptions: vscode.Disposable[] = [];

        // Watch for file saves
        vscode.workspace.onDidSaveTextDocument((doc) => {
            onFileChange(doc);
        }, null, subscriptions);

        // Also watch for text changes (debounced or on blur might be better for performance, but save is a good trigger)
        vscode.workspace.onDidChangeTextDocument((event) => {
            // We could analyze on every change, but for now let's stick to simple triggers
        }, null, subscriptions);

        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    public dispose() {
        this.disposable.dispose();
    }
}
