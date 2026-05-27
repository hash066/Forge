'use client';
import { RightRailNav } from '@devforge/ui';
import { Zap, AlertTriangle, Lightbulb, Layers, ShieldCheck, Cpu } from 'lucide-react';

/**
 * Right-edge anchor rail. Mirrors the icon stack from the SocraticDev landing.
 * Icons here map to homepage section IDs.
 */
export function PageRail() {
  return (
    <RightRailNav
      items={[
        { id: 'hero', label: 'Top', icon: Zap },
        { id: 'features', label: 'Features', icon: Lightbulb },
        { id: 'how-it-works', label: 'How it works', icon: Layers },
        { id: 'modes', label: 'Modes', icon: AlertTriangle },
        { id: 'tech-stack', label: 'Tech', icon: Cpu },
        { id: 'cta', label: 'Get started', icon: ShieldCheck },
      ]}
    />
  );
}
