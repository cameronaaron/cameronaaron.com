export interface TiltRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function calculateTiltTargets(rect: TiltRect, clientX: number, clientY: number) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const percentX = (clientX - centerX) / (rect.width / 2);
  const percentY = (clientY - centerY) / (rect.height / 2);

  return {
    x: 0.5 + percentX * 0.5,
    y: 0.5 + percentY * 0.5,
  };
}

export function buildCompanyMonogram(company: string): string {
  return company
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}
