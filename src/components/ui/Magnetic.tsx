'use client';

import { m, useMotionValue, useSpring } from 'framer-motion';
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
    // No hover motion means no offset is rendered — skip the layout read too.
    if (!enableHoverMotion) return;

    // React attaches the ref before any pointer event can reach this handler.
    const offset = calculateMagneticOffset(ref.current!.getBoundingClientRect(), e.clientX, e.clientY, strength);
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
    <m.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      style={enableHoverMotion ? { x: springX, y: springY } : undefined}
      className={className}
    >
      {children}
    </m.div>
  );
}
