'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import BrainCursor from '@/components/ui/BrainCursor';
import {
  RIPPLE_LIFETIME_MS,
  appendTrailPoint,
  createRipple,
  decayTrailPoints,
  getTrailVisualState,
  isInteractiveTarget,
  shouldSampleTrail,
} from './cursor-trail/logic';
import type { TrailPoint, Ripple } from './cursor-trail/logic';

export default function CursorTrail() {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(() => {
    /* istanbul ignore next */
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
    /* istanbul ignore next 3 */
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
      /* istanbul ignore next */
      if (!shouldSampleTrail(lastSampleRef.current, now)) return;
      lastSampleRef.current = now;

      setTrail((prev) => appendTrailPoint(prev, idRef.current++, x, y));
    };

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      sampleTrail(e.clientX, e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      setIsInteractiveHover(isInteractiveTarget(e.target));
    };

    const handleMouseDown = (e: MouseEvent) => {
      setRipples((prev) => [...prev, createRipple(rippleIdRef.current++, e.clientX, e.clientY)]);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const cleanup = () => {
      setTrail((prev) => decayTrailPoints(prev));

      animationFrameId = window.requestAnimationFrame(cleanup);
    };

    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });

    animationFrameId = window.requestAnimationFrame(cleanup);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [cursorX, cursorY, isCoarsePointer, prefersReducedMotion]);

  useEffect(() => {
    if (!ripples.length) return;

    const timeout = setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, RIPPLE_LIFETIME_MS);

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
        const { opacity, scale } = getTrailVisualState(index, trail.length, point.life);

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
