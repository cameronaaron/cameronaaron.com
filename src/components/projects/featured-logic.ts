export type FeaturedIconVariant = 'pen' | 'science' | 'code';

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
