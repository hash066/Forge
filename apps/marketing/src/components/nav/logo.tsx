/**
 * DevForge logomark — abstract anvil/forge motif with brand gradient stroke.
 * Inline SVG so it inherits text color and gradient definitions in-page.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="df-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="hsl(var(--brand-500))" />
          <stop offset="1" stopColor="hsl(var(--magenta-500))" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        stroke="url(#df-logo-grad)"
        strokeWidth="1.5"
      />
      {/* Anvil silhouette */}
      <path
        d="M9 14h6l1-2h4v6h-4l-1 2H9v-2h2v-2H9z"
        fill="url(#df-logo-grad)"
      />
      {/* Spark */}
      <circle cx="22" cy="11" r="1.5" fill="hsl(var(--verified-500))" />
    </svg>
  );
}
