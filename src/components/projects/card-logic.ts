export const PROJECT_CARD_MAX_TAGS = 3;

export function getProjectReadingMinutes(description: string): number {
  return Math.max(2, Math.ceil(description.length / 130));
}

export function getProjectCardCta(cta?: string): string {
  return cta ?? 'Read More';
}

/** Top tags shown on the card. Returns the input array unchanged when it
 *  already fits — zero allocation for the common case. */
export function getProjectTopTags(tags: readonly string[]): readonly string[] {
  return tags.length <= PROJECT_CARD_MAX_TAGS ? tags : tags.slice(0, PROJECT_CARD_MAX_TAGS);
}
