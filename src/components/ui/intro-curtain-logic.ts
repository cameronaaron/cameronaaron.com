export const INTRO_CURTAIN_STORAGE_KEY = 'intro-curtain-shown';

export function shouldSkipInitialCurtain(storageKey: string = INTRO_CURTAIN_STORAGE_KEY): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (window.sessionStorage.getItem(storageKey) === '1') return true;
  } catch {
    // sessionStorage may be unavailable (private mode, etc.) — fall through.
  }
  try {
    const nav = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (nav[0]?.type === 'back_forward') return true;
  } catch {
    // ignore
  }
  return false;
}

export function markIntroCurtainShown(storageKey: string = INTRO_CURTAIN_STORAGE_KEY): void {
  try {
    window.sessionStorage.setItem(storageKey, '1');
  } catch {
    // ignore
  }
}
