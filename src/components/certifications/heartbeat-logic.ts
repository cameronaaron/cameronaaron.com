/**
 * Decorative-but-thematic ECG trace for the Clinical Certifications section
 * (EMT / BLS / ACLS / PALS content). One cardiac cycle — flat baseline, a
 * small P-wave bump, the sharp QRS spike, a T-wave bump, back to baseline —
 * expressed as a single SVG path so it can be draw-animated with
 * `pathLength` like the rest of this repo's status icons.
 */
export const HEARTBEAT_PATH =
  'M0 20 L20 20 L26 8 L32 32 L38 4 L44 20 L52 20 L58 14 L64 20 L100 20';

export const HEARTBEAT_VIEWBOX = '0 0 100 40';

/** One full sweep across the trace at rest. */
export const HEARTBEAT_LOOP_DURATION_S = 2.4;

/** Hovering reads as "excitement" — the trace sweeps faster, like a rising heart rate. */
export const HEARTBEAT_HOVER_SPEED_MULTIPLIER = 0.45;

export function getHeartbeatDuration(isHovering: boolean): number {
  return isHovering ? HEARTBEAT_LOOP_DURATION_S * HEARTBEAT_HOVER_SPEED_MULTIPLIER : HEARTBEAT_LOOP_DURATION_S;
}
