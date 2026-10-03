export const PROJECT_CARD_MAX_TAGS = 3;

export function getProjectReadingMinutes(description: string): number {
  return Math.max(2, Math.ceil(description.length / 130));
}

export interface ProjectCardLinkProps {
  href?: string;
  target?: '_blank';
  rel?: 'noopener noreferrer';
}

const NO_LINK_PROPS: ProjectCardLinkProps = Object.freeze({});

/**
 * Anchor attributes for a card whose work has a public URL, and none for one
 * that lives in a private repository — that card renders as an <article>, not
 * as an <a> with no href that still claims to open a new tab.
 */
export function getProjectCardLinkProps(link?: string): ProjectCardLinkProps {
  return link ? { href: link, target: '_blank', rel: 'noopener noreferrer' } : NO_LINK_PROPS;
}

export function getProjectCardCta(cta?: string): string {
  return cta ?? 'Read More';
}

/** Top tags shown on the card. Returns the input array unchanged when it
 *  already fits — zero allocation for the common case. */
export function getProjectTopTags(tags: readonly string[]): readonly string[] {
  return tags.length <= PROJECT_CARD_MAX_TAGS ? tags : tags.slice(0, PROJECT_CARD_MAX_TAGS);
}
