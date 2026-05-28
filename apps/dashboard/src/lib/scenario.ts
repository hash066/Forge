import type { IncidentContext } from '@devforge/core';

/**
 * Browser-driven demo scenario. Mirrors the operator's pod fixtures so a judge
 * can watch the full self-healing loop by clicking one button — no terminal,
 * no cluster. Each context is POSTed to /v1/k8s/diagnose, then remediated.
 */
export const SCENARIO: IncidentContext[] = [
  {
    namespace: 'shop',
    kind: 'Pod',
    name: 'payments-api-6f9c7d8b5c-q4x2t',
    reason: 'CrashLoopBackOff',
    severity: 'critical',
    message: 'Back-off 5m0s restarting failed container payments-api',
    events: ['BackOff: Back-off restarting failed container', 'Unhealthy: liveness probe failed'],
  },
  {
    namespace: 'shop',
    kind: 'Pod',
    name: 'cart-api-7c5d9f8b6d-x2k9p',
    reason: 'OOMKilled',
    severity: 'high',
    message: 'Container cart-api was OOMKilled (exit code 137)',
    spec_excerpt: {
      containers: [{ name: 'cart-api', resources: { limits: { memory: '256Mi' } } }],
    },
  },
  {
    namespace: 'ml',
    kind: 'Pod',
    name: 'recommender-5b7d6c9f4a-mn8qz',
    reason: 'ImagePullBackOff',
    severity: 'high',
    message: 'Back-off pulling image "ml/recommender:v3.1.0-gpu": not found',
  },
  {
    namespace: 'observability',
    kind: 'Pod',
    name: 'log-forwarder-9d8c7b6a5f-tt71k',
    reason: 'PrivilegedPod',
    severity: 'high',
    message: 'Container log-forwarder runs privileged with hostPath /var/log',
  },
  {
    namespace: 'data',
    kind: 'Pod',
    name: 'analytics-worker-77b4c5d6e8-rs44m',
    reason: 'MissingLimits',
    severity: 'low',
    message: 'Container analytics-worker has no resource limits',
  },
  {
    namespace: 'ml',
    kind: 'Pod',
    name: 'batch-trainer-5f4b3c2d1e-zz09x',
    reason: 'Unschedulable',
    severity: 'medium',
    message: '0/3 nodes available: 3 Insufficient cpu, 3 Insufficient memory',
  },
];

export const BASELINE = {
  nodes: 3,
  pods_total: 24,
  namespaces: 6,
  monthly_cost_usd: 540,
};
