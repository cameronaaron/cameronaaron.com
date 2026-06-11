'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  gradient?: boolean;
}

export default function Card({ children, className = '', hover = true, delay = 0, gradient = false }: CardProps) {
  const baseStyles = 'rounded-xl p-6 transition-all duration-300';
  const hoverStyles = hover ? 'hover:shadow-xl hover:scale-[1.02]' : '';
  const bgStyles = gradient 
    ? 'bg-gradient-to-br from-cyan-50 to-emerald-50 border border-cyan-100'
    : 'bg-white shadow-lg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={`${baseStyles} ${hoverStyles} ${bgStyles} ${className}`}
    >
      {children}
    </motion.div>
  );
}
