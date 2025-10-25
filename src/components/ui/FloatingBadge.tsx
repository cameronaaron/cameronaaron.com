'use client';

import { motion } from 'framer-motion';

interface FloatingBadgeProps {
  emoji: string;
  position: 'top-right' | 'bottom-left';
  delay?: number;
}

export default function FloatingBadge({ emoji, position, delay = 0 }: FloatingBadgeProps) {
  const positionStyles = {
    'top-right': '-top-4 -right-4',
    'bottom-left': '-bottom-4 -left-4',
  };

  return (
    <motion.div
      animate={{ y: [0, position === 'top-right' ? -10 : 10, 0] }}
      transition={{ duration: 3, repeat: Infinity, delay }}
      className={`absolute ${positionStyles[position]} bg-white rounded-full p-4 shadow-xl`}
    >
      <span className="text-2xl">{emoji}</span>
    </motion.div>
  );
}
