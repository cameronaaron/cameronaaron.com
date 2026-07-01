'use client';

import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { MouseEvent } from 'react';

export interface TiltRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function calculateTiltTargets(rect: TiltRect, clientX: number, clientY: number) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const percentX = (clientX - centerX) / (rect.width / 2);
  const percentY = (clientY - centerY) / (rect.height / 2);

  return {
    x: 0.5 + percentX * 0.5,
    y: 0.5 + percentY * 0.5,
  };
}

interface Use3DTiltOptions {
  maxRotation?: number;
  springConfig?: {
    stiffness: number;
    damping: number;
  };
}

export function use3DTilt(options: Use3DTiltOptions = {}) {
  const { maxRotation = 10, springConfig = { stiffness: 400, damping: 30 } } = options;

  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [maxRotation, -maxRotation]);
  const rotateY = useTransform(x, [0, 1], [-maxRotation, maxRotation]);

  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    // Prefer the element the listener is actually bound to (the common case:
    // onMouseMove={handleMouseMove} directly on the tilted element) — falls back
    // to the ref for callers that track pointer movement via a different source
    // (e.g. a window-level listener) but still want rect from a specific node.
    const target = (e.currentTarget as HTMLElement | null) ?? ref.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const result = calculateTiltTargets(rect, e.clientX, e.clientY);

    x.set(result.x);
    y.set(result.y);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return {
    ref,
    handleMouseMove,
    handleMouseLeave,
    rotateX: springRotateX,
    rotateY: springRotateY,
  };
}
