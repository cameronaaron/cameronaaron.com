export function getMostVisibleEntry(
  entries: IntersectionObserverEntry[]
): IntersectionObserverEntry | undefined {
  return entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
}
