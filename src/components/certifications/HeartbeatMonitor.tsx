'use client';

import { useState, type CSSProperties } from 'react';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import {
  HEARTBEAT_PATH,
  HEARTBEAT_VIEWBOX,
  getHeartbeatDuration,
} from '@/components/certifications/heartbeat-logic';

// Total length of HEARTBEAT_PATH in viewBox units (~165), rounded up so the
// stroke-dasharray fully covers the trace at the drawn keyframe. Only used to
// seed the CSS draw animation's dash geometry.
const ECG_DASH_LENGTH = 180;

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
          // CSS stroke-dashoffset draw (compositor) instead of framer pathLength;
          // hover still speeds it up by driving --ecg-duration off React state
          // (low-frequency), and the section's content-visibility pauses it while
          // off-screen. data-duration kept for the existing tests.
          <path
            className="ecg-trace-anim"
            d={HEARTBEAT_PATH}
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ '--ecg-len': ECG_DASH_LENGTH, '--ecg-duration': `${duration}s` } as CSSProperties}
            data-testid="heartbeat-monitor-path"
            data-duration={duration}
          />
        )}
      </svg>
      <span className="text-xs font-medium text-emerald-300/80">Live vitals</span>
    </div>
  );
}
