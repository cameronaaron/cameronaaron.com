'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface TrailPoint {
  id: number;
  x: number;
  y: number;
  life: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function CursorTrail() {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(() => {
    /* v8 ignore next */
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });
  const [isInteractiveHover, setIsInteractiveHover] = useState(false);

  const prefersReducedMotion = useReducedMotion();

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);

  const ringX = useSpring(cursorX, { stiffness: 300, damping: 30, mass: 0.36 });
  const ringY = useSpring(cursorY, { stiffness: 300, damping: 30, mass: 0.36 });
  const headX = useSpring(cursorX, { stiffness: 620, damping: 40, mass: 0.2 });
  const headY = useSpring(cursorY, { stiffness: 620, damping: 40, mass: 0.2 });

  const idRef = useRef(0);
  const rippleIdRef = useRef(0);
  const lastSampleRef = useRef(0);

  useEffect(() => {
    const pointerMedia = window.matchMedia('(pointer: coarse)');
    /* v8 ignore next 3 */
    const updatePointerMode = (event: MediaQueryListEvent) => {
      setIsCoarsePointer(event.matches);
    };

    pointerMedia.addEventListener('change', updatePointerMode);

    return () => {
      pointerMedia.removeEventListener('change', updatePointerMode);
    };
  }, []);

  useEffect(() => {
    if (isCoarsePointer || prefersReducedMotion) {
      document.documentElement.classList.remove('custom-cursor-active');
      return;
    }

    document.documentElement.classList.add('custom-cursor-active');

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, [isCoarsePointer, prefersReducedMotion]);

  useEffect(() => {
    if (isCoarsePointer || prefersReducedMotion) return;

    let animationFrameId = 0;

    const sampleTrail = (x: number, y: number) => {
      const now = performance.now();
      // Sample at ~60fps max to avoid over-updating on high polling mice.
      /* v8 ignore next */
      if (now - lastSampleRef.current < 16) return;
      lastSampleRef.current = now;

      setTrail((prev) => {
        const next: TrailPoint[] = [
          ...prev,
          {
            id: idRef.current++,
            x,
            y,
            life: 1,
          },
        ];

        return next.slice(-20);
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      sampleTrail(e.clientX, e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target;

      if (!(target instanceof HTMLElement)) {
        setIsInteractiveHover(false);
        return;
      }

      const interactiveTarget = target.closest(
        'a, button, [role="button"], input, textarea, select, label, [data-cursor="interactive"]'
      );

      setIsInteractiveHover(Boolean(interactiveTarget));
    };

    const handleMouseDown = (e: MouseEvent) => {
      setRipples((prev) => [
        ...prev,
        {
          id: rippleIdRef.current++,
          x: e.clientX,
          y: e.clientY,
        },
      ]);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const cleanup = () => {
      setTrail((prev) =>
        prev
          .map((point, index, all) => {
            // Newer points stay brighter/longer; older points fade faster.
            const relativeAge = 1 - index / Math.max(1, all.length);
            const decay = 0.035 + relativeAge * 0.02;

            return {
              ...point,
              life: point.life - decay,
            };
          })
          .filter((point) => point.life > 0)
      );

      animationFrameId = window.requestAnimationFrame(cleanup);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', () => setIsVisible(true));

    animationFrameId = window.requestAnimationFrame(cleanup);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [cursorX, cursorY, isCoarsePointer, prefersReducedMotion]);

  useEffect(() => {
    if (!ripples.length) return;

    const timeout = setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 420);

    return () => clearTimeout(timeout);
  }, [ripples]);

  if (isCoarsePointer || !isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      <motion.div
        className="absolute"
        style={{
          left: headX,
          top: headY,
          x: '-50%',
          y: '-50%',
        }}
        animate={
          isInteractiveHover
            ? { scale: 1.18, rotate: -4, filter: 'drop-shadow(0 0 22px rgba(168, 85, 247, 0.55))' }
            : { scale: 1, rotate: 0, filter: 'drop-shadow(0 0 12px rgba(34, 211, 238, 0.35))' }
        }
        transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.32 }}
      >
        <BrainCursor active={isInteractiveHover} />
      </motion.div>

      <motion.div
        className="absolute rounded-full border border-cyan-300/60"
        style={{
          left: ringX,
          top: ringY,
          x: '-50%',
          y: '-50%',
          width: 34,
          height: 34,
          boxShadow: '0 0 26px rgba(34, 211, 238, 0.25)',
        }}
        animate={
          isInteractiveHover
            ? { scale: [1.04, 1.14, 1.04], borderColor: 'rgba(16, 185, 129, 0.75)' }
            : { scale: [1, 1.04, 1], borderColor: 'rgba(103, 232, 249, 0.65)' }
        }
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {trail.map((point, index) => {
        const progress = (index + 1) / Math.max(1, trail.length);
        const opacity = Math.max(0.1, point.life * 0.7 * progress);
        const scale = 0.5 + progress * 0.45;

        return (
          <motion.div
            key={point.id}
            className="absolute rounded-full"
            style={{
              left: point.x,
              top: point.y,
              width: 20,
              height: 20,
              x: '-50%',
              y: '-50%',
              background: `radial-gradient(circle, rgba(34, 211, 238, ${opacity}), rgba(16, 185, 129, ${opacity * 0.45}), transparent)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: scale,
              opacity,
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.18,
              ease: 'easeOut',
            }}
          />
        );
      })}

      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full border border-cyan-300/55"
          style={{
            left: ripple.x,
            top: ripple.y,
            x: '-50%',
            y: '-50%',
          }}
          initial={{ width: 10, height: 10, opacity: 0.55 }}
          animate={{ width: 62, height: 62, opacity: 0 }}
          transition={{ duration: 0.42, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function BrainCursor({ active }: { active: boolean }) {
  // Two hemispheres made of stacked curves + a few "synapse" sparks that
  // pulse faster when hovering interactive targets. ~32px square.
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="brain cursor"
    >
      <defs>
        <radialGradient id="brainCoreGradient" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#22d3ee" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id="brainStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* Outer brain silhouette: two lobes joined at the cortex midline. */}
      <path
        d="M16 4.5
           c-2.6 0-4.7 1.6-5.4 3.8
           c-2.4 0.3-4.1 2.3-4.1 4.7
           c0 1 0.3 1.9 0.8 2.7
           c-0.9 0.9-1.4 2.1-1.4 3.4
           c0 2.5 1.9 4.6 4.4 4.9
           c0.6 2.2 2.7 3.8 5.2 3.8
           c0.2 0 0.4 0 0.5-0.02
           V4.52
           c-0.2-0.01-0.3-0.02-0.5-0.02 z"
        fill="url(#brainCoreGradient)"
        stroke="url(#brainStroke)"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path
        d="M16 4.5
           c2.6 0 4.7 1.6 5.4 3.8
           c2.4 0.3 4.1 2.3 4.1 4.7
           c0 1-0.3 1.9-0.8 2.7
           c0.9 0.9 1.4 2.1 1.4 3.4
           c0 2.5-1.9 4.6-4.4 4.9
           c-0.6 2.2-2.7 3.8-5.2 3.8
           c-0.2 0-0.4 0-0.5-0.02
           V4.52
           c0.2-0.01 0.3-0.02 0.5-0.02 z"
        fill="url(#brainCoreGradient)"
        stroke="url(#brainStroke)"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />

      {/* Cortex folds — squiggles inside each lobe. */}
      <g
        stroke="#0f172a"
        strokeOpacity="0.55"
        strokeWidth="0.7"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M10 9 q1.3 1.2 0 2.4 q-1.3 1.2 0 2.4 q1.3 1.2 0 2.4" />
        <path d="M8.5 14 q1.5 1 3 0 q1.5-1 3 0" />
        <path d="M9.5 19 q1.2 1.2 2.4 0 q1.2-1.2 2.4 0" />
        <path d="M22 9 q-1.3 1.2 0 2.4 q-1.3 1.2 0 2.4 q-1.3 1.2 0 2.4" />
        <path d="M17.5 14 q1.5 1 3 0 q1.5-1 3 0" />
        <path d="M17.6 19 q1.2 1.2 2.4 0 q1.2-1.2 2.4 0" />
      </g>

      {/* Midline cortex seam. */}
      <line
        x1="16"
        y1="4.5"
        x2="16"
        y2="27.5"
        stroke="url(#brainStroke)"
        strokeWidth="0.7"
        strokeOpacity="0.85"
      />

      {/* Synapse sparks. */}
      <g>
        <motion.circle
          cx="6"
          cy="11"
          r="0.9"
          fill="#67e8f9"
          animate={{ opacity: [0.2, 1, 0.2], r: [0.7, 1.1, 0.7] }}
          transition={{ duration: active ? 0.9 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="26"
          cy="13.5"
          r="0.9"
          fill="#c4b5fd"
          animate={{ opacity: [0.2, 1, 0.2], r: [0.7, 1.1, 0.7] }}
          transition={{ duration: active ? 0.7 : 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        />
        <motion.circle
          cx="16"
          cy="2.5"
          r="0.9"
          fill="#a7f3d0"
          animate={{ opacity: [0.2, 1, 0.2], r: [0.7, 1.1, 0.7] }}
          transition={{ duration: active ? 0.8 : 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        <motion.circle
          cx="11"
          cy="25"
          r="0.8"
          fill="#f9a8d4"
          animate={{ opacity: [0.15, 0.9, 0.15], r: [0.6, 1, 0.6] }}
          transition={{ duration: active ? 1 : 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />
      </g>
    </svg>
  );
}
