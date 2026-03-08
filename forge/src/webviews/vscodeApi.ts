// @ts-ignore
export const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : { postMessage: (msg: any) => console.log('VSCode API not available', msg) };
