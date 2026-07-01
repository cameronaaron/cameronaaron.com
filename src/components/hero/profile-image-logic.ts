import { calculateTiltTargets, type TiltRect } from '@/hooks/use3DTilt';

export const PROFILE_CONTAINER_ID = 'profile-container';

export const PROFILE_SPRING_CONFIG = {
  damping: 20,
  stiffness: 100,
} as const;

export function getProfileFloatAnimation(prefersReducedMotion: boolean): number | [number, number, number] {
  return prefersReducedMotion ? 0 : [0, -20, 0];
}

export function calculateProfilePointerTargets(rect: TiltRect, clientX: number, clientY: number) {
  // Same center-relative distance calc as use3DTilt's calculateTiltTargets,
  // just re-expressed as -1..1 (not clamped to the container — ProfileImage
  // tracks the pointer across the whole window) instead of a 0..1 target.
  const target = calculateTiltTargets(rect, clientX, clientY);
  return { x: (target.x - 0.5) * 2, y: (target.y - 0.5) * 2 };
}
