export function getTypewriterStorageKey(text: string): string {
  return `typewriter-complete:${text}`;
}

export function readInitialComplete(storageKey: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.sessionStorage.getItem(storageKey) === '1') return true;
  } catch {
    // ignore
  }
  try {
    const nav = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (nav[0]?.type === 'back_forward') return true;
  } catch {
    // ignore
  }
  return false;
}

export function markTypewriterComplete(storageKey: string): void {
  try {
    window.sessionStorage.setItem(storageKey, '1');
  } catch {
    // ignore
  }
}
