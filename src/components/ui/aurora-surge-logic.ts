/** Fired on window when the Konami code completes — CursorComet listens. */
export const AURORA_SURGE_EVENT = 'aurora-surge';

/** How long the surge overlay stays mounted. */
export const SURGE_DURATION_MS = 3200;

export const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const;

/** Letters match case-insensitively; named keys (arrows) match verbatim. */
export function normalizeKonamiKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}

/**
 * Advance the sequence cursor for one keypress. A mismatch restarts — at 1 if
 * the key could begin a fresh attempt, else at 0. Completion is when the
 * returned index equals KONAMI_SEQUENCE.length.
 */
export function advanceKonamiIndex(index: number, rawKey: string): number {
  const key = normalizeKonamiKey(rawKey);
  if (key === KONAMI_SEQUENCE[index]) return index + 1;
  return key === KONAMI_SEQUENCE[0] ? 1 : 0;
}

export function isKonamiComplete(index: number): boolean {
  return index >= KONAMI_SEQUENCE.length;
}
