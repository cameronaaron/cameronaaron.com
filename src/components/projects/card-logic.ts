export interface TiltRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function calculateCardTiltTargets(rect: TiltRect, clientX: number, clientY: number) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const percentX = (clientX - centerX) / (rect.width / 2);
  const percentY = (clientY - centerY) / (rect.height / 2);

  return {
    x: 0.5 + percentX * 0.5,
    y: 0.5 + percentY * 0.5,
  };
}

export function getProjectReadingMinutes(description: string): number {
  return Math.max(2, Math.ceil(description.length / 130));
}

export function getProjectCardCta(cta?: string): string {
  return cta ?? 'Read More';
}
