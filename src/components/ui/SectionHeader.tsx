'use client';

import { m } from 'framer-motion';
import type { ReactNode } from 'react';

import ScrambleText from '@/components/ui/ScrambleText';

interface SectionHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  className?: string;
  headingId?: string;
  /** Editorial ghost index ("01".."07") rendered as giant type behind the title. */
  index?: string;
}

export default function SectionHeader({ title, subtitle, className = '', headingId, index }: SectionHeaderProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className={`relative mb-16 text-left ${className}`}
    >
      <div className="mb-6 flex items-center gap-4">
        {index ? (
          <span aria-hidden="true" data-testid="section-ghost-index" className="select-none">
            {/* Decorative only (aria-hidden) — the hover-scramble is a mouse-only "everything reacts" flourish. */}
            <ScrambleText
              text={index}
              className="font-mono-accent text-sm font-medium tracking-[0.35em] text-cyan-300/80"
            />
          </span>
        ) : null}
        <m.div
          className="h-px flex-1 origin-left bg-gradient-to-r from-cyan-300/50 via-white/10 to-transparent"
          initial={{ scaleX: 0.35, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      {/* The velocity skew lives OUTSIDE the gradient-clipped h2: a transformed
          (composited) descendant inside a bg-clip-text element never receives
          the gradient paint in Chrome, so the text renders fully transparent —
          i.e. invisible headings. Transforming the h2 from an ancestor keeps
          the clip and the skew independent.

          The skew itself arrives as an inherited CSS custom property
          (--scroll-skew-title) published once per frame by ScrollVelocityDriver.
          This used to be a per-SectionHeader framer spring graph, i.e. one for
          every section on the page, all computing the same scroll velocity. */}
      <div data-testid="section-title-motion" className="velocity-lean-title inline-block">
        <h2
          id={headingId}
          className="relative z-10 mb-4 overflow-hidden pb-2 font-display text-4xl font-bold tracking-tight text-transparent md:text-6xl bg-gradient-to-br from-white via-cyan-50 to-cyan-200/80 bg-clip-text"
        >
          {/* The complete heading enters with its parent. Independently
              transformed letters lose the ancestor's gradient paint until
              their animation ends, making headings unreadable in motion. */}
          {title}
        </h2>
      </div>
      {subtitle ? (
        <m.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
          className="max-w-2xl text-lg text-muted-foreground"
        >
          {subtitle}
        </m.p>
      ) : null}
    </m.div>
  );
}
