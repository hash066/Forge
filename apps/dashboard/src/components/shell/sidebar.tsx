'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  MessageSquareText,
  ScrollText,
  Settings as SettingsIcon,
  ShieldAlert,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type ViewKey =
  | 'overview'
  | 'topology'
  | 'incidents'
  | 'lab'
  | 'ask'
  | 'cost'
  | 'security'
  | 'audit'
  | 'settings';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'topology', label: 'Topology', icon: GitBranch },
  { key: 'incidents', label: 'Incidents', icon: Activity },
  { key: 'lab', label: 'Lab', icon: FlaskConical },
  { key: 'ask', label: 'Ask', icon: MessageSquareText },
  { key: 'cost', label: 'Cost', icon: Wallet },
  { key: 'security', label: 'Security', icon: ShieldAlert },
  { key: 'audit', label: 'Audit', icon: ScrollText },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

interface SidebarProps {
  active: ViewKey;
  onSelect: (key: ViewKey) => void;
  openCount?: number;
}

export function Sidebar({ active, onSelect, openCount = 0 }: SidebarProps) {
  return (
    <aside className="sticky top-0 z-40 hidden h-screen w-[84px] shrink-0 flex-col items-center border-r border-subtle bg-background/60 py-5 backdrop-blur-xl lg:flex">
      {/* mark */}
      <div className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient shadow-[0_0_28px_-8px_hsl(var(--brand-500)/0.8)]">
        <Activity className="h-5 w-5 text-background" strokeWidth={2.6} />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className="group relative flex w-[68px] flex-col items-center gap-1 rounded-xl py-2.5 transition-colors"
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl border border-brand-500/30 bg-brand-500/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-brand-400'
                      : 'text-foreground-tertiary group-hover:text-foreground-secondary'
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                {item.key === 'incidents' && openCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-critical px-1 font-mono text-[9px] font-bold text-white">
                    {openCount > 9 ? '9+' : openCount}
                  </span>
                )}
              </span>
              <span
                className={`relative text-[10px] font-medium tracking-tight transition-colors ${
                  isActive ? 'text-foreground' : 'text-foreground-tertiary'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground-disabled">
          v1
        </span>
      </div>
    </aside>
  );
}
