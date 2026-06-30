'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, type ReactNode, type MouseEvent } from 'react';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import { calculateMagneticOffset } from './magnetic-logic';

interface MagneticProps {
  children: ReactNode;
  strength?: number; // How strong the magnetic pull is (default: 0.5)
  className?: string;
}

export default function Magnetic({ children, strength = 0.5, className = "" }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const { enableHoverMotion } = useInteractionMode();

  const springX = useSpring(x, { stiffness: 180, damping: 17, mass: 0.8 });
  const springY = useSpring(y, { stiffness: 180, damping: 17, mass: 0.8 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!enableHoverMotion || !ref.current) return;

    const offset = calculateMagneticOffset(ref.current.getBoundingClientRect(), e.clientX, e.clientY, strength);
    x.set(offset.x);
    y.set(offset.y);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleTouchStart = () => {
    // Touch users get tap feedback elsewhere; ensure no lingering hover offset.
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      style={enableHoverMotion ? { x: springX, y: springY } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}
