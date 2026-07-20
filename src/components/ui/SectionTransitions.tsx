'use client';

import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { getSectionGlowTone } from './section-transitions-logic';

interface SectionRevealProps {
  index: number;
  children: React.ReactNode;
}

interface SectionHandoffProps {
  label: string;
  index: number;
  cue: string;
  targetId: string;
}

// Per-index CSS-variable style helpers keep the stagger a component concern
// while the animation itself is pure CSS (see globals.css — the ambient
// glow/ring/dot loops were framer `repeat: Infinity` animations until 2026-07,
// moved to the compositor because ~43 of them on the mobile path pegged the
// main thread; §4.4/§8-adjacent perf law). The one-shot entrance animations
// stay in framer: they fire once (`viewport once`) and never contribute to the
// ongoing per-frame cost that was the actual lag.
function glowDurationStyle(index: number): CSSProperties {
  return { '--glow-duration': `${7 + index * 0.4}s` } as CSSProperties;
}

function handoffDelayStyle(index: number): CSSProperties {
  return { '--handoff-delay': `${index * 0.2}s` } as CSSProperties;
}

function dotDelayStyle(pulse: number, index: number): CSSProperties {
  return { '--dot-delay': `${pulse * 0.13 + index * 0.05}s` } as CSSProperties;
}

export function SectionReveal({ index, children }: SectionRevealProps) {
  const glowTone = getSectionGlowTone(index);
  // The hero (index 0) is above the fold — it must always be laid out and
  // painted (it holds the LCP). Every section below it is skipped by the
  // browser until scrolled near, cutting the initial layout pass. See
  // `.cv-section` in globals.css. That same containment also pauses the CSS
  // glow animation below whenever the section is off-screen.
  const containmentClass = index === 0 ? '' : ' cv-section';

  // Plain <div>, not motion.div: the outer wrapper was `initial={false}`, so
  // framer rendered it already-visible with no entrance animation (chosen for
  // bfcache safety — a section must never restore hidden). A plain div is that
  // same always-visible behavior with zero framer mount cost — and framer
  // hydration over 157 motion components is the homepage's real load gate
  // (/capstone, with none, hydrates in 0.3s vs the homepage's 3.8s of main
  // thread). §5 render-path law.
  return (
    <div className={`relative${containmentClass}`}>
      <div
        className={`section-glow-anim pointer-events-none absolute inset-x-0 top-6 mx-auto h-24 w-3/4 rounded-full bg-gradient-to-r ${glowTone} blur-3xl`}
        style={glowDurationStyle(index)}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

export function SectionHandoff({ label, index, cue, targetId }: SectionHandoffProps) {
  // Outer wrapper plain for the same reason as SectionReveal (was
  // initial={false}). The inner decorative reveals below stay framer for now.
  return (
    <div className="relative z-10 px-6 py-10">
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div
          className="handoff-glow-anim h-24 w-full max-w-3xl rounded-full bg-gradient-to-r from-cyan-400/10 via-primary/15 to-emerald-400/10 blur-3xl"
          style={handoffDelayStyle(index)}
          aria-hidden="true"
        />
      </motion.div>

      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-4">
          <motion.div
            className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300/25 to-emerald-300/10"
            initial={{ scaleX: 0.4, opacity: 0.45 }}
            whileInView={{ scaleX: 1, opacity: 0.78 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />

          <motion.div
            className="group pointer-events-auto relative"
            whileHover={{ y: -2, scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <div
              className="handoff-ring-anim absolute -inset-2 rounded-full border border-cyan-300/25"
              aria-hidden="true"
            />
            <motion.a
              href={`#${targetId}`}
              className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs sm:text-[11px] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-muted-foreground/90 transition-colors group-hover:border-cyan-300/35 group-hover:text-cyan-100"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
              {label}
            </motion.a>
          </motion.div>

          <motion.div
            className="h-px flex-1 bg-gradient-to-l from-transparent via-emerald-300/25 to-cyan-300/10"
            initial={{ scaleX: 0.4, opacity: 0.45 }}
            whileInView={{ scaleX: 1, opacity: 0.78 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />
        </div>

        <motion.div
          className="mt-4 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-cyan-200/85"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <span>{cue}</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((pulse) => (
              <span
                key={pulse}
                className="handoff-dot-anim h-1.5 w-1.5 rounded-full bg-cyan-300/75"
                style={dotDelayStyle(pulse, index)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
