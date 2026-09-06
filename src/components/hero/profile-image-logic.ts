import { calculateTiltTargets, type TiltRect } from '@/hooks/use3DTilt';

export const PROFILE_CONTAINER_ID = 'profile-container';

export const PROFILE_SPRING_CONFIG = {
  damping: 20,
  stiffness: 100,
} as const;

export function calculateProfilePointerTargets(rect: TiltRect, clientX: number, clientY: number) {
  // Same center-relative distance calc as use3DTilt's calculateTiltTargets,
  // just re-expressed as -1..1 relative to the hovered portrait instead of
  // a 0..1 target. Pointer events are scoped to that portrait in ProfileImage.
  const target = calculateTiltTargets(rect, clientX, clientY);
  return { x: (target.x - 0.5) * 2, y: (target.y - 0.5) * 2 };
}
