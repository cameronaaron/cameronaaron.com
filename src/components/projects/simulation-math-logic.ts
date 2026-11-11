/**
 * Small deterministic helpers shared by the interactive research demos and
 * the skill web. They lived in the hero's particle engine until that canvas
 * was removed (2026-11); the demos were its only other callers.
 */

/** Linear congruential generator (Numerical Recipes constants): same seed, same sequence. */
export function createSeededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

/** Pointer position as a 0–100 percentage of a box, safe against a zero-sized box. */
export function normalizePointerToPercent(
  clientX: number,
  clientY: number,
  width: number,
  height: number
): { x: number; y: number } {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  return {
    x: (clientX / safeWidth) * 100,
    y: (clientY / safeHeight) * 100,
  };
}
