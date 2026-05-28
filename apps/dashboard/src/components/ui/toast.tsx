'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';
export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

// Module-level store so non-React callers (e.g. the data hook) can emit toasts
// without threading a context through everything.
let nextId = 0;
let items: ToastItem[] = [];
const listeners = new Set<(t: ToastItem[]) => void>();

function emit() {
  for (const l of listeners) l(items);
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function push(type: ToastType, message: string) {
  const item: ToastItem = { id: ++nextId, type, message };
  items = [...items, item].slice(-4);
  emit();
  setTimeout(() => dismiss(item.id), 4500);
}

export const toast = {
  success: (m: string) => push('success', m),
  error: (m: string) => push('error', m),
  info: (m: string) => push('info', m),
};

const META: Record<ToastType, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'border-verified/30 text-verified' },
  error: { icon: AlertTriangle, cls: 'border-critical/30 text-critical' },
  info: { icon: Info, cls: 'border-brand-500/30 text-brand-400' },
};

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);
  useEffect(() => {
    listeners.add(setList);
    setList(items);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      <AnimatePresence initial={false}>
        {list.map((t) => {
          const { icon: Icon, cls } = META[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-elevated/90 px-4 py-3 shadow-[0_18px_40px_-20px_hsl(0_0%_0%/0.8)] backdrop-blur-xl ${cls}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 text-sm text-foreground">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-foreground-tertiary transition hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
