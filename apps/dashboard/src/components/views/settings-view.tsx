'use client';

import { useEffect, useState } from 'react';
import { Cpu, Save, Server, ShieldCheck } from 'lucide-react';
import type { RemediationPolicySettings, SettingsResponse } from '@devforge/core';
import { Field, Input, SegmentedControl, Select, Switch, TagInput } from '@/components/ui/form';

const ACTIONS = [
  'restart_pod',
  'rollback',
  'set_resources',
  'scale',
  'patch_image',
  'adjust_probe',
  'add_limits',
  'cordon_drain',
];

interface SettingsViewProps {
  fetchSettings: () => Promise<SettingsResponse>;
  saveSettings: (p: Partial<RemediationPolicySettings>) => Promise<SettingsResponse>;
  apiUrl: string;
  tenant: string;
  cluster: string;
}

export function SettingsView({ fetchSettings, saveSettings, apiUrl, tenant, cluster }: SettingsViewProps) {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [policy, setPolicy] = useState<RemediationPolicySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setSettings(s);
        setPolicy(s.policy);
      })
      .catch(() => {});
  }, [fetchSettings]);

  if (!policy || !settings) {
    return <div className="panel p-6 text-sm text-foreground-tertiary">Loading settings…</div>;
  }

  const update = (patch: Partial<RemediationPolicySettings>) => setPolicy({ ...policy, ...patch });
  const toggleAction = (a: string) =>
    update({
      allowed_actions: policy.allowed_actions.includes(a)
        ? policy.allowed_actions.filter((x) => x !== a)
        : [...policy.allowed_actions, a],
    });
  const save = async () => {
    setSaving(true);
    try {
      const s = await saveSettings(policy);
      setSettings(s);
      setPolicy(s.policy);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* AI status (read-only; key lives in .env for security) */}
      <div className="panel p-5">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-brand-400" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground-tertiary">
            AI engine
          </span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <Row label="Provider" value={settings.ai_provider} />
          <Row label="Model" value={settings.ai_model} mono />
          <Row
            label="Status"
            value={settings.ai_connected ? '● live' : 'offline (deterministic)'}
            valueClass={settings.ai_connected ? 'text-verified' : 'text-foreground-tertiary'}
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-foreground-tertiary">
          The API key is read from <span className="font-mono">OPENAI_API_KEY</span> in the control
          plane&rsquo;s <span className="font-mono">.env</span> (never stored here). With no key, the
          deterministic SRE engine runs so the product still works.
        </p>
      </div>

      {/* Cluster connection */}
      <div className="panel p-5">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-brand-400" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground-tertiary">
            Cluster connection
          </span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <Row label="Control plane" value={apiUrl} mono />
          <Row label="Tenant" value={tenant} mono />
          <Row label="Cluster" value={cluster} mono />
        </div>
        <div className="mt-4 rounded-lg border border-subtle bg-background/50 p-3">
          <p className="text-xs text-foreground-tertiary">Connect a real cluster:</p>
          <code className="mt-1 block font-mono text-[11px] text-verified-300">
            helm install devforge-os ./deploy/helm/devforge-os
          </code>
        </div>
      </div>

      {/* Remediation policy — the real, behavior-changing control */}
      <div className="panel p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-400" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground-tertiary">
              Remediation policy
            </span>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3.5 py-1.5 text-xs font-semibold text-background transition hover:opacity-95 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : 'Save policy'}
          </button>
        </div>

        <p className="mt-2 text-sm text-foreground-tertiary">
          Governs the self-healing loop. This actually changes behaviour: <b>Auto</b> heals within the
          limits below, <b>Suggest</b> waits for your approval, <b>Off</b> only proposes.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <Field label="Mode" hint="How autonomous DevForge is allowed to be.">
            <SegmentedControl
              value={policy.mode}
              onChange={(mode) => update({ mode })}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'suggest', label: 'Suggest' },
                { value: 'off', label: 'Off' },
              ]}
            />
          </Field>

          <Field label="Max auto-apply risk" hint="Only fixes at or below this risk auto-apply.">
            <Select
              value={policy.max_auto_risk}
              onChange={(max_auto_risk) => update({ max_auto_risk })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          </Field>

          <Field label="Excluded namespaces" hint="Incidents here are never auto-remediated.">
            <TagInput
              values={policy.excluded_namespaces}
              onChange={(excluded_namespaces) => update({ excluded_namespaces })}
              placeholder="add namespace + Enter"
            />
          </Field>

          <Field label="Notify webhook" hint="Optional Slack/HTTP webhook for remediations.">
            <Input
              value={policy.notify_webhook}
              onChange={(e) => update({ notify_webhook: e.target.value })}
              placeholder="https://hooks.slack.com/…"
            />
          </Field>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-[13px] font-medium text-foreground">Allowed auto-apply actions</p>
          <p className="mb-3 text-xs text-foreground-tertiary">
            None selected = all actions allowed. Select to restrict which fixes may auto-apply.
          </p>
          <div className="flex flex-wrap gap-3">
            {ACTIONS.map((a) => (
              <label key={a} className="inline-flex items-center gap-2 text-sm text-foreground-secondary">
                <Switch checked={policy.allowed_actions.includes(a)} onChange={() => toggleAction(a)} />
                <span className="font-mono text-xs">{a}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  valueClass = 'text-foreground',
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-foreground-tertiary">{label}</span>
      <span className={`${mono ? 'font-mono text-[13px]' : ''} ${valueClass}`}>{value}</span>
    </div>
  );
}
