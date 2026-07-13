/** Fixed pool of ripple nodes reused round-robin — never grows per click. */
export const POINTER_RIPPLE_POOL_SIZE = 4;

export const RIPPLE_DIAMETER_PX = 160;

/** Stable render list for the pool (catalogs live in logic modules). */
export const RIPPLE_POOL_INDICES: readonly number[] = Array.from(
  { length: POINTER_RIPPLE_POOL_SIZE },
  (_, index) => index
);

export function getNextRippleIndex(current: number, poolSize: number): number {
  return (current + 1) % poolSize;
}

/** Top-left offset that centres a ripple of `diameter` on the pointer. */
export function getRippleOffset(
  clientX: number,
  clientY: number,
  diameter: number
): { left: number; top: number } {
  const half = diameter / 2;
  return { left: clientX - half, top: clientY - half };
}
