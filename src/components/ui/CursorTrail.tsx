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
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
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
    const updatePointerMode = (event: MediaQueryListEvent) => {
      setIsCoarsePointer(event.matches);
    };

    setIsCoarsePointer(pointerMedia.matches);
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
            ? { scale: 1.12, rotate: -6, filter: 'drop-shadow(0 0 18px rgba(34, 211, 238, 0.45))' }
            : { scale: 1, rotate: 0, filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.25))' }
        }
        transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.32 }}
      >
        <div className="relative h-7 w-7">
          <div className="absolute -left-1 top-0 h-3 w-3 rounded-full border border-cyan-200/70 bg-cyan-400/35" />
          <div className="absolute -right-1 top-0 h-3 w-3 rounded-full border border-cyan-200/70 bg-cyan-400/35" />
          <div className="absolute bottom-0 left-1/2 h-5 w-6 -translate-x-1/2 rounded-full border border-cyan-200/75 bg-gradient-to-b from-cyan-300/70 to-emerald-400/65" />
          <div className="absolute left-[9px] top-[11px] h-1 w-1 rounded-full bg-slate-900/80" />
          <div className="absolute right-[9px] top-[11px] h-1 w-1 rounded-full bg-slate-900/80" />
        </div>
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
