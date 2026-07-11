export type FloatingBadgeIcon = 'innovation' | 'neuro';
export type FloatingBadgePosition = 'top-right' | 'bottom-left';

export function getFloatingBadgePositionClass(position: FloatingBadgePosition): string {
  return position === 'top-right' ? '-top-4 -right-4' : '-bottom-4 -left-4';
}

export function getFloatingBadgeYOffset(position: FloatingBadgePosition): [number, number, number] {
  return position === 'top-right' ? [0, -10, 0] : [0, 10, 0];
}

/** Infinite float keyframes, or a static 0 under reduced motion —
 *  same contract as getProfileFloatAnimation. */
export function getFloatingBadgeFloatAnimation(
  position: FloatingBadgePosition,
  reducedMotion: boolean
): [number, number, number] | 0 {
  return reducedMotion ? 0 : getFloatingBadgeYOffset(position);
}

/** Infinite rotate-wobble keyframes, or a static 0 under reduced motion. */
export function getFloatingBadgeRotateAnimation(reducedMotion: boolean): [number, number, number, number] | 0 {
  return reducedMotion ? 0 : [0, 5, -5, 0];
}
