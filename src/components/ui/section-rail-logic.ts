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
