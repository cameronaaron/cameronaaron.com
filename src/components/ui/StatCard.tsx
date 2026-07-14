'use client';

import { animate, motion } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';

import { useInteractionMode } from '@/hooks/useInteractionMode';
import { use3DTilt } from '@/hooks/use3DTilt';
import { STAT_COUNT_UP_DURATION_S, formatStatValue, parseStatValue } from '@/components/ui/stat-card-logic';

interface StatCardProps {
  value: string;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();
  const valueRef = useRef<HTMLDivElement>(null);
  const parsedValue = useMemo(() => parseStatValue(value), [value]);

  // Pointer-following 3D tilt. Motion-value driven — each mousemove writes two
  // motion values (O(1), zero React re-renders); consumers read them via
  // useTransform/useSpring. Gated to hover-capable pointers so cards never
  // tilt on touch.
  const tilt = use3DTilt({ maxRotation: 9 });

  // Count up from 0 by writing straight into the node — the SSR HTML already
  // holds the final value (hydration-safe, meaningful without JS) and no React
  // re-render happens per frame.
  useEffect(() => {
    const node = valueRef.current;
    if (prefersReducedMotion || parsedValue.target === null || !node) return;

    const controls = animate(0, parsedValue.target, {
      duration: STAT_COUNT_UP_DURATION_S,
      ease: 'easeOut',
      onUpdate: (latest) => {
        node.textContent = formatStatValue(latest, parsedValue.suffix);
      },
    });

    return () => controls.stop();
  }, [prefersReducedMotion, parsedValue]);

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md [transform-style:preserve-3d]"
      onMouseMove={enableHoverMotion ? tilt.handleMouseMove : undefined}
      onMouseLeave={enableHoverMotion ? tilt.handleMouseLeave : undefined}
      style={enableHoverMotion ? { rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 600 } : undefined}
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
        ref={valueRef}
        className="relative font-display text-3xl font-bold tracking-tight text-cyan-100 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]"
        animate={prefersReducedMotion ? undefined : { opacity: [0.92, 1, 0.92] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {value}
      </motion.div>

      <div className="font-mono-accent relative mt-1 break-words text-[10px] font-medium uppercase leading-relaxed tracking-[0.08em] text-foreground/80">
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
