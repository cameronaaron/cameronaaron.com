export interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type FeaturedIconVariant = 'pen' | 'science' | 'code';

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function calculateFeaturedSpotlightPosition(
  rect: SpotlightRect,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const xPct = ((clientX - rect.left) / rect.width) * 100;
  const yPct = ((clientY - rect.top) / rect.height) * 100;

  return {
    x: clampPercent(xPct),
    y: clampPercent(yPct),
  };
}

export function getFeaturedProjectCta(cta?: string): string {
  return cta ?? 'View Publication';
}

export function getFeaturedProjectLeadToken(title: string): string {
  return title.split(' ')[0] ?? title;
}

export function getFeaturedIconVariant(index: number): FeaturedIconVariant {
  if (index === 0) return 'pen';
  if (index === 1) return 'science';
  return 'code';
}
