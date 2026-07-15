/**
 * Verlet ribbon engine.
 *
 * A ribbon is a chain of point masses solved by Verlet integration plus
 * iterative distance-constraint relaxation — the classic position-based
 * dynamics rope. State lives in reused `Float32Array`s (positions + previous
 * positions) and a `Uint8Array` of pin flags; every per-frame function mutates
 * those buffers in place and returns nothing, so a steady-state frame allocates
 * zero objects (ENGINEERING-STANDARDS §2.6 / §2.8). Constants are named, not
 * inline. The endpoints are pinned so the ribbon hangs like a catenary and the
 * cursor pushes the free interior around.
 */

/** Nodes per ribbon — more nodes, smoother curve, still bounded constant work. */
export const RIBBON_NODE_COUNT = 26;

/** Verlet integration parameters. */
export const RIBBON_GRAVITY = 0.14;
export const RIBBON_DAMPING = 0.96;

/** Relaxation passes per frame — higher is stiffer, O(nodes × iterations). */
export const RIBBON_CONSTRAINT_ITERATIONS = 3;

/** Rest length exceeds the straight-line segment so the ribbon sags. */
export const RIBBON_SLACK = 1.08;

/** Cursor repulsion field. Squared radius avoids a sqrt in the reject path. */
export const POINTER_REPEL_RADIUS = 130;
export const POINTER_REPEL_RADIUS_SQ = POINTER_REPEL_RADIUS * POINTER_REPEL_RADIUS;
export const POINTER_REPEL_STRENGTH = 26;

/** Fractional heights at which each ribbon is strung across the band. */
export const RIBBON_LANES = [0.32, 0.5, 0.68] as const;

/** One stroke colour per ribbon lane (presentation, zipped by index). */
export const RIBBON_COLORS: readonly string[] = [
  'rgba(56, 214, 255, 0.55)',
  'rgba(92, 240, 205, 0.5)',
  'rgba(126, 231, 255, 0.42)',
];

/** Total kinetic energy below this (and no pointer) means the ribbon is at rest. */
export const RIBBON_REST_ENERGY = 0.02;

export interface RibbonState {
  count: number;
  x: Float32Array;
  y: Float32Array;
  /** Previous positions — Verlet derives velocity from (current - previous). */
  px: Float32Array;
  py: Float32Array;
  /** 1 = pinned (immovable), 0 = free. */
  pinned: Uint8Array;
  restLength: number;
}

/**
 * Build one ribbon of `count` nodes evenly spaced from (x0,y0) to (x1,y1), both
 * endpoints pinned. Previous positions start equal to current (zero initial
 * velocity). Allocates its buffers once; per-frame stepping reuses them.
 */
export function createRibbon(
  count: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): RibbonState {
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const px = new Float32Array(count);
  const py = new Float32Array(count);
  const pinned = new Uint8Array(count);

  const lastIndex = count - 1;
  for (let i = 0; i < count; i += 1) {
    const t = lastIndex === 0 ? 0 : i / lastIndex;
    const nx = x0 + (x1 - x0) * t;
    const ny = y0 + (y1 - y0) * t;
    x[i] = nx;
    px[i] = nx;
    y[i] = ny;
    py[i] = ny;
  }
  pinned[0] = 1;
  pinned[lastIndex] = 1;

  const span = Math.hypot(x1 - x0, y1 - y0);
  const segments = Math.max(1, lastIndex);
  const restLength = (span / segments) * RIBBON_SLACK;

  return { count, x, y, px, py, pinned, restLength };
}

/** Build the full set of ribbons for a band of the given pixel size. */
export function createRibbonSet(width: number, height: number): RibbonState[] {
  const ribbons: RibbonState[] = [];
  for (const lane of RIBBON_LANES) {
    ribbons.push(createRibbon(RIBBON_NODE_COUNT, 0, height * lane, width, height * lane));
  }
  return ribbons;
}

/**
 * Verlet position update: each free node moves by its damped implicit velocity
 * (current - previous), then gravity is added. Previous position is snapshotted
 * first. Pinned nodes are skipped so they stay put.
 */
export function integrateRibbon(
  state: RibbonState,
  gravity = RIBBON_GRAVITY,
  damping = RIBBON_DAMPING
): void {
  const { count, x, y, px, py, pinned } = state;
  for (let i = 0; i < count; i += 1) {
    if (pinned[i]) continue;
    const vx = (x[i] - px[i]) * damping;
    const vy = (y[i] - py[i]) * damping;
    px[i] = x[i];
    py[i] = y[i];
    x[i] += vx;
    y[i] += vy + gravity;
  }
}

/**
 * Push free nodes radially away from the pointer, scaled by how deep they are
 * inside the repel radius. Squared distance gates cheaply; the sqrt only runs
 * for the nodes actually in range.
 */
export function applyPointerForce(
  state: RibbonState,
  pointerX: number,
  pointerY: number,
  radius = POINTER_REPEL_RADIUS,
  strength = POINTER_REPEL_STRENGTH
): void {
  const radiusSq = radius * radius;
  const { count, x, y, pinned } = state;
  for (let i = 0; i < count; i += 1) {
    if (pinned[i]) continue;
    const dx = x[i] - pointerX;
    const dy = y[i] - pointerY;
    const distSq = dx * dx + dy * dy;
    if (distSq <= 0 || distSq >= radiusSq) continue;
    const dist = Math.sqrt(distSq);
    const falloff = (1 - dist / radius) * strength;
    x[i] += (dx / dist) * falloff;
    y[i] += (dy / dist) * falloff;
  }
}

/**
 * Distance-constraint relaxation: for each segment, nudge its two endpoints so
 * their separation returns toward `restLength`. Pinned endpoints don't move, so
 * their share of the correction is redistributed to the free end (weight-based,
 * handling every pin combination uniformly). Repeated `iterations` times to
 * stiffen the chain.
 */
export function satisfyConstraints(
  state: RibbonState,
  iterations = RIBBON_CONSTRAINT_ITERATIONS
): void {
  const { count, x, y, pinned, restLength } = state;
  for (let pass = 0; pass < iterations; pass += 1) {
    for (let i = 0; i < count - 1; i += 1) {
      const j = i + 1;
      const dx = x[j] - x[i];
      const dy = y[j] - y[i];
      const dist = Math.hypot(dx, dy);
      if (dist === 0) continue;

      const weightA = pinned[i] ? 0 : 1;
      const weightB = pinned[j] ? 0 : 1;
      const total = weightA + weightB;
      if (total === 0) continue;

      const diff = (dist - restLength) / dist;
      const moveA = weightA / total;
      const moveB = weightB / total;
      x[i] += dx * diff * moveA;
      y[i] += dy * diff * moveA;
      x[j] -= dx * diff * moveB;
      y[j] -= dy * diff * moveB;
    }
  }
}

/** One frame: integrate, apply the pointer field when active, then relax. */
export function stepRibbon(
  state: RibbonState,
  pointer: { x: number; y: number; active: boolean }
): void {
  integrateRibbon(state);
  if (pointer.active) applyPointerForce(state, pointer.x, pointer.y);
  satisfyConstraints(state);
}

/** Sum of squared node velocities — the loop sleeps when this falls to rest. */
export function ribbonKineticEnergy(state: RibbonState): number {
  const { count, x, y, px, py, pinned } = state;
  let energy = 0;
  for (let i = 0; i < count; i += 1) {
    if (pinned[i]) continue;
    const dx = x[i] - px[i];
    const dy = y[i] - py[i];
    energy += dx * dx + dy * dy;
  }
  return energy;
}

/** True once every ribbon has settled — used to park the rAF loop. */
export function ribbonSetAtRest(ribbons: RibbonState[]): boolean {
  for (const ribbon of ribbons) {
    if (ribbonKineticEnergy(ribbon) > RIBBON_REST_ENERGY) return false;
  }
  return true;
}
