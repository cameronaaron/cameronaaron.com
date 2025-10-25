'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

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
  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 inline-block text-center';
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2 text-base',
    lg: 'px-8 py-4 text-base',
  };
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-500/50 hover:scale-105',
    secondary: 'bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white',
  };

  const styles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  const Component = href ? motion.a : motion.button;
  const props = href ? { href } : { onClick, type: 'button' as const };

  return (
    <Component
      {...props}
      whileHover={{ scale: variant === 'primary' ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={styles}
      aria-label={ariaLabel}
    >
      {children}
    </Component>
  );
}
