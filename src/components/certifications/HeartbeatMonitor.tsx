'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import {
  HEARTBEAT_PATH,
  HEARTBEAT_VIEWBOX,
  getHeartbeatDuration,
} from '@/components/certifications/heartbeat-logic';

/**
 * A small looping ECG trace next to the section header — a nod to the EMT /
 * BLS / ACLS / PALS credentials in this section. Speeds up on hover (mouse
 * touch reacts, per the site's "everything should react" direction) and
 * holds still for `prefers-reduced-motion`.
 */
export default function HeartbeatMonitor() {
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();
  const [isHovering, setIsHovering] = useState(false);
  const duration = getHeartbeatDuration(isHovering);

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/5 px-3 py-1.5"
      onMouseEnter={enableHoverMotion ? () => setIsHovering(true) : undefined}
      onMouseLeave={enableHoverMotion ? () => setIsHovering(false) : undefined}
      data-testid="heartbeat-monitor"
    >
      <svg viewBox={HEARTBEAT_VIEWBOX} className="h-4 w-12 text-emerald-400" aria-hidden="true" fill="none">
        {prefersReducedMotion ? (
          <path d={HEARTBEAT_PATH} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <motion.path
            d={HEARTBEAT_PATH}
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ pathLength: [0, 1, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration, repeat: Infinity, ease: 'linear' }}
            data-testid="heartbeat-monitor-path"
            data-duration={duration}
          />
        )}
      </svg>
      <span className="text-xs font-medium text-emerald-300/80">Live vitals</span>
    </div>
  );
}
