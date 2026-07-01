export function getProjectReadingMinutes(description: string): number {
  return Math.max(2, Math.ceil(description.length / 130));
}

export function getProjectCardCta(cta?: string): string {
  return cta ?? 'Read More';
}
