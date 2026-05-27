/**
 * Maps VS Code's languageId values to the backend's Language literal type.
 * The backend uses a smaller controlled vocabulary; everything else maps to
 * "unknown" which the backend still accepts.
 */
import type { TextDocument } from 'vscode';

const MAP: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  javascriptreact: 'javascript',
  typescript: 'typescript',
  typescriptreact: 'typescript',
  rust: 'rust',
  go: 'go',
  solidity: 'solidity',
  terraform: 'terraform',
  hcl: 'terraform',
  yaml: 'yaml',
  json: 'json',
  jsonc: 'json',
};

export function detectLanguage(doc: TextDocument): string {
  return MAP[doc.languageId] ?? 'unknown';
}

/**
 * Heuristic: does this document look like AWS infrastructure code we should
 * scan? Used by the auto-on-save trigger to avoid hammering the API for
 * markdown files etc.
 */
export function shouldAutoAnalyze(doc: TextDocument): boolean {
  const id = doc.languageId;
  if (id === 'terraform' || id === 'hcl' || id === 'yaml') return true;
  if (id === 'python' || id === 'typescript' || id === 'javascript') {
    // Only auto-scan files with AWS SDK or IaC markers
    const text = doc.getText();
    return /aws|@aws-sdk|boto3|cdk|cloudformation/i.test(text);
  }
  return false;
}
