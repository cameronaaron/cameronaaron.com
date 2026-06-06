export function readInitialReveal(storageKey: string): boolean {
  if (typeof window === 'undefined') return false;
  if (window.sessionStorage.getItem(storageKey) === '1') return true;
  const nav = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  return nav[0]?.type === 'back_forward';
}

export function splitRevealWords(text: string): string[] {
  return text.split(' ');
}
