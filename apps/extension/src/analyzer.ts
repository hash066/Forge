/**
 * Orchestrates: file → analysis + security scan + cost estimate, updates store.
 * Debounced so save-on-loop doesn't hammer the API.
 */
import * as vscode from 'vscode';
import { api, type CostEstimateResource } from './api';
import { store } from './store';
import { detectLanguage } from './language';
import { applySecurityFindings, maybeShowCriticalGate } from './features/security-gate';

const DEBOUNCE_MS = 600;
const debounceTimers = new Map<string, NodeJS.Timeout>();

export async function analyzeDocument(doc: vscode.TextDocument): Promise<void> {
  const key = doc.uri.toString();
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    key,
    setTimeout(() => {
      debounceTimers.delete(key);
      void runAnalysis(doc);
    }, DEBOUNCE_MS),
  );
}

async function runAnalysis(doc: vscode.TextDocument): Promise<void> {
  const code = doc.getText();
  if (!code.trim()) return;
  const language = detectLanguage(doc);

  store.patch({ isAnalyzing: true, lastAnalyzedFile: doc.uri.fsPath });

  // Three parallel calls. Each is independently fatal — failure of one doesn't
  // void the others (e.g. cost regex finds nothing but security scan still works).
  const [security, analysis, cost] = await Promise.allSettled([
    api.scanSecurity(code, language),
    api.analyzeCode(code, language),
    estimateCostFromCode(code, language),
  ]);

  if (security.status === 'fulfilled') {
    store.patch({ lastSecurityScan: security.value });
    applySecurityFindings(doc, security.value);
    void maybeShowCriticalGate(doc, security.value);
  } else {
    console.error('[devforge] security scan failed:', security.reason);
  }

  if (analysis.status === 'fulfilled') {
    store.patch({ lastAnalysis: analysis.value });
  } else {
    console.error('[devforge] analysis failed:', analysis.reason);
  }

  if (cost.status === 'fulfilled' && cost.value) {
    store.patch({ lastCostEstimate: cost.value });
  } else if (cost.status === 'rejected') {
    console.error('[devforge] cost estimate failed:', cost.reason);
  }

  store.patch({ isAnalyzing: false });
}

/**
 * Detect AWS resources in code and call /v1/cost. Returns null when nothing
 * cost-relevant is found, so the status bar doesn't show stale numbers.
 */
async function estimateCostFromCode(code: string, language: string) {
  const resources: CostEstimateResource[] = [];

  // Terraform style
  const tfMatches = code.matchAll(
    /resource\s+"(aws_\w+)"\s+"\w+"\s*\{([^}]*?)\}/gms,
  );
  for (const m of tfMatches) {
    const resourceType = mapTerraformType(m[1]!);
    if (!resourceType) continue;
    const block = m[2]!;
    resources.push({
      type: resourceType,
      configuration: parseTfBlock(block),
    });
  }

  // SDK heuristics (JS/Python). Lightweight — assumes one instance per detection.
  if (resources.length === 0) {
    if (/\bS3Client\b|boto3\.client\(['"]s3['"]\)/.test(code)) {
      resources.push({ type: 's3', configuration: { storage_gb: 100 } });
    }
    if (/\bDynamoDBClient\b|boto3\.client\(['"]dynamodb['"]\)/.test(code)) {
      resources.push({ type: 'dynamodb', configuration: {} });
    }
    if (/\bLambdaClient\b|boto3\.client\(['"]lambda['"]\)/.test(code)) {
      resources.push({ type: 'lambda', configuration: {} });
    }
  }

  void language; // reserved for future language-specific extraction
  if (resources.length === 0) return null;
  return await api.estimateCost(resources);
}

function mapTerraformType(tf: string): string | null {
  const map: Record<string, string> = {
    aws_instance: 'ec2',
    aws_db_instance: 'rds',
    aws_lambda_function: 'lambda',
    aws_s3_bucket: 's3',
    aws_elasticache_cluster: 'elasticache',
    aws_dynamodb_table: 'dynamodb',
    aws_api_gateway_rest_api: 'apigateway',
    aws_ecs_service: 'fargate',
  };
  return map[tf] ?? null;
}

function parseTfBlock(block: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*(\w+)\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    let value: unknown = m[2]!.trim();
    if (typeof value === 'string') {
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      } else if (value === 'true' || value === 'false') {
        value = value === 'true';
      } else if (/^-?\d+(\.\d+)?$/.test(value as string)) {
        value = Number(value);
      }
    }
    out[m[1]!] = value;
  }
  return out;
}
