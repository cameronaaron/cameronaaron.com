/**
 * Scroll position is reset only when returning to the page without a target
 * anchor: a hash means the browser should land on that section, and a normal
 * navigation should keep whatever position the browser restored.
 */
export function shouldResetScrollPosition(hash: string, navigationType?: string): boolean {
  if (hash) return false;
  return navigationType === 'reload' || navigationType === 'back_forward';
}

/**
 * Strips the leading `#` from a URL hash, returning the target element id.
 * Null for an empty hash or the bare `#` fragment (nothing to scroll to).
 */
export function resolveHashElementId(hash: string): string | null {
  if (!hash || hash.length < 2 || hash.charAt(0) !== '#') return null;
  return hash.slice(1);
}
