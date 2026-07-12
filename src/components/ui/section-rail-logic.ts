export interface SectionRailItem {
  id: string;
  label: string;
}

export const RAIL_SECTIONS: SectionRailItem[] = [
  { id: 'home', label: 'Intro' },
  { id: 'certifications', label: 'Credentials' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Research' },
  { id: 'skills', label: 'Skills' },
  { id: 'testimonials', label: 'Voices' },
  { id: 'contact', label: 'Connect' },
];

export function getMostVisibleEntry(
  entries: IntersectionObserverEntry[]
): IntersectionObserverEntry | undefined {
  // Single-pass max instead of filter+sort — O(n) instead of O(n log n),
  // and a strict `>` comparison keeps the same "first wins on a tie" behavior
  // a stable sort would give.
  let best: IntersectionObserverEntry | undefined;

  for (const entry of entries) {
    if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
      best = entry;
    }
  }

  return best;
}
