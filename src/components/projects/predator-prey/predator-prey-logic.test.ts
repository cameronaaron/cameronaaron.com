import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';
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
  applyArenaBoundary,
  applyDifferentialDrive,
  applySearchSweep,
  canSenseTarget,
  wrapAngleRad,
  IR_SENSOR_RANGE,
  IR_SENSOR_RANGE_SQ,
  IR_SENSOR_HALF_ANGLE_RAD,
  IR_SEARCH_SWEEP_RATE_RAD,
  IR_SEARCH_ARRIVAL_RADIUS,
  IR_SEARCH_ARRIVAL_RADIUS_SQ,
  buildIrConePath,
  getIrConeOpacity,
  IR_CONE_FILL_CONTACT,
  IR_CONE_FILL_IDLE,
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
  return { x: 0, y: 0, vx: 0, vy: 0, heading: 0, ...overrides };
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
    expect(state.predatorHasContact).toBe(false);
  });

  it('opens each robot facing the other exactly, via atan2(dy, dx)', () => {
    // Exact-value pin: a sign-flip mutant on either atan2 argument (e.g.
    // dy+predator.y instead of dy-predator.y) would point the initial heading
    // somewhere else entirely — a loose "not NaN" check wouldn't catch it.
    const { predator, prey } = createInitialEntities(INITIAL_SIM_SEED);
    expect(predator.heading).toBeCloseTo(Math.atan2(prey.y - predator.y, prey.x - predator.x), 12);
    expect(prey.heading).toBeCloseTo(Math.atan2(predator.y - prey.y, predator.x - prey.x), 12);
  });

  it('resets predatorHasContact to false on a fresh life after a catch', () => {
    const state = getInitialSimulationState();
    state.predatorHasContact = true;
    state.predator.x = state.prey.x;
    state.predator.y = state.prey.y;
    stepSimulation(state, FRAME_MS);
    expect(state.catches).toBe(1);
    expect(state.predatorHasContact).toBe(false);
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

describe('wrapAngleRad', () => {
  it('maps exactly +pi to -pi — the half-open end of the range', () => {
    // Documented, deterministic choice at the 180-degree singularity, where
    // turning either way is equally valid.
    expect(wrapAngleRad(Math.PI)).toBeCloseTo(-Math.PI, 12);
  });

  it('leaves an angle already inside the principal range untouched', () => {
    expect(wrapAngleRad(0)).toBe(0);
    expect(wrapAngleRad(1)).toBeCloseTo(1, 12);
    expect(wrapAngleRad(-1)).toBeCloseTo(-1, 12);
  });

  it('wraps past +pi round to the negative side', () => {
    expect(wrapAngleRad(Math.PI + 0.5)).toBeCloseTo(-Math.PI + 0.5, 12);
  });

  it('wraps past -pi round to the positive side', () => {
    expect(wrapAngleRad(-Math.PI - 0.5)).toBeCloseTo(Math.PI - 0.5, 12);
  });

  it('collapses whole turns to the same angle', () => {
    expect(wrapAngleRad(2 * Math.PI)).toBeCloseTo(0, 12);
    expect(wrapAngleRad(4 * Math.PI + 0.3)).toBeCloseTo(0.3, 12);
  });

  it('always returns a value within (-pi, pi]', () => {
    for (let a = -20; a <= 20; a += 0.37) {
      const wrapped = wrapAngleRad(a);
      expect(wrapped).toBeGreaterThan(-Math.PI - 1e-9);
      expect(wrapped).toBeLessThanOrEqual(Math.PI + 1e-9);
    }
  });
});

describe('canSenseTarget — the IR cone the real robots were limited by', () => {
  it('sees a target dead ahead and inside range', () => {
    const sensor = makeEntity({ x: 50, y: 50, heading: 0 });
    expect(canSenseTarget(sensor, 50 + IR_SENSOR_RANGE / 2, 50)).toBe(true);
  });

  it('is blind to a target beyond IR range even when perfectly aligned', () => {
    const sensor = makeEntity({ x: 0, y: 0, heading: 0 });
    expect(canSenseTarget(sensor, IR_SENSOR_RANGE + 0.01, 0)).toBe(false);
  });

  it('treats exactly IR_SENSOR_RANGE as still in range (inclusive)', () => {
    const sensor = makeEntity({ x: 0, y: 0, heading: 0 });
    expect(canSenseTarget(sensor, IR_SENSOR_RANGE, 0)).toBe(true);
  });

  it('is blind to a target behind it — the whole point of a directional sensor', () => {
    const sensor = makeEntity({ x: 50, y: 50, heading: 0 });
    expect(canSenseTarget(sensor, 40, 50)).toBe(false);
  });

  it('treats exactly the cone half-angle as visible (inclusive edge)', () => {
    const sensor = makeEntity({ x: 0, y: 0, heading: 0 });
    const r = IR_SENSOR_RANGE / 2;
    const onEdgeX = Math.cos(IR_SENSOR_HALF_ANGLE_RAD) * r;
    const onEdgeY = Math.sin(IR_SENSOR_HALF_ANGLE_RAD) * r;
    expect(canSenseTarget(sensor, onEdgeX, onEdgeY)).toBe(true);
  });

  it('computes distance as the SUM of squares, not the difference', () => {
    // Distinguishes dx²+dy² from dx²-dy². At bearing===45° (the cone's own
    // edge, already known from the test above to pass the angle check on its
    // own), pick dx=dy=IR_SENSOR_RANGE: the real distance is
    // RANGE*sqrt(2), well beyond sensor range, so the SUM formula correctly
    // rejects it (2*RANGE² > RANGE²). The DIFFERENCE formula instead computes
    // RANGE²-RANGE²=0, which is trivially <= RANGE_SQ — a mutant would let a
    // target nearly 1.4x sensor range through because the terms cancelled.
    const sensor = makeEntity({ x: 0, y: 0, heading: 0 });
    expect(canSenseTarget(sensor, IR_SENSOR_RANGE, IR_SENSOR_RANGE)).toBe(false);
  });

  it('is blind just outside the cone half-angle', () => {
    const sensor = makeEntity({ x: 0, y: 0, heading: 0 });
    const r = IR_SENSOR_RANGE / 2;
    const angle = IR_SENSOR_HALF_ANGLE_RAD + 0.02;
    expect(canSenseTarget(sensor, Math.cos(angle) * r, Math.sin(angle) * r)).toBe(false);
  });

  it('is symmetric about the heading — both cone edges behave the same', () => {
    const sensor = makeEntity({ x: 0, y: 0, heading: 0 });
    const r = IR_SENSOR_RANGE / 2;
    const angle = IR_SENSOR_HALF_ANGLE_RAD - 0.02;
    expect(canSenseTarget(sensor, Math.cos(angle) * r, Math.sin(angle) * r)).toBe(true);
    expect(canSenseTarget(sensor, Math.cos(-angle) * r, Math.sin(-angle) * r)).toBe(true);
  });

  it('follows the sensor heading rather than a fixed world direction', () => {
    const facingUp = makeEntity({ x: 50, y: 50, heading: -Math.PI / 2 });
    expect(canSenseTarget(facingUp, 50, 30)).toBe(true);
    expect(canSenseTarget(facingUp, 50, 70)).toBe(false);
  });

  it('pins the squared range to the exact square of the range', () => {
    expect(IR_SENSOR_RANGE_SQ).toBe(IR_SENSOR_RANGE * IR_SENSOR_RANGE);
  });
});

describe('applyDifferentialDrive — nonholonomic MIP kinematics', () => {
  it('drives straight ahead at full speed when already facing the target', () => {
    const entity = makeEntity({ x: 0, y: 0, heading: 0 });
    applyDifferentialDrive(entity, 50, 0, 2, 0.5, 1);

    expect(entity.heading).toBeCloseTo(0, 12);
    expect(entity.x).toBeCloseTo(2, 12);
    expect(entity.y).toBeCloseTo(0, 12);
  });

  it('never translates sideways — the constraint a point mass violated', () => {
    // Target is exactly 90 degrees off the heading: a holonomic seek would
    // slide straight toward it. A differential-drive robot must turn first,
    // and makes zero forward progress while perpendicular.
    const entity = makeEntity({ x: 0, y: 0, heading: 0 });
    applyDifferentialDrive(entity, 0, 50, 2, 0.1, 1);

    expect(entity.heading).toBeCloseTo(0.1, 12);
    // Position moved only along the NEW heading, which is still nearly +x —
    // it did not jump toward +y the way a strafing point mass would.
    expect(entity.y).toBeLessThan(0.3);
    expect(entity.x).toBeGreaterThan(0);
  });

  it('clamps the turn to maxTurnRate * step', () => {
    // Target at 135 degrees: well past the turn limit, and deliberately NOT
    // at exactly 180, where either turn direction is equally valid.
    const entity = makeEntity({ x: 0, y: 0, heading: 0 });
    applyDifferentialDrive(entity, -50, 50, 1, 0.2, 1);
    expect(entity.heading).toBeCloseTo(0.2, 12);
  });

  it('scales the turn limit with the step', () => {
    const entity = makeEntity({ x: 0, y: 0, heading: 0 });
    applyDifferentialDrive(entity, -50, 50, 1, 0.2, 2);
    expect(entity.heading).toBeCloseTo(0.4, 12);
  });

  it('turns the short way round rather than the long way', () => {
    // Target is slightly clockwise; the robot must turn negative, not +2pi.
    const entity = makeEntity({ x: 0, y: 0, heading: 0.1 });
    applyDifferentialDrive(entity, 50, 0, 1, 0.5, 1);
    expect(entity.heading).toBeCloseTo(0, 12);
  });

  it('does not overshoot when the remaining turn is under the limit', () => {
    const entity = makeEntity({ x: 0, y: 0, heading: 0.05 });
    applyDifferentialDrive(entity, 50, 0, 1, 0.5, 1);
    expect(entity.heading).toBeCloseTo(0, 12);
  });

  it('skips the turn entirely once distance-to-target is at the epsilon threshold', () => {
    // Regression pin for the `dx*dx + dy*dy > 1e-8` guard: at EXACTLY 1e-8
    // (dx=1e-4, dy=0), the guard must treat the entity as "already there" and
    // leave heading untouched. A '>=' mutant would enter the turning branch
    // instead — heading would visibly move even though distance is at the
    // guard's own boundary.
    const entity = makeEntity({ x: 0, y: 0, heading: 1.2 });
    applyDifferentialDrive(entity, 1e-4, 0, 1, 0.5, 1);
    expect(entity.heading).toBe(1.2);
  });

  it('clamps to the NEGATIVE limit (not a sign-flipped positive one) when overshooting the other way', () => {
    // Regression pin for a real gap: the negative-clamp branch's constant is
    // `-maxTurn`. A sign-flip mutant there (`+maxTurn`) would send the robot
    // turning the WRONG WAY entirely on a large clockwise correction. Needs
    // `error` to be strictly beyond -maxTurn (not merely equal to it — at
    // exactly -maxTurn the boundary operator choice doesn't change the
    // returned value, see the hand-verified equivalence in source).
    const entity = makeEntity({ x: 0, y: 0, heading: 1.0 });
    applyDifferentialDrive(entity, Math.cos(0), Math.sin(0), 1, 0.2, 1);
    // bearing=0, heading=1.0, error=-1.0, well beyond -maxTurn=-0.2.
    expect(entity.heading).toBeCloseTo(1.0 - 0.2, 12);
  });

  it('refuses to reverse toward a target directly behind it', () => {
    // Facing +x with the target at -x and no ability to turn: forward speed
    // must clamp to zero rather than going negative.
    const entity = makeEntity({ x: 10, y: 0, heading: 0 });
    applyDifferentialDrive(entity, 0, 0, 2, 0, 1);

    expect(entity.vx).toBe(0);
    expect(entity.vy).toBe(0);
    expect(entity.x).toBe(10);
  });

  it('scales forward speed by the cosine of the heading error', () => {
    const entity = makeEntity({ x: 0, y: 0, heading: 0 });
    // 60 degrees off, no turning allowed -> cos(60 deg) = 0.5 of max speed.
    const angle = Math.PI / 3;
    applyDifferentialDrive(entity, Math.cos(angle) * 100, Math.sin(angle) * 100, 2, 0, 1);

    expect(entity.vx).toBeCloseTo(2 * 0.5, 10);
    expect(entity.vy).toBeCloseTo(0, 10);
  });

  it('leaves heading untouched when already sitting on the target', () => {
    const entity = makeEntity({ x: 25, y: 25, heading: 1.2 });
    applyDifferentialDrive(entity, 25, 25, 2, 0.5, 1);
    expect(entity.heading).toBe(1.2);
  });

  it('mutates in place and allocates nothing', () => {
    const entity = makeEntity({ x: 0, y: 0, heading: 0 });
    const before = entity;
    applyDifferentialDrive(entity, 10, 10, 1, 0.2, 1);
    expect(entity).toBe(before);
  });
});

describe('applySearchSweep — the blind predator scan', () => {
  it('rotates in place at the sweep rate without moving', () => {
    const entity = makeEntity({ x: 30, y: 40, heading: 0, vx: 5, vy: 5 });
    applySearchSweep(entity, 1);

    expect(entity.heading).toBeCloseTo(IR_SEARCH_SWEEP_RATE_RAD, 12);
    expect(entity.x).toBe(30);
    expect(entity.y).toBe(40);
    expect(entity.vx).toBe(0);
    expect(entity.vy).toBe(0);
  });

  it('scales the sweep with the step', () => {
    const entity = makeEntity({ heading: 0 });
    applySearchSweep(entity, 3);
    expect(entity.heading).toBeCloseTo(IR_SEARCH_SWEEP_RATE_RAD * 3, 12);
  });

  it('keeps the swept heading wrapped into the principal range', () => {
    const entity = makeEntity({ heading: Math.PI - 0.01 });
    applySearchSweep(entity, 10);
    expect(entity.heading).toBeGreaterThan(-Math.PI - 1e-9);
    expect(entity.heading).toBeLessThanOrEqual(Math.PI + 1e-9);
  });
});

describe('predator IR behaviour inside stepSimulation', () => {
  it('reports contact and refreshes its fix when the prey is in the cone', () => {
    const state = getInitialSimulationState();
    state.predator.x = 50;
    state.predator.y = 50;
    state.predator.heading = 0;
    state.prey.x = 60;
    state.prey.y = 50;
    state.lastKnownPreyX = 0;
    state.lastKnownPreyY = 0;

    stepSimulation(state, FRAME_MS);

    // The prey is stepped before the predator senses, so the recorded fix must
    // match where the prey actually ended up — not where it started.
    expect(state.predatorHasContact).toBe(true);
    expect(state.lastKnownPreyX).toBe(state.prey.x);
    expect(state.lastKnownPreyY).toBe(state.prey.y);
    expect(state.lastKnownPreyX).toBeCloseTo(60, 0);
  });

  it('loses contact and keeps the STALE fix when the prey slips behind it', () => {
    const state = getInitialSimulationState();
    state.predator.x = 50;
    state.predator.y = 50;
    state.predator.heading = 0;
    // Directly behind the predator, well outside the forward cone.
    state.prey.x = 20;
    state.prey.y = 50;
    state.lastKnownPreyX = 70;
    state.lastKnownPreyY = 50;

    stepSimulation(state, FRAME_MS);

    expect(state.predatorHasContact).toBe(false);
    expect(state.lastKnownPreyX).toBe(70);
    expect(state.lastKnownPreyY).toBe(50);
  });

  it('loses contact when the prey is in front but out of IR range', () => {
    const state = getInitialSimulationState();
    state.predator.x = 5;
    state.predator.y = 50;
    state.predator.heading = 0;
    state.prey.x = 5 + IR_SENSOR_RANGE + 5;
    state.prey.y = 50;

    stepSimulation(state, FRAME_MS);

    expect(state.predatorHasContact).toBe(false);
  });

  it('sweeps in place once it reaches a stale fix and still sees nothing', () => {
    const state = getInitialSimulationState();
    state.predator.x = 50;
    state.predator.y = 50;
    state.predator.heading = 0;
    // Prey hidden behind the predator; the stale fix is where it already is.
    state.prey.x = 10;
    state.prey.y = 50;
    state.lastKnownPreyX = 50;
    state.lastKnownPreyY = 50;

    const headingBefore = state.predator.heading;
    stepSimulation(state, FRAME_MS);

    expect(state.predatorHasContact).toBe(false);
    expect(state.predator.heading).not.toBe(headingBefore);
    expect(state.predator.x).toBe(50);
    expect(state.predator.y).toBe(50);
  });

  it('sweeps rather than drives at exactly the arrival radius (inclusive boundary)', () => {
    // Regression pin: a '<' mutant on the arrival-radius check would make the
    // predator DRIVE toward its stale fix instead of sweeping at exactly
    // IR_SEARCH_ARRIVAL_RADIUS. Position alone can't tell them apart here
    // (facing directly away from the target gives the drive branch zero
    // speed too — see the alignment<=0 equivalence in source) — but the two
    // branches turn the heading at DIFFERENT rates (sweep: 0.05 rad/step,
    // drive: clamped to up to 0.09 rad/step), so asserting the exact new
    // heading distinguishes them.
    const state = getInitialSimulationState();
    state.predator.x = 50;
    state.predator.y = 50;
    state.predator.heading = Math.PI; // facing away, so it stays blind
    state.prey.x = 5;
    state.prey.y = 50;
    state.lastKnownPreyX = 50 + IR_SEARCH_ARRIVAL_RADIUS;
    state.lastKnownPreyY = 50;

    stepSimulation(state, FRAME_MS);

    expect(state.predatorHasContact).toBe(false);
    expect(state.predator.x).toBe(50);
    expect(state.predator.y).toBe(50);
    expect(state.predator.heading).toBeCloseTo(wrapAngleRad(Math.PI + IR_SEARCH_SWEEP_RATE_RAD), 10);
  });

  it('pins the squared arrival radius to the exact square of the radius', () => {
    expect(IR_SEARCH_ARRIVAL_RADIUS_SQ).toBe(IR_SEARCH_ARRIVAL_RADIUS * IR_SEARCH_ARRIVAL_RADIUS);
  });
});


describe('applyArenaBoundary — exact bounce values', () => {
  it('leaves an entity exactly at the boundary untouched (strict > / < only)', () => {
    const atMax = makeEntity({ x: ARENA_SIZE, y: ARENA_SIZE, vx: 3, vy: 3 });
    applyArenaBoundary(atMax);
    expect(atMax).toEqual({ x: ARENA_SIZE, y: ARENA_SIZE, vx: 3, vy: 3, heading: 0 });

    const atZero = makeEntity({ x: 0, y: 0, vx: -3, vy: -3 });
    applyArenaBoundary(atZero);
    expect(atZero).toEqual({ x: 0, y: 0, vx: -3, vy: -3, heading: 0 });
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
    // Predator, prey, and target all share one point: the drive model's
    // distance-under-epsilon branch leaves heading alone and produces zero
    // forward speed, so a step leaves positions unchanged and the two remain
    // caught after the move.
    return {
      predator: makeEntity({ x: 50, y: 50 }),
      prey: makeEntity({ x: 50, y: 50 }),
      target: { x: 50, y: 50 },
      predatorHasContact: true,
      lastKnownPreyX: 50,
      lastKnownPreyY: 50,
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

describe('buildIrConePath — making the sensor visible', () => {
  it('starts the wedge at the robot and closes it', () => {
    const entity = makeEntity({ x: 50, y: 50, heading: 0 });
    const path = buildIrConePath(entity);

    expect(path.startsWith('M 50.00 50.00 ')).toBe(true);
    expect(path.endsWith(' Z')).toBe(true);
  });

  it('spans exactly the cone half-angle either side of the heading', () => {
    const entity = makeEntity({ x: 0, y: 0, heading: 0 });
    const path = buildIrConePath(entity);

    // Both arc endpoints sit at IR_SENSOR_RANGE from the origin, at ±45°.
    const expected = (IR_SENSOR_RANGE * Math.SQRT1_2).toFixed(2);
    expect(path).toContain(`L ${expected} ${(-Number(expected)).toFixed(2)}`);
    expect(path).toContain(`${expected} ${expected} Z`);
  });

  it('uses the sensor range as the arc radius', () => {
    const path = buildIrConePath(makeEntity({ x: 10, y: 10, heading: 1 }));
    expect(path).toContain(`A ${IR_SENSOR_RANGE} ${IR_SENSOR_RANGE} 0 0 1 `);
  });

  it('computes the second arc point with the correct sign at an asymmetric heading', () => {
    // At heading=0 the two arc endpoints are at +/-45 degrees, whose cosines
    // are EQUAL — a sign-flip mutant on x2's cosine term produces the same
    // value the existing "spans exactly the cone half-angle" test checks,
    // so it can't distinguish + from -. At heading=90 degrees the end angle
    // is 135 degrees, whose cosine is NEGATIVE, so a sign flip produces a
    // clearly different (and wrong) x2.
    const entity = makeEntity({ x: 10, y: 20, heading: Math.PI / 2 });
    const path = buildIrConePath(entity);
    const end = entity.heading + IR_SENSOR_HALF_ANGLE_RAD;
    const expectedX2 = (entity.x + Math.cos(end) * IR_SENSOR_RANGE).toFixed(2);
    const expectedY2 = (entity.y + Math.sin(end) * IR_SENSOR_RANGE).toFixed(2);
    expect(path).toContain(`${expectedX2} ${expectedY2} Z`);
  });

  it('rotates with the heading', () => {
    const facingRight = buildIrConePath(makeEntity({ x: 50, y: 50, heading: 0 }));
    const facingDown = buildIrConePath(makeEntity({ x: 50, y: 50, heading: Math.PI / 2 }));
    expect(facingDown).not.toBe(facingRight);
  });

  it('tracks the robot position', () => {
    const atOrigin = buildIrConePath(makeEntity({ x: 0, y: 0, heading: 0 }));
    const moved = buildIrConePath(makeEntity({ x: 20, y: 0, heading: 0 }));
    expect(moved).not.toBe(atOrigin);
    expect(moved.startsWith('M 20.00 0.00 ')).toBe(true);
  });
});

describe('getIrConeOpacity', () => {
  it('brightens the cone the moment the predator has contact', () => {
    expect(getIrConeOpacity(true)).toBe(IR_CONE_FILL_CONTACT);
    expect(getIrConeOpacity(false)).toBe(IR_CONE_FILL_IDLE);
  });

  it('pins both opacities to exact values, contact strictly brighter', () => {
    expect(IR_CONE_FILL_CONTACT).toBe(0.16);
    expect(IR_CONE_FILL_IDLE).toBe(0.05);
    expect(getIrConeOpacity(true)).toBeGreaterThan(getIrConeOpacity(false));
  });
});
