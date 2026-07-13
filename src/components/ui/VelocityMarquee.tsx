'use client';

import { motion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { useMemo } from 'react';
import type { PerformanceTier } from '@/hooks/usePerformanceProfile';
import {
  MARQUEE_TRACK_DURATION_S,
  buildMarqueeItems,
  clampMarqueeVelocity,
  getMarqueeMotionConfig,
  marqueeVelocityToShiftPx,
  marqueeVelocityToSkewDeg,
  type MarqueeDirection,
} from './velocity-marquee-logic';

interface VelocityMarqueeProps {
  phrases: readonly string[];
  performanceTier?: PerformanceTier;
  direction?: MarqueeDirection;
  className?: string;
}

/**
 * A lenis.dev-style giant-type band: oversized display text drifting in an
 * infinite CSS loop, skewing and lurching with live scroll velocity on the
 * full tier. Purely decorative — the whole band is aria-hidden and
 * pointer-transparent, and lower tiers render the identical band statically.
 */
export default function VelocityMarquee({
  phrases,
  performanceTier = 'full',
  direction = 1,
  className = '',
}: VelocityMarqueeProps) {
  const { animateTrack, velocityReactive } = getMarqueeMotionConfig(performanceTier);
  const items = useMemo(() => buildMarqueeItems(phrases), [phrases]);

  // Scroll velocity → skew/shift, entirely through motion values: zero React
  // re-renders at scroll rate (ENGINEERING-STANDARDS §3.1). The graph is built
  // unconditionally (Rules of Hooks) but only attached on the full tier.
  const { scrollY } = useScroll();
  const rawVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(rawVelocity, { stiffness: 260, damping: 44, mass: 0.5 });
  const skewX = useTransform(smoothVelocity, (velocity: number) =>
    marqueeVelocityToSkewDeg(clampMarqueeVelocity(velocity))
  );
  const x = useTransform(smoothVelocity, (velocity: number) =>
    marqueeVelocityToShiftPx(clampMarqueeVelocity(velocity), direction)
  );

  return (
    <div
      aria-hidden="true"
      data-testid="velocity-marquee"
      className={`pointer-events-none relative select-none overflow-hidden border-y border-white/5 bg-white/[0.015] py-8 md:py-12 ${className}`}
    >
      <motion.div style={velocityReactive ? { skewX, x } : undefined} className="will-change-transform">
        <div
          data-testid="marquee-track"
          className={`flex w-max items-center gap-6 md:gap-10 pr-6 md:pr-10 ${
            animateTrack ? 'marquee-track' : ''
          } ${direction === -1 ? 'marquee-track-reverse' : ''}`}
          style={{ '--marquee-duration': `${MARQUEE_TRACK_DURATION_S}s` } as React.CSSProperties}
        >
          {items.map((item) => (
            <span key={item.key} className="flex items-center gap-6 md:gap-10">
              <span
                className={`whitespace-nowrap font-display text-5xl font-extrabold uppercase leading-none tracking-tight md:text-7xl lg:text-8xl ${
                  item.outlined
                    ? 'text-transparent [-webkit-text-stroke:1.5px_rgba(148,233,255,0.30)]'
                    : 'bg-gradient-to-r from-cyan-200/90 via-white/90 to-emerald-200/90 bg-clip-text text-transparent'
                }`}
              >
                {item.text}
              </span>
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-cyan-300/50 md:h-3 md:w-3" />
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
