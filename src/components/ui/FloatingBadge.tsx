'use client';

import { motion } from 'framer-motion';
import FloatingBadgeIcon from '@/components/ui/floating-badge-icon';
import {
  getFloatingBadgePositionClass,
  getFloatingBadgeYOffset,
  type FloatingBadgeIcon as FloatingBadgeIconType,
  type FloatingBadgePosition,
} from '@/components/ui/floating-badge-logic';

interface FloatingBadgeProps {
  icon: FloatingBadgeIconType;
  position: FloatingBadgePosition;
  delay?: number;
}

export default function FloatingBadge({ icon, position, delay = 0 }: FloatingBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: getFloatingBadgeYOffset(position),
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        opacity: { duration: 0.5, delay: delay + 0.5 },
        scale: { duration: 0.5, delay: delay + 0.5 },
        y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration: 5, repeat: Infinity, ease: "easeInOut", delay }
      }}
      className={`absolute ${getFloatingBadgePositionClass(position)} rounded-2xl p-3 shadow-xl border border-white/20 backdrop-blur-md bg-gradient-to-br from-cyan-400/25 to-emerald-400/20`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/15">
        <FloatingBadgeIcon icon={icon} />
      </div>
    </motion.div>
  );
}
