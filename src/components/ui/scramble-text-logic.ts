/** Glyph pool for unresolved characters — punchy, terminal-flavoured. */
export const SCRAMBLE_GLYPHS = '!<>-_\\/[]{}=+*^?#';

/** Characters revealed per animation frame (fractional → sub-frame pacing). */
export const SCRAMBLE_REVEAL_PER_FRAME = 0.34;

/** Only this many characters past the reveal point churn each frame. */
export const SCRAMBLE_WINDOW = 3;

export function pickScrambleGlyph(random: () => number): string {
  return SCRAMBLE_GLYPHS[Math.floor(random() * SCRAMBLE_GLYPHS.length)];
}

/**
 * Write one scramble frame into the caller-owned `out` char array and return
 * the joined string. Characters before `revealed` are final; the next
 * SCRAMBLE_WINDOW characters churn; the tail keeps whatever glyphs it already
 * holds (seeded on start), so per-frame work is bounded by the window — the
 * array is reused across frames and no per-frame allocation beyond the join.
 */
export function scrambleFrame(
  target: string,
  revealed: number,
  random: () => number,
  out: string[]
): string {
  const revealedCount = Math.min(target.length, Math.floor(revealed));
  for (let i = 0; i < revealedCount; i += 1) {
    out[i] = target[i];
  }
  const windowEnd = Math.min(target.length, revealedCount + SCRAMBLE_WINDOW);
  for (let i = revealedCount; i < windowEnd; i += 1) {
    out[i] = target[i] === ' ' ? ' ' : pickScrambleGlyph(random);
  }
  out.length = target.length;
  return out.join('');
}

/** Seed the scratch array with glyphs so the first frame is fully scrambled. */
export function seedScrambleScratch(target: string, random: () => number, out: string[]): void {
  out.length = target.length;
  for (let i = 0; i < target.length; i += 1) {
    out[i] = target[i] === ' ' ? ' ' : pickScrambleGlyph(random);
  }
}

export function isScrambleComplete(target: string, revealed: number): boolean {
  return revealed >= target.length;
}
