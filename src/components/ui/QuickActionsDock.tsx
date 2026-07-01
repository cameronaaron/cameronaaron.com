'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

interface QuickActionsDockProps {
  performanceTier: PerformanceTier;
}

const sectionLinks = [
  { label: 'Credentials', href: '#certifications' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

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
            <motion.div
              id="quick-actions-menu"
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col items-end gap-2"
            >
              {sectionLinks.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={reduced ? { opacity: 1 } : { opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: 6 }}
                  transition={{ duration: 0.2, delay: reduced ? 0 : index * 0.03, ease: 'easeOut' }}
                  whileHover={reduced ? undefined : { x: -2, scale: 1.02 }}
                  className="rounded-full border border-white/15 bg-black/55 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 backdrop-blur-md transition-colors hover:border-cyan-300/45"
                >
                  {link.label}
                </motion.a>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          whileHover={reduced ? undefined : { scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-black/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 shadow-lg shadow-cyan-500/20 backdrop-blur-md"
          aria-expanded={open}
          aria-controls={open ? 'quick-actions-menu' : undefined}
          aria-label="Explore quick actions"
        >
          <motion.span
            animate={open && !reduced ? { rotate: 45 } : { rotate: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="inline-block text-sm"
          >
            +
          </motion.span>
          Explore
        </motion.button>
      </div>
    </nav>
  );
}
