import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '@/components/hero/interactive-particles/engine';
import type { Entity, SimulationState } from './predator-prey-logic';
import {
  ARENA_SIZE,
  CATCH_RADIUS,
  CATCH_RADIUS_SQ,
  FRAME_MS,
  INITIAL_SIM_SEED,
  INITIAL_TARGET,
  KEYBOARD_NUDGE_STEP,
  PAUSED_CAPTION,
  PREDATOR_START_MIN,
  PREDATOR_START_RANGE,
  PREY_START_MIN,
  PREY_START_RANGE,
  SIMULATION_ARIA_LABEL,
  VELOCITY_DAMPING,
  applyArenaBoundary,
  applySeek,
  clampToArena,
  createInitialEntities,
  formatSurvivalSeconds,
  getArrowKeyDelta,
  getCatchAnnouncement,
  getInitialSimulationState,
  isAnimationEnabled,
  isCaught,
  nudgeTarget,
  pointerToArenaPoint,
  setTarget,
  stepSimulation,
} from './predator-prey-logic';

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return { x: 0, y: 0, vx: 0, vy: 0, ...overrides };
}

describe('clampToArena', () => {
  it('passes values already inside the arena through unchanged', () => {
    expect(clampToArena(50)).toBe(50);
    expect(clampToArena(0)).toBe(0);
    expect(clampToArena(ARENA_SIZE)).toBe(ARENA_SIZE);
  });

  it('clamps below-zero values to exactly 0', () => {
    expect(clampToArena(-1)).toBe(0);
    expect(clampToArena(-1000)).toBe(0);
  });

  it('clamps above-arena values to exactly ARENA_SIZE', () => {
    expect(clampToArena(ARENA_SIZE + 1)).toBe(ARENA_SIZE);
    expect(clampToArena(9999)).toBe(ARENA_SIZE);
  });
});

describe('createInitialEntities / getInitialSimulationState — deterministic layout', () => {
  it('is deterministic for a fixed seed — exact reproduction', () => {
    const first = createInitialEntities(INITIAL_SIM_SEED);
    const second = createInitialEntities(INITIAL_SIM_SEED);
    expect(second).toEqual(first);
  });

  it('produces a different layout for a different seed', () => {
    const a = createInitialEntities(1);
    const b = createInitialEntities(2);
    expect(a).not.toEqual(b);
  });

  it('spawns the prey within its designed band, at rest', () => {
    const { prey } = createInitialEntities(INITIAL_SIM_SEED);
    expect(prey.x).toBeGreaterThanOrEqual(PREY_START_MIN);
    expect(prey.x).toBeLessThanOrEqual(PREY_START_MIN + PREY_START_RANGE);
    expect(prey.y).toBeGreaterThanOrEqual(PREY_START_MIN);
    expect(prey.y).toBeLessThanOrEqual(PREY_START_MIN + PREY_START_RANGE);
    expect(prey.vx).toBe(0);
    expect(prey.vy).toBe(0);
  });

  it('spawns the predator within its designed band, at rest', () => {
    const { predator } = createInitialEntities(INITIAL_SIM_SEED);
    expect(predator.x).toBeGreaterThanOrEqual(PREDATOR_START_MIN);
    expect(predator.x).toBeLessThanOrEqual(PREDATOR_START_MIN + PREDATOR_START_RANGE);
    expect(predator.y).toBeGreaterThanOrEqual(PREDATOR_START_MIN);
    expect(predator.y).toBeLessThanOrEqual(PREDATOR_START_MIN + PREDATOR_START_RANGE);
    expect(predator.vx).toBe(0);
    expect(predator.vy).toBe(0);
  });

  it('never starts the round already caught', () => {
    const { predator, prey } = createInitialEntities(INITIAL_SIM_SEED);
    expect(isCaught(predator, prey)).toBe(false);
  });

  it('computes each coordinate as exactly MIN + random() * RANGE for the seeded sequence', () => {
    // Independently re-derives the expected sequence from the same PRNG rather
    // than asserting loose bounds — a loose >=/<= check can't distinguish
    // MIN + random() * RANGE from MIN + random() / RANGE when both happen to
    // land inside the same acceptable band for a given seed.
    const random = createSeededRandom(INITIAL_SIM_SEED);
    const expectedPreyX = PREY_START_MIN + random() * PREY_START_RANGE;
    const expectedPreyY = PREY_START_MIN + random() * PREY_START_RANGE;
    const expectedPredatorX = PREDATOR_START_MIN + random() * PREDATOR_START_RANGE;
    const expectedPredatorY = PREDATOR_START_MIN + random() * PREDATOR_START_RANGE;

    const { predator, prey } = createInitialEntities(INITIAL_SIM_SEED);
    expect(prey.x).toBe(expectedPreyX);
    expect(prey.y).toBe(expectedPreyY);
    expect(predator.x).toBe(expectedPredatorX);
    expect(predator.y).toBe(expectedPredatorY);
  });

  it('builds a full simulation state with zeroed counters and a centered target', () => {
    const state = getInitialSimulationState();
    expect(state.elapsedMs).toBe(0);
    expect(state.catches).toBe(0);
    expect(state.bestSurvivalMs).toBe(0);
    expect(state.lastSurvivalMs).toBe(0);
    expect(state.target).toEqual({ x: INITIAL_TARGET.x, y: INITIAL_TARGET.y });
  });

  it('the initial target is exactly the arena center', () => {
    expect(INITIAL_TARGET).toEqual({ x: ARENA_SIZE / 2, y: ARENA_SIZE / 2 });
  });

  it("the target object is a fresh copy, not a shared reference to INITIAL_TARGET", () => {
    const state = getInitialSimulationState();
    state.target.x = 1;
    expect(INITIAL_TARGET.x).toBe(ARENA_SIZE / 2);
  });
});

describe('applySeek — steering math, exact values', () => {
  it('accelerates directly toward a target on the +x axis, clamped by maxForce', () => {
    // dx=10, dy=0 -> distance=10 -> desired=(2,0). steer=(2,0), magnitude 2 > maxForce 1,
    // so steer scales to (1,0). vx = (0 + 1*1) * VELOCITY_DAMPING; x = 0 + vx*1.
    const entity = makeEntity();
    applySeek(entity, 10, 0, 2, 1, 1);

    const expectedVx = 1 * VELOCITY_DAMPING;
    expect(entity.vx).toBe(expectedVx);
    expect(entity.vy).toBe(0);
    expect(entity.x).toBe(expectedVx);
    expect(entity.y).toBe(0);
  });

  it('does not scale the steering force when already under maxForce', () => {
    // dx=1, dy=0 -> distance=1 -> desired=(1,0) (maxSpeed=1). steer=(1,0), magnitude
    // 1 === maxForce 2 -> no clamp needed (1 <= 2).
    const entity = makeEntity();
    applySeek(entity, 1, 0, 1, 2, 1);

    const expectedVx = 1 * VELOCITY_DAMPING;
    expect(entity.vx).toBe(expectedVx);
    expect(entity.x).toBe(expectedVx);
  });

  it('produces zero desired velocity, and only damps existing velocity, once already at the target', () => {
    const entity = makeEntity({ vx: 2, vy: -2 });
    applySeek(entity, 0, 0, 5, 1, 1);

    // distance < 1e-4 -> desired=(0,0). steer = -velocity, clamped to maxForce 1
    // (magnitude of (-2,2) is ~2.83 > 1) -> scaled to unit length * 1.
    const steerMagnitude = Math.sqrt(2 * 2 + 2 * 2);
    const expectedVx = (2 + (-2 / steerMagnitude) * 1) * VELOCITY_DAMPING;
    const expectedVy = (-2 + (2 / steerMagnitude) * 1) * VELOCITY_DAMPING;
    expect(entity.vx).toBeCloseTo(expectedVx, 10);
    expect(entity.vy).toBeCloseTo(expectedVy, 10);
  });

  it('scales work linearly with the step multiplier (double step, double integration distance for a settled velocity)', () => {
    const entityStepOne = makeEntity();
    applySeek(entityStepOne, 10, 0, 2, 1, 1);

    const entityStepTwo = makeEntity();
    applySeek(entityStepTwo, 10, 0, 2, 1, 2);

    // Both are force-clamped to the same steer vector (1,0); step=2 applies twice the
    // velocity delta and then integrates position over twice the step.
    expect(entityStepTwo.vx).toBeCloseTo(entityStepOne.vx * 2, 10);
  });

  it('steers diagonally using a 3-4-5 triangle, exercising a nonzero dx, dy, AND a nonzero entity position', () => {
    // Every other case in this block starts the entity at x=0 with dy=0, which
    // cannot distinguish `targetX - entity.x` from `targetX + entity.x` (both
    // equal targetX when entity.x is 0), nor the dy-only terms of the distance/
    // desired-velocity formulas. entity=(7,6), target=(10,10): dx=3, dy=4,
    // distance=5 exactly. maxSpeed=5 makes desired=(3,4) exactly; maxForce=100
    // is large enough that the clamp branch never triggers, isolating just the
    // seek-vector arithmetic.
    const entity = makeEntity({ x: 7, y: 6 });
    applySeek(entity, 10, 10, 5, 100, 1);

    const expectedVx = 3 * VELOCITY_DAMPING;
    const expectedVy = 4 * VELOCITY_DAMPING;
    expect(entity.vx).toBe(expectedVx);
    expect(entity.vy).toBe(expectedVy);
    expect(entity.x).toBe(7 + expectedVx);
    expect(entity.y).toBe(6 + expectedVy);
  });

  it('treats a distance of exactly the divide-by-zero epsilon as still "at rest" (boundary is exclusive)', () => {
    // 0.0001 * 0.0001 -> sqrt -> 0.0001 round-trips bit-exactly in IEEE754, so
    // this lands precisely on the `distance > 1e-4` boundary: distance must NOT
    // be treated as "far enough to compute a direction" here, or the entity
    // would accelerate off a target it's already effectively standing on.
    const entity = makeEntity({ x: 0, y: 0 });
    applySeek(entity, 0.0001, 0, 5, 1, 1);

    expect(entity.vx).toBe(0);
    expect(entity.vy).toBe(0);
    expect(entity.x).toBe(0);
    expect(entity.y).toBe(0);
  });

  // Not tested: `steerMagnitude > maxForce` at the exact boundary. Proven
  // equivalent by construction — at steerMagnitude === maxForce, `scale =
  // maxForce / steerMagnitude` is exactly 1, so `steerX *= scale` and
  // `steerY *= scale` are no-ops whether or not the branch is entered. A
  // Stryker `>` -> `>=` mutant here cannot produce a different result for any
  // input (2026-07, hand-verified per ENGINEERING-STANDARDS.md §6 item 13).
});

describe('applyArenaBoundary — exact bounce values', () => {
  it('leaves an entity exactly at the boundary untouched (strict > / < only)', () => {
    const atMax = makeEntity({ x: ARENA_SIZE, y: ARENA_SIZE, vx: 3, vy: 3 });
    applyArenaBoundary(atMax);
    expect(atMax).toEqual({ x: ARENA_SIZE, y: ARENA_SIZE, vx: 3, vy: 3 });

    const atZero = makeEntity({ x: 0, y: 0, vx: -3, vy: -3 });
    applyArenaBoundary(atZero);
    expect(atZero).toEqual({ x: 0, y: 0, vx: -3, vy: -3 });
  });

  it('clamps past the right/bottom edges and inverts velocity by BOUNDARY_BOUNCE_FACTOR', () => {
    const entity = makeEntity({ x: ARENA_SIZE + 5, y: ARENA_SIZE + 10, vx: 2, vy: 4 });
    applyArenaBoundary(entity);

    expect(entity.x).toBe(ARENA_SIZE);
    expect(entity.y).toBe(ARENA_SIZE);
    expect(entity.vx).toBeCloseTo(2 * -0.85, 10);
    expect(entity.vy).toBeCloseTo(4 * -0.85, 10);
  });

  it('clamps past the left/top edges and inverts velocity by BOUNDARY_BOUNCE_FACTOR', () => {
    const entity = makeEntity({ x: -5, y: -10, vx: -2, vy: -4 });
    applyArenaBoundary(entity);

    expect(entity.x).toBe(0);
    expect(entity.y).toBe(0);
    expect(entity.vx).toBeCloseTo(-2 * -0.85, 10);
    expect(entity.vy).toBeCloseTo(-4 * -0.85, 10);
  });
});

describe('isCaught — boundary is inclusive at exactly CATCH_RADIUS', () => {
  it('is caught when the distance is exactly CATCH_RADIUS', () => {
    const predator = makeEntity({ x: 0, y: 0 });
    const prey = makeEntity({ x: CATCH_RADIUS, y: 0 });
    expect(isCaught(predator, prey)).toBe(true);
  });

  it('is caught when the two entities share the exact same point', () => {
    const predator = makeEntity({ x: 12, y: 8 });
    const prey = makeEntity({ x: 12, y: 8 });
    expect(isCaught(predator, prey)).toBe(true);
  });

  it('is not caught just past CATCH_RADIUS', () => {
    const predator = makeEntity({ x: 0, y: 0 });
    const prey = makeEntity({ x: CATCH_RADIUS + 0.01, y: 0 });
    expect(isCaught(predator, prey)).toBe(false);
  });

  it('CATCH_RADIUS_SQ is exactly CATCH_RADIUS squared', () => {
    expect(CATCH_RADIUS_SQ).toBe(CATCH_RADIUS * CATCH_RADIUS);
  });
});

describe('setTarget', () => {
  it('sets the target to the given point when inside the arena', () => {
    const state = getInitialSimulationState();
    setTarget(state, 33, 66);
    expect(state.target).toEqual({ x: 33, y: 66 });
  });

  it('clamps an out-of-bounds target into the arena', () => {
    const state = getInitialSimulationState();
    setTarget(state, -20, ARENA_SIZE + 20);
    expect(state.target).toEqual({ x: 0, y: ARENA_SIZE });
  });
});

describe('pointerToArenaPoint', () => {
  const rect = { left: 10, top: 20, width: 200, height: 200 };

  it('maps the rect center to the arena center', () => {
    const point = pointerToArenaPoint(110, 120, rect);
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('maps the rect top-left corner to arena (0, 0)', () => {
    const point = pointerToArenaPoint(10, 20, rect);
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('maps the rect bottom-right corner to arena (ARENA_SIZE, ARENA_SIZE)', () => {
    const point = pointerToArenaPoint(210, 220, rect);
    expect(point).toEqual({ x: ARENA_SIZE, y: ARENA_SIZE });
  });

  it('clamps pointer coordinates outside the rect into the arena', () => {
    const point = pointerToArenaPoint(-90, 320, rect);
    expect(point).toEqual({ x: 0, y: ARENA_SIZE });
  });
});

describe('stepSimulation — non-catch step', () => {
  it('advances elapsedMs by exactly the (clamped) delta and leaves counters untouched', () => {
    const state = getInitialSimulationState();
    // Prey and predator start far enough apart (see "never starts already caught"),
    // so one small step should not trigger a catch.
    const before = { catches: state.catches, best: state.bestSurvivalMs, last: state.lastSurvivalMs };
    stepSimulation(state, FRAME_MS);

    expect(state.elapsedMs).toBe(FRAME_MS);
    expect(state.catches).toBe(before.catches);
    expect(state.bestSurvivalMs).toBe(before.best);
    expect(state.lastSurvivalMs).toBe(before.last);
  });

  it('clamps an oversized delta (e.g. a backgrounded tab) to MAX_FRAME_DELTA_MS worth of elapsed time', () => {
    const state = getInitialSimulationState();
    stepSimulation(state, 10_000);

    // MAX_FRAME_DELTA_MS is imported indirectly via the clamp behavior: elapsedMs
    // must not reflect the full 10s jump.
    expect(state.elapsedMs).toBeLessThan(1000);
  });

  it('moves the prey toward its target and the predator toward the prey', () => {
    const state = getInitialSimulationState();
    const preyBefore = { ...state.prey };
    const predatorBefore = { ...state.predator };

    stepSimulation(state, FRAME_MS);

    expect(state.prey).not.toEqual(preyBefore);
    expect(state.predator).not.toEqual(predatorBefore);
  });
});

describe('stepSimulation — catch handling', () => {
  function makeCaughtState(overrides: Partial<SimulationState> = {}): SimulationState {
    // Predator, prey, and target all share one point with zero velocity: applySeek's
    // distance-under-threshold branch yields zero desired velocity, so a step leaves
    // positions unchanged and the entities remain caught after the move.
    return {
      predator: makeEntity({ x: 50, y: 50 }),
      prey: makeEntity({ x: 50, y: 50 }),
      target: { x: 50, y: 50 },
      elapsedMs: 500,
      catches: 0,
      bestSurvivalMs: 200,
      lastSurvivalMs: 0,
      ...overrides,
    };
  }

  it('banks lastSurvivalMs and bestSurvivalMs, increments catches, and resets elapsedMs to 0', () => {
    const state = makeCaughtState();
    stepSimulation(state, FRAME_MS);

    const expectedElapsed = 500 + FRAME_MS;
    expect(state.catches).toBe(1);
    expect(state.lastSurvivalMs).toBe(expectedElapsed);
    expect(state.bestSurvivalMs).toBe(expectedElapsed);
    expect(state.elapsedMs).toBe(0);
  });

  it('keeps the prior bestSurvivalMs when this life was shorter than the record', () => {
    const state = makeCaughtState({ elapsedMs: 1, bestSurvivalMs: 999_999 });
    stepSimulation(state, FRAME_MS);

    expect(state.bestSurvivalMs).toBe(999_999);
    expect(state.lastSurvivalMs).toBe(1 + FRAME_MS);
  });

  it('resets both entities to the deterministic initial layout, at rest', () => {
    const state = makeCaughtState();
    stepSimulation(state, FRAME_MS);

    const { predator, prey } = createInitialEntities(INITIAL_SIM_SEED);
    expect(state.predator).toEqual(predator);
    expect(state.prey).toEqual(prey);
  });

  it('increments catches by exactly one per catch across repeated catches', () => {
    let state = makeCaughtState();
    state = stepSimulation(state, FRAME_MS);
    expect(state.catches).toBe(1);

    // Force another immediate catch: reset positions collided again with the target.
    state.target = { x: state.prey.x, y: state.prey.y };
    state.predator.x = state.prey.x;
    state.predator.y = state.prey.y;
    state.predator.vx = 0;
    state.predator.vy = 0;
    state.prey.vx = 0;
    state.prey.vy = 0;

    state = stepSimulation(state, FRAME_MS);
    expect(state.catches).toBe(2);
  });
});

describe('isAnimationEnabled', () => {
  it('is enabled on full and balanced tiers', () => {
    expect(isAnimationEnabled('full')).toBe(true);
    expect(isAnimationEnabled('balanced')).toBe(true);
  });

  it('is disabled on lite and reduced tiers', () => {
    expect(isAnimationEnabled('lite')).toBe(false);
    expect(isAnimationEnabled('reduced')).toBe(false);
  });
});

describe('formatSurvivalSeconds', () => {
  it('formats zero as exactly "0.0"', () => {
    expect(formatSurvivalSeconds(0)).toBe('0.0');
  });

  it('formats an exact one-decimal value', () => {
    expect(formatSurvivalSeconds(1234)).toBe('1.2');
  });

  it('rounds up to the next whole second at the .5 boundary', () => {
    expect(formatSurvivalSeconds(999)).toBe('1.0');
  });

  it('formats a larger value with exactly one decimal place', () => {
    expect(formatSurvivalSeconds(62_400)).toBe('62.4');
  });
});

describe('getCatchAnnouncement', () => {
  it('pins the exact singular-catch message', () => {
    expect(getCatchAnnouncement(1, '12.3', '12.3')).toBe('Caught! Survived 12.3s. Total catch: 1. Best: 12.3s.');
  });

  it('pins the exact plural-catches message', () => {
    expect(getCatchAnnouncement(3, '4.5', '20.0')).toBe('Caught! Survived 4.5s. Total catches: 3. Best: 20.0s.');
  });
});

describe('getArrowKeyDelta — keyboard-only steering (WCAG 2.1.1)', () => {
  it('returns the exact named-step delta for each arrow key', () => {
    expect(getArrowKeyDelta('ArrowUp')).toEqual({ x: 0, y: -KEYBOARD_NUDGE_STEP });
    expect(getArrowKeyDelta('ArrowDown')).toEqual({ x: 0, y: KEYBOARD_NUDGE_STEP });
    expect(getArrowKeyDelta('ArrowLeft')).toEqual({ x: -KEYBOARD_NUDGE_STEP, y: 0 });
    expect(getArrowKeyDelta('ArrowRight')).toEqual({ x: KEYBOARD_NUDGE_STEP, y: 0 });
  });

  it('returns null for any non-arrow key, including similarly-named keys', () => {
    expect(getArrowKeyDelta('Enter')).toBeNull();
    expect(getArrowKeyDelta('a')).toBeNull();
    expect(getArrowKeyDelta('Up')).toBeNull();
    expect(getArrowKeyDelta('')).toBeNull();
  });
});

describe('nudgeTarget', () => {
  it('moves the target by the exact arrow-key delta from its current position', () => {
    const state = getInitialSimulationState();
    setTarget(state, 50, 50);

    const handled = nudgeTarget(state, 'ArrowRight');

    expect(handled).toBe(true);
    expect(state.target.x).toBe(50 + KEYBOARD_NUDGE_STEP);
    expect(state.target.y).toBe(50);
  });

  it('moves the target along the y axis for ArrowDown (the x-only ArrowRight case above cannot catch a y-sign flip)', () => {
    const state = getInitialSimulationState();
    setTarget(state, 50, 50);

    nudgeTarget(state, 'ArrowDown');

    expect(state.target.x).toBe(50);
    expect(state.target.y).toBe(50 + KEYBOARD_NUDGE_STEP);
  });

  it('clamps the nudged target to the arena bounds', () => {
    const state = getInitialSimulationState();
    setTarget(state, ARENA_SIZE, ARENA_SIZE);

    nudgeTarget(state, 'ArrowRight');

    expect(state.target.x).toBe(ARENA_SIZE);
  });

  it('returns false and leaves the target untouched for a non-arrow key', () => {
    const state = getInitialSimulationState();
    setTarget(state, 33, 44);

    const handled = nudgeTarget(state, 'Tab');

    expect(handled).toBe(false);
    expect(state.target).toEqual({ x: 33, y: 44 });
  });
});

describe('PAUSED_CAPTION / SIMULATION_ARIA_LABEL — exact text', () => {
  it('has the exact non-empty paused caption, asserted against a hardcoded literal (not the same imported constant)', () => {
    // PredatorPreyChase.test.tsx compares rendered text against this SAME
    // imported constant, which can't catch the constant itself being emptied
    // (both sides of that comparison would mutate together). Hardcoding the
    // literal here is what actually pins the content.
    expect(PAUSED_CAPTION).toBe('Chase paused — reduced motion or low-power mode is active.');
  });

  it('has the exact non-empty simulation aria-label, asserted against a hardcoded literal', () => {
    expect(SIMULATION_ARIA_LABEL).toBe(
      'Predator-prey chase simulation. Move your cursor, drag on touch, or use the arrow keys once focused, to guide the prey away from the pursuing predator.',
    );
  });
});
