'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { useInteractionMode } from '@/hooks/useInteractionMode';

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
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.7 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.7 });

  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 inline-block text-center relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background';
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2 text-base',
    lg: 'px-8 py-4 text-base',
  };
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg hover:shadow-cyan-400/45',
    secondary: 'bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white',
  };

  const styles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  const Component = href ? motion.a : motion.button;
  const props = href ? { href } : { onClick, type: 'button' as const };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!enableHoverMotion || variant !== 'primary' || !ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
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
