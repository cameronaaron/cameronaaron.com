export function calculateMagneticOffset(
  rect: DOMRect,
  clientX: number,
  clientY: number,
  strength: number
): { x: number; y: number } {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return {
    x: (clientX - centerX) * strength,
    y: (clientY - centerY) * strength,
  };
}
