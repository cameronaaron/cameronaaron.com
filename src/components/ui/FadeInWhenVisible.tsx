'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { getFadeDirectionOffset, type FadeDirection } from '@/components/ui/fade-in-logic';

interface FadeInWhenVisibleProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: FadeDirection;
  className?: string;
}

export default function FadeInWhenVisible({ 
  children, 
  delay = 0, 
  duration = 0.6,
  direction = 'up',
  className = '' 
}: FadeInWhenVisibleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, ...getFadeDirectionOffset(direction) }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
