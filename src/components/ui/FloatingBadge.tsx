'use client';

import { motion } from 'framer-motion';

interface FloatingBadgeProps {
  icon: 'innovation' | 'neuro';
  position: 'top-right' | 'bottom-left';
  delay?: number;
}

function BadgeIcon({ icon }: Pick<FloatingBadgeProps, 'icon'>) {
  if (icon === 'neuro') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-100" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-1v2h1a3 3 0 0 1 3 3v1" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V7" />
        <circle cx="7" cy="6" r="1.4" fill="currentColor" />
        <circle cx="17" cy="18" r="1.4" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan-100" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14.5 14.4 4.2c.6-.6 1.6-.5 2.1.2l3.3 4.4c.4.6.4 1.3-.2 1.8L9.2 20.8c-.4.4-1 .6-1.5.5l-3.9-1c-.8-.2-1.2-1-.9-1.8l1-3.5c.1-.4.3-.7.5-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 6 6 6" />
    </svg>
  );
}

export default function FloatingBadge({ icon, position, delay = 0 }: FloatingBadgeProps) {
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
      className={`absolute ${positionStyles[position]} rounded-2xl p-3 shadow-xl border border-white/20 backdrop-blur-md bg-gradient-to-br from-cyan-400/25 to-emerald-400/20`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/15">
        <BadgeIcon icon={icon} />
      </div>
    </motion.div>
  );
}
