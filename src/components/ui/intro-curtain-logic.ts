export const INTRO_CURTAIN_STORAGE_KEY = 'intro-curtain-shown';

export const REDUCED_MOTION_MAX_HOLD_MS = 220;

export function getEffectiveHoldMs(holdMs: number, reducedMotion: boolean): number {
  return reducedMotion ? Math.min(holdMs, REDUCED_MOTION_MAX_HOLD_MS) : holdMs;
}

export function shouldSkipInitialCurtain(storageKey: string = INTRO_CURTAIN_STORAGE_KEY): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (window.sessionStorage.getItem(storageKey) === '1') return true;
  } catch {
    // sessionStorage may be unavailable (private mode, etc.) — fall through.
  }
  try {
    const nav = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    // Stryker disable next-line OptionalChaining: this whole lookup is
    // wrapped in the surrounding try/catch. If `nav[0]` is nullish, dropping
    // `?.` makes `.type` throw a TypeError instead of short-circuiting to
    // undefined — but that throw is caught by the same catch block right
    // below, which falls through to the identical `return false` the real
    // (non-throwing) `undefined === 'back_forward'` path would have reached
    // anyway. Hand-verified: removing `?.` here leaves the full intro-curtain
    // suite (logic, coverage, and component tests) passing bit-for-bit.
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
