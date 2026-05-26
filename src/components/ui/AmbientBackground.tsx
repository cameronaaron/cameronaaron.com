'use client';

import { motion } from 'framer-motion';
import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

interface AmbientBackgroundProps {
  performanceTier?: PerformanceTier;
}

interface OrbSpec {
  className: string;
  animate: {
    x: number[];
    y: number[];
    scale: number[];
  };
  transition: {
    duration: number;
    repeat: number;
    ease: 'easeInOut';
    delay?: number;
  };
}

const ORBS: OrbSpec[] = [
  {
    className: 'absolute top-0 left-1/4 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl',
    animate: { x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] },
    transition: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    className: 'absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-pink-500/20 blur-3xl',
    animate: { x: [0, -80, 0], y: [0, 100, 0], scale: [1, 1.3, 1] },
    transition: { duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 },
  },
  {
    className: 'absolute bottom-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-3xl',
    animate: { x: [0, 60, 0], y: [0, -80, 0], scale: [1, 1.15, 1] },
    transition: { duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 },
  },
  {
    className: 'absolute top-2/3 right-1/3 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl',
    animate: { x: [0, -50, 0], y: [0, 70, 0], scale: [1, 1.25, 1] },
    transition: { duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 },
  },
  {
    className: 'absolute top-1/2 left-1/2 h-[600px] w-[600px] rounded-full bg-indigo-500/15 blur-3xl',
    animate: { x: [0, -120, 0], y: [0, -100, 0], scale: [1, 1.4, 1] },
    transition: { duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 3 },
  },
  {
    className: 'absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-fuchsia-500/20 blur-3xl',
    animate: { x: [0, 90, 0], y: [0, -60, 0], scale: [1, 1.35, 1] },
    transition: { duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 5 },
  },
  {
    className: 'absolute top-1/4 left-0 h-[350px] w-[350px] rounded-full bg-blue-500/18 blur-3xl',
    animate: { x: [0, 70, 0], y: [0, 90, 0], scale: [1, 1.28, 1] },
    transition: { duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 6 },
  },
];

export default function AmbientBackground({ performanceTier = 'full' }: AmbientBackgroundProps) {
  const orbCount =
    performanceTier === 'full'
      ? ORBS.length
      : performanceTier === 'balanced'
        ? 4
        : performanceTier === 'lite'
          ? 2
          : 1;

  const animateOrbs = performanceTier !== 'reduced';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {ORBS.slice(0, orbCount).map((orb, index) => (
        animateOrbs ? (
          <motion.div
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

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}
