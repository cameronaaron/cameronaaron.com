import { memo } from 'react';
import { motion } from 'framer-motion';

interface BrainCursorProps {
  active: boolean;
}

function BrainCursor({ active }: BrainCursorProps) {
  // Two hemispheres made of stacked curves + a few "synapse" sparks that
  // pulse faster when hovering interactive targets. ~32px square.
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="brain cursor"
    >
      <defs>
        <radialGradient id="brainCoreGradient" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#22d3ee" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id="brainStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>

      <path
        d="M16 4.5
           c-2.6 0-4.7 1.6-5.4 3.8
           c-2.4 0.3-4.1 2.3-4.1 4.7
           c0 1 0.3 1.9 0.8 2.7
           c-0.9 0.9-1.4 2.1-1.4 3.4
           c0 2.5 1.9 4.6 4.4 4.9
           c0.6 2.2 2.7 3.8 5.2 3.8
           c0.2 0 0.4 0 0.5-0.02
           V4.52
           c-0.2-0.01-0.3-0.02-0.5-0.02 z"
        fill="url(#brainCoreGradient)"
        stroke="url(#brainStroke)"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path
        d="M16 4.5
           c2.6 0 4.7 1.6 5.4 3.8
           c2.4 0.3 4.1 2.3 4.1 4.7
           c0 1-0.3 1.9-0.8 2.7
           c0.9 0.9 1.4 2.1 1.4 3.4
           c0 2.5-1.9 4.6-4.4 4.9
           c-0.6 2.2-2.7 3.8-5.2 3.8
           c-0.2 0-0.4 0-0.5-0.02
           V4.52
           c0.2-0.01 0.3-0.02 0.5-0.02 z"
        fill="url(#brainCoreGradient)"
        stroke="url(#brainStroke)"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />

      <g stroke="#0f172a" strokeOpacity="0.55" strokeWidth="0.7" strokeLinecap="round" fill="none">
        <path d="M10 9 q1.3 1.2 0 2.4 q-1.3 1.2 0 2.4 q1.3 1.2 0 2.4" />
        <path d="M8.5 14 q1.5 1 3 0 q1.5-1 3 0" />
        <path d="M9.5 19 q1.2 1.2 2.4 0 q1.2-1.2 2.4 0" />
        <path d="M22 9 q-1.3 1.2 0 2.4 q-1.3 1.2 0 2.4 q-1.3 1.2 0 2.4" />
        <path d="M17.5 14 q1.5 1 3 0 q1.5-1 3 0" />
        <path d="M17.6 19 q1.2 1.2 2.4 0 q1.2-1.2 2.4 0" />
      </g>

      <line
        x1="16"
        y1="4.5"
        x2="16"
        y2="27.5"
        stroke="url(#brainStroke)"
        strokeWidth="0.7"
        strokeOpacity="0.85"
      />

      <g>
        <motion.circle
          cx="6"
          cy="11"
          r="0.9"
          fill="#67e8f9"
          animate={{ opacity: [0.2, 1, 0.2], r: [0.7, 1.1, 0.7] }}
          transition={{ duration: active ? 0.9 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="26"
          cy="13.5"
          r="0.9"
          fill="#6ee7b7"
          animate={{ opacity: [0.2, 1, 0.2], r: [0.7, 1.1, 0.7] }}
          transition={{ duration: active ? 0.7 : 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        />
        <motion.circle
          cx="16"
          cy="2.5"
          r="0.9"
          fill="#a7f3d0"
          animate={{ opacity: [0.2, 1, 0.2], r: [0.7, 1.1, 0.7] }}
          transition={{ duration: active ? 0.8 : 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        <motion.circle
          cx="11"
          cy="25"
          r="0.8"
          fill="#7dd3fc"
          animate={{ opacity: [0.15, 0.9, 0.15], r: [0.6, 1, 0.6] }}
          transition={{ duration: active ? 1 : 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />
      </g>
    </svg>
  );
}
