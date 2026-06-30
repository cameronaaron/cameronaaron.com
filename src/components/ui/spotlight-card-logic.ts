export function calculateSpotlightPosition(
  rect: DOMRect,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  return { x: clientX - rect.left, y: clientY - rect.top };
}
