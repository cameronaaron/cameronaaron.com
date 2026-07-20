'use client';

import { AnimatePresence, m } from 'framer-motion';
import { useState } from 'react';
import type { PerformanceTier } from '@/hooks/usePerformanceProfile';
import { QUICK_DOCK_LINKS, getDockLinkMotion, getDockMenuMotion } from './quick-actions-dock-logic';

interface QuickActionsDockProps {
  performanceTier: PerformanceTier;
}

export default function QuickActionsDock({ performanceTier }: QuickActionsDockProps) {
  const [open, setOpen] = useState(false);
  const reduced = performanceTier === 'reduced';

  return (
    <nav
      className="pointer-events-none fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-50 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:right-6"
      aria-label="Quick navigation dock"
    >
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <AnimatePresence>
          {open ? (
            <m.div
              id="quick-actions-menu"
              {...getDockMenuMotion(reduced)}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col items-end gap-2"
            >
              {QUICK_DOCK_LINKS.map((link, index) => (
                <m.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  {...getDockLinkMotion(reduced, index)}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-full border border-white/15 bg-black/55 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 backdrop-blur-md transition-colors hover:border-cyan-300/45"
                >
                  {link.label}
                </m.a>
              ))}
            </m.div>
          ) : null}
        </AnimatePresence>

        <m.button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          whileHover={reduced ? undefined : { scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-black/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 shadow-lg shadow-cyan-500/20 backdrop-blur-md"
          aria-expanded={open}
          aria-controls={open ? 'quick-actions-menu' : undefined}
          aria-label="Explore quick actions"
        >
          <m.span
            animate={open && !reduced ? { rotate: 45 } : { rotate: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="inline-block text-sm"
          >
            +
          </m.span>
          Explore
        </m.button>
      </div>
    </nav>
  );
}
