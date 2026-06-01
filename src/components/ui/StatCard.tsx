'use client';

import { motion } from 'framer-motion';

import { useInteractionMode } from '@/hooks/useInteractionMode';

interface StatCardProps {
  value: string;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center backdrop-blur-md"
      whileHover={enableHoverMotion ? { y: -4, scale: 1.03 } : undefined}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-400/18 via-transparent to-emerald-400/12"
        animate={prefersReducedMotion ? undefined : { opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />

      <motion.div
        className="relative text-3xl font-bold text-cyan-100 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]"
        animate={prefersReducedMotion ? undefined : { opacity: [0.92, 1, 0.92] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {value}
      </motion.div>

      <div className="relative mt-1 text-xs font-medium uppercase tracking-[0.12em] text-foreground/90">
        {label}
      </div>

      <motion.div
        className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent"
        animate={prefersReducedMotion ? undefined : { opacity: [0.3, 0.8, 0.3], scaleX: [0.8, 1, 0.8] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
