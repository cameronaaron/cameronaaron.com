import { calculateTiltTargets } from '@/hooks/use3DTilt';

export function calculateTiltOffset(
  rect: DOMRect,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  // Same center-relative distance calc as use3DTilt's calculateTiltTargets,
  // just re-expressed as a signed offset (-0.5..0.5) instead of a 0..1 target.
  const target = calculateTiltTargets(rect, clientX, clientY);
  return { x: target.x - 0.5, y: target.y - 0.5 };
}
