'use client';

import { useMemo } from 'react';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import {
  MARQUEE_TRACK_DURATION_S,
  buildMarqueeItems,
  getMarqueeMotionConfig,
  type MarqueeDirection,
} from './velocity-marquee-logic';

interface VelocityMarqueeProps {
  phrases: readonly string[];
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
  direction = 1,
  className = '',
}: VelocityMarqueeProps) {
  // Self-read the tier so a Server Component page can render this island
  // without threading a client-only value down as a prop (RSC islands, 2026-07).
  const { performanceTier } = usePerformanceProfile();
  const { animateTrack } = getMarqueeMotionConfig(performanceTier);
  const items = useMemo(() => buildMarqueeItems(phrases), [phrases]);

  return (
    <div
      aria-hidden="true"
      data-testid="velocity-marquee"
      className={`pointer-events-none relative select-none overflow-hidden border-y border-white/5 bg-white/[0.015] py-8 md:py-12 ${className}`}
    >
      {/* The scroll-velocity lean arrives through inherited CSS custom
          properties written once per frame by ScrollVelocityDriver — no framer
          spring graph here, and on every tier below 'full' the driver never
          runs, so the registered initial values leave this at identity. */}
      <div
        data-testid="marquee-velocity-lean"
        className={`will-change-transform ${
          direction === -1 ? 'velocity-lean-band-reverse' : 'velocity-lean-band'
        }`}
      >
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
                    ? 'text-transparent [-webkit-text-stroke:1.5px_rgba(126,231,255,0.30)]'
                    : 'bg-gradient-to-r from-cyan-300/90 via-emerald-200/90 to-indigo-300/90 bg-clip-text text-transparent'
                }`}
              >
                {item.text}
              </span>
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-cyan-300/50 md:h-3 md:w-3" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
