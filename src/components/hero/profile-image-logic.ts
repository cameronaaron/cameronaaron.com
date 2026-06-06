export const PROFILE_CONTAINER_ID = 'profile-container';

export const PROFILE_SPRING_CONFIG = {
  damping: 20,
  stiffness: 100,
} as const;

export function getProfileFloatAnimation(prefersReducedMotion: boolean): number | [number, number, number] {
  return prefersReducedMotion ? 0 : [0, -20, 0];
}

export function calculateProfilePointerTargets(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number
) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return {
    x: (clientX - centerX) / (rect.width / 2),
    y: (clientY - centerY) / (rect.height / 2),
  };
}
