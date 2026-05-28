'use client';

import { useEffect, useRef, useState } from 'react';
import { BrainCircuit, Wrench } from 'lucide-react';

interface ToolStep {
  tool: string;
  arg: string;
  result: string;
}

interface ReasoningStreamProps {
  /** The model's root-cause text (streamed token-by-token when `active`). */
  text: string;
  /** Investigation steps shown as a tool-call trace above the reasoning. */
  tools?: ToolStep[];
  /** When true, typewriter-reveal the text (the "GPT is thinking" effect). */
  active?: boolean;
  /** Model label, e.g. "gpt-5.5" or "simulated". */
  model?: string | null;
  /** 0..1 confidence shown next to the model. */
  confidence?: number;
}

/**
 * Renders the AI's investigation + reasoning. When `active`, the text reveals
 * progressively to convey live GPT streaming; otherwise the full text shows.
 * The tool-call trace makes the agentic loop visible ("it looked at the logs").
 */
export function ReasoningStream({
  text,
  tools = [],
  active = false,
  model,
  confidence,
}: ReasoningStreamProps) {
  const [shown, setShown] = useState(active ? '' : text);
  const idx = useRef(0);

  useEffect(() => {
    if (!active) {
      setShown(text);
      return;
    }
    idx.current = 0;
    setShown('');
    const step = Math.max(1, Math.round(text.length / 90)); // ~90 frames to full
    const id = setInterval(() => {
      idx.current += step;
      if (idx.current >= text.length) {
        setShown(text);
        clearInterval(id);
      } else {
        setShown(text.slice(0, idx.current));
      }
    }, 28);
    return () => clearInterval(id);
  }, [text, active]);

  const streaming = active && shown.length < text.length;

  return (
    <div className="rounded-lg border border-brand-500/20 bg-brand-500/[0.05] p-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-400">
          <BrainCircuit className="h-3.5 w-3.5" />
          AI investigation
        </span>
        <span className="font-mono text-[10px] text-foreground-tertiary">
          {confidence != null && `${Math.round(confidence * 100)}% · `}
          {!model || model === 'deterministic' || model === 'offline-deterministic-v1'
            ? 'simulated reasoning'
            : `${model} · live`}
        </span>
      </div>

      {tools.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {tools.map((t, i) => (
            <div
              key={`${t.tool}-${i}`}
              className="flex items-center gap-2 font-mono text-[11px] text-foreground-secondary"
            >
              <Wrench className="h-3 w-3 shrink-0 text-brand-400/70" />
              <span className="text-brand-300">{t.tool}</span>
              <span className="text-foreground-tertiary">({t.arg})</span>
              <span className="text-foreground-tertiary">→ {t.result}</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 text-sm leading-relaxed text-foreground">
        {shown}
        {streaming && (
          <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-brand-400" />
        )}
      </p>
    </div>
  );
}
