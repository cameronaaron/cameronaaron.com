/**
 * Scroll position is reset only when returning to the page without a target
 * anchor: a hash means the browser should land on that section, and a normal
 * navigation should keep whatever position the browser restored.
 */
export function shouldResetScrollPosition(hash: string, navigationType?: string): boolean {
  if (hash) return false;
  return navigationType === 'reload' || navigationType === 'back_forward';
}
