'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import TextReveal from '@/components/ui/TextReveal';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className={`relative text-center mb-16 ${className}`}
    >
      {index ? (
        <span
          aria-hidden="true"
          data-testid="section-ghost-index"
          className="pointer-events-none absolute inset-x-0 -top-8 z-0 flex select-none justify-center font-display text-[7rem] font-extrabold leading-none tracking-tight text-white/[0.04] [-webkit-text-stroke:1px_rgba(126,231,255,0.07)] md:-top-14 md:text-[11rem]"
        >
          {index}
        </span>
      ) : null}
      <motion.div
        className="mx-auto mb-5 h-px w-24 bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent"
        initial={{ scaleX: 0.35, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      <h2
        id={headingId}
        className="relative z-10 text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent overflow-hidden pb-2 font-display"
      >
        <TextReveal text={title} />
      </h2>
      {subtitle ? (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
