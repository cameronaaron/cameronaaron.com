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
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, position === 'top-right' ? -10 : 10, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        opacity: { duration: 0.5, delay: delay + 0.5 },
        scale: { duration: 0.5, delay: delay + 0.5 },
        y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration: 5, repeat: Infinity, ease: "easeInOut", delay }
      }}
      className={`absolute ${positionStyles[position]} glass-card rounded-full p-4 shadow-xl border border-white/20 backdrop-blur-md bg-white/10`}
    >
      <span className="text-2xl filter drop-shadow-lg">{emoji}</span>
    </motion.div>
  );
}
