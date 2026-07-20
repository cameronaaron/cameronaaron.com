'use client';

import { m, useMotionValue, useSpring } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import {
  BUTTON_MAGNETIC_STRENGTH,
  BUTTON_SPRING_CONFIG,
  getButtonStyles,
} from '@/components/ui/button-logic';
import { calculateMagneticOffset } from '@/components/ui/magnetic-logic';

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export default function Button({
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ariaLabel,
}: ButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const { enableHoverMotion, isCoarsePointer, prefersReducedMotion } = useInteractionMode();
  
  // Magnetic spring physics
  const springX = useSpring(x, BUTTON_SPRING_CONFIG);
  const springY = useSpring(y, BUTTON_SPRING_CONFIG);

  const styles = getButtonStyles(size, variant, className);

  const Component = href ? m.a : m.button;
  const props = href ? { href } : { onClick, type: 'button' as const };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!enableHoverMotion || variant !== 'primary' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offset = calculateMagneticOffset(rect, e.clientX, e.clientY, BUTTON_MAGNETIC_STRENGTH);
    x.set(offset.x);
    y.set(offset.y);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Component
      {...props}
      // @ts-expect-error - ref type mismatch with motion components is common
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileHover={
        enableHoverMotion
          ? {
              scale: variant === 'primary' ? 1.05 : 1.02,
              y: -2,
              transition: { type: 'spring', stiffness: 320, damping: 20 },
            }
          : undefined
      }
      whileTap={
        prefersReducedMotion
          ? { opacity: 0.92 }
          : {
              scale: isCoarsePointer ? 0.985 : 0.96,
              y: 1.5,
              filter: 'brightness(0.95)',
              transition: { type: 'spring', stiffness: 500, damping: 26 },
            }
      }
      className={styles}
      aria-label={ariaLabel}
    >
      {children}
    </Component>
  );
}
