'use client';

import { m } from 'framer-motion';
import type { PerformanceTier } from '@/hooks/usePerformanceProfile';
import { getVisibleAmbientOrbs, shouldAnimateOrbs } from './ambient-background-logic';

interface AmbientBackgroundProps {
  performanceTier?: PerformanceTier;
}

export default function AmbientBackground({ performanceTier = 'full' }: AmbientBackgroundProps) {
  // O(1) lookup into slices precomputed at module load — no per-render slice.
  const visibleOrbs = getVisibleAmbientOrbs(performanceTier);
  const animateOrbs = shouldAnimateOrbs(performanceTier);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {visibleOrbs.map((orb, index) => (
        animateOrbs ? (
          <m.div
            key={`ambient-orb-${index}`}
            className={orb.className}
            animate={orb.animate}
            transition={orb.transition}
          />
        ) : (
          <div key={`ambient-orb-${index}`} className={orb.className} />
        )
      ))}

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grid pattern — ice-tinted so the tech-grid reads as part of the palette */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(126,231,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(126,231,255,0.07) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}
