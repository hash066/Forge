/** Presentation helpers: map domain values → branded Tailwind classes + labels. */

export interface Palette {
  text: string;
  bg: string;
  border: string;
  dot: string;
}

export function severityPalette(severity: string): Palette {
  switch (severity) {
    case 'critical':
      return { text: 'text-critical', bg: 'bg-critical/10', border: 'border-critical/30', dot: 'bg-critical' };
    case 'high':
      return { text: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/30', dot: 'bg-brand-500' };
    case 'medium':
      return { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', dot: 'bg-warning' };
    case 'low':
      return { text: 'text-info', bg: 'bg-info/10', border: 'border-info/30', dot: 'bg-info' };
    default:
      return { text: 'text-foreground-tertiary', bg: 'bg-foreground/5', border: 'border-subtle', dot: 'bg-foreground-tertiary' };
  }
}

export interface StatusMeta {
  label: string;
  palette: Palette;
}

export function statusMeta(status: string): StatusMeta {
  switch (status) {
    case 'detected':
      return { label: 'Detected', palette: severityPalette('high') };
    case 'diagnosing':
      return { label: 'Diagnosing', palette: { text: 'text-ai', bg: 'bg-ai/10', border: 'border-ai/30', dot: 'bg-ai' } };
    case 'suggested':
      return { label: 'Awaiting approval', palette: severityPalette('low') };
    case 'remediating':
      return { label: 'Remediating', palette: { text: 'text-ai', bg: 'bg-ai/10', border: 'border-ai/30', dot: 'bg-ai' } };
    case 'resolved':
      return { label: 'Resolved', palette: { text: 'text-verified', bg: 'bg-verified/10', border: 'border-verified/30', dot: 'bg-verified' } };
    case 'failed':
      return { label: 'Failed', palette: severityPalette('critical') };
    default:
      return { label: status, palette: severityPalette('info') };
  }
}

export function riskPalette(risk: string): Palette {
  return severityPalette(risk === 'high' ? 'critical' : risk === 'medium' ? 'medium' : 'low');
}

const ACTION_LABELS: Record<string, string> = {
  restart_pod: 'Restart pod',
  rollback: 'Roll back deployment',
  set_resources: 'Adjust resources',
  scale: 'Scale workload',
  patch_image: 'Patch image / config',
  adjust_probe: 'Tune health probe',
  add_limits: 'Add resource limits',
  cordon_drain: 'Cordon & drain node',
  none: 'No action',
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

const CATEGORY_LABELS: Record<string, string> = {
  reliability: 'Reliability',
  resource: 'Resource',
  config: 'Config',
  image: 'Image',
  security: 'Security',
  cost: 'Cost',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function timeAgo(iso: string): string {
  // Backend timestamps are UTC; SQLite returns them tz-naive. If no timezone
  // marker is present, treat the value as UTC so local-timezone clients don't skew.
  const normalized = /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`;
  const then = new Date(normalized).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function confidencePct(c: number): string {
  return `${Math.round((c ?? 0) * 100)}%`;
}
