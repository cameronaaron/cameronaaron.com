export function calculateTiltOffset(
  rect: DOMRect,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  return {
    x: (clientX - rect.left - rect.width / 2) / rect.width,
    y: (clientY - rect.top - rect.height / 2) / rect.height,
  };
}
