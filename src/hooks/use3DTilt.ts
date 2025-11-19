'use client';

import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { MouseEvent } from 'react';

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
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const percentX = (e.clientX - centerX) / (rect.width / 2);
    const percentY = (e.clientY - centerY) / (rect.height / 2);
    
    x.set(0.5 + percentX * 0.5);
    y.set(0.5 + percentY * 0.5);
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
