'use client';

import { m, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { type ReactNode, type MouseEvent } from 'react';
import { calculateTiltOffset } from './tilt-logic';

interface TiltProps {
  children: ReactNode;
  className?: string;
  intensity?: number; // How much it tilts (default: 15)
  perspective?: number; // 3D perspective (default: 1000)
}

export default function Tilt({ 
  children, 
  className = "", 
  intensity = 15,
  perspective = 1000 
}: TiltProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = calculateTiltOffset(rect, e.clientX, e.clientY);
    x.set(offset.x);
    y.set(offset.y);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective,
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}
