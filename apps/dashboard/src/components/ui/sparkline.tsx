'use client';

interface SparklineProps {
  data: number[];
  height?: number;
  color?: string;
  min?: number;
  max?: number;
}

/** Dependency-free responsive sparkline (area + line) scaled to its container. */
export function Sparkline({
  data,
  height = 48,
  color = 'hsl(var(--brand-500))',
  min,
  max,
}: SparklineProps) {
  const W = 600; // viewBox units; svg scales to container width
  const series = data.length >= 2 ? data : [data[0] ?? 0, data[0] ?? 0];
  const lo = min ?? Math.min(...series);
  const hi = max ?? Math.max(...series);
  const range = hi - lo || 1;
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W;
    const y = height - ((v - lo) / range) * (height - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${W},${height} L0,${height} Z`;
  const gid = `spark-${Math.abs(hashStr(color))}`;
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className="block"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r={3} fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
