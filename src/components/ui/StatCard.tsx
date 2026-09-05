'use client';

import { animate, m } from 'framer-motion';
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
    <m.div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md [transform-style:preserve-3d]"
      onMouseMove={enableHoverMotion ? tilt.handleMouseMove : undefined}
      onMouseLeave={enableHoverMotion ? tilt.handleMouseLeave : undefined}
      style={enableHoverMotion ? { rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 600 } : undefined}
      whileHover={enableHoverMotion ? { y: -4, scale: 1.03 } : undefined}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      {/* Ambient loops are pure CSS (globals.css) so they ride the compositor
          instead of framer's main-thread rAF — 3 per card × 5 cards in the
          hero was 15 main-thread loops in the first viewport. */}
      <div
        className="stat-sheen-anim pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-400/18 via-transparent to-emerald-400/12"
        aria-hidden="true"
      />

      <div
        ref={valueRef}
        className="stat-value-anim relative font-display text-3xl font-bold tracking-tight text-cyan-100 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]"
      >
        {value}
      </div>

      <div className="font-mono-accent relative mt-1 break-words text-xs font-medium leading-relaxed tracking-normal text-foreground/80">
        {label}
      </div>

      <div
        className="stat-underline-anim pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent"
        aria-hidden="true"
      />
    </m.div>
  );
}
