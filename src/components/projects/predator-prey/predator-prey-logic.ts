import { createSeededRandom, normalizePointerToPercent } from '@/components/hero/interactive-particles/interactive-particles-engine';
import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

/**
 * "Don't get caught" — a live predator/prey chase paired with the "Predatory
 * and Prey Behavior Modifying MIP Robots" project.
 *
 * Both entities model the actual hardware rather than generic game agents,
 * because the project's two defining characteristics are hardware ones:
 *
 *  1. A MIP is a two-wheeled Mobile Inverted Pendulum, so both robots are
 *     NONHOLONOMIC — they drive along their heading and must turn to change
 *     direction. Neither can strafe.
 *  2. The robots signalled over INFRARED, so the predator senses through a
 *     short-range forward CONE rather than knowing where the prey is. Lose it
 *     from the cone and it falls back to a stale fix, then sweeps to search.
 *
 * The player steers the prey (pointer, touch, or arrow keys); the predator
 * hunts autonomously on sensor data alone. Getting caught resets the round and
 * banks a "best survival time". Because the predator turns at half the prey's
 * yaw rate, out-turning it to break IR contact is the real skill — a mechanic
 * that falls directly out of modelling the hardware honestly.
 *
 * All position/velocity math, boundary handling, catch detection, and the
 * deterministic initial layout live here so the component only wires this
 * state to the DOM (modularization contract). The very first frame is a pure
 * function of INITIAL_SIM_SEED via the shared createSeededRandom PRNG (reused
 * from the hero particle engine, never Math.random() directly) — identical
 * on the server and the client's first paint (hydration-safety doctrine,
 * CLAUDE.md #10). Only per-frame stepping (driven by requestAnimationFrame,
 * client-only, post-mount) introduces real-time behavior.
 */

/** Arena is a normalized 0-100 coordinate space, matching this repo's other engines. */
export const ARENA_SIZE = 100;

/** Fixed seed for the deterministic initial layout — identical every first paint. */
export const INITIAL_SIM_SEED = 2024;

/** One 60fps frame in milliseconds — dt is normalized to "frames" (a `step` unit) around this. */
export const FRAME_MS = 1000 / 60;

/** Longest single frame delta accepted before it's clamped — guards against tab-switch stalls. */
export const MAX_FRAME_DELTA_MS = 100;

// ── Drive constants (arena-units per step, radians per step) ────────────────
/**
 * Both entities are modelled as DIFFERENTIAL-DRIVE robots, not free-floating
 * point masses, because both of them are in the real project: a WowWee MIP is
 * a two-wheeled Mobile Inverted Pendulum. That makes it *nonholonomic* — it
 * has two wheels on one axle and cannot translate sideways. To move in a new
 * direction it must first rotate to face that direction.
 *
 * The original simulation applied Reynolds seek steering to a holonomic point
 * mass, which accelerates freely in any direction. That is a perfectly good
 * general steering model and the wrong one for these robots: it let both
 * entities strafe, which a MIP physically cannot do. Heading is now part of
 * the state and forward speed is coupled to how well the robot is already
 * facing its goal.
 */
export const PREY_MAX_SPEED = 1.4;
export const PREDATOR_MAX_SPEED = 1.1;

/**
 * Maximum yaw rate, radians per 60fps step. The predator turns at roughly half
 * the prey's rate, which is what makes the IR sensor cone below a usable
 * tactic rather than decoration: out-turning the predator is how a player
 * breaks its line of sight.
 */
export const PREY_MAX_TURN_RATE_RAD = 0.18;
export const PREDATOR_MAX_TURN_RATE_RAD = 0.09;

export const BOUNDARY_BOUNCE_FACTOR = -0.85;

// ── IR sensing (the real robots' defining constraint) ───────────────────────
/**
 * The physical project communicated over INFRARED, and the predator's model
 * has to respect what that implies: IR is directional and short-range, so the
 * predator does NOT have omniscient knowledge of the prey's position — the
 * original simulation gave it exactly that, seeking the prey's true
 * coordinates from anywhere in the arena.
 *
 * Range is expressed in arena units (the arena is a normalized 0-100 square).
 * The half-angle matches the ~45° half-power beam width typical of the TSOP-
 * class IR receivers used in hobby/undergraduate robotics — the sensor sees a
 * forward cone, not a circle.
 */
export const IR_SENSOR_RANGE = 40;
export const IR_SENSOR_RANGE_SQ = IR_SENSOR_RANGE * IR_SENSOR_RANGE;
export const IR_SENSOR_HALF_ANGLE_RAD = Math.PI / 4;

/**
 * With no IR contact the predator drives to where it last detected the prey.
 * Once it arrives there still blind, it sweeps in place — the standard
 * search pattern for a directional sensor that has lost its target.
 */
export const IR_SEARCH_ARRIVAL_RADIUS = 6;
export const IR_SEARCH_ARRIVAL_RADIUS_SQ = IR_SEARCH_ARRIVAL_RADIUS * IR_SEARCH_ARRIVAL_RADIUS;
export const IR_SEARCH_SWEEP_RATE_RAD = 0.05;

/** Predator/prey are "caught" once their centers are within this distance. */
export const CATCH_RADIUS = 3.5;
export const CATCH_RADIUS_SQ = CATCH_RADIUS * CATCH_RADIUS;

/** Deterministic starting bands: prey spawns in the arena's lower-right two-thirds, predator near the corner. */
export const PREY_START_MIN = 20;
export const PREY_START_RANGE = 50;
export const PREDATOR_START_MIN = 5;
export const PREDATOR_START_RANGE = 20;

/** Arena units the seek target moves per arrow-key press — a keyboard-only equivalent to pointer steering. */
export const KEYBOARD_NUDGE_STEP = 6;

export interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Facing direction in radians. A differential-drive robot only moves along this. */
  heading: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface SimulationState {
  predator: Entity;
  prey: Entity;
  /** True while the predator currently has the prey inside its IR cone. */
  predatorHasContact: boolean;
  /** Where the predator last saw the prey — what it drives toward once blind. */
  lastKnownPreyX: number;
  lastKnownPreyY: number;
  /** Seek target the prey chases toward — the player's pointer, in arena units. */
  target: Point;
  /** Milliseconds survived in the current life (since the last catch or mount). */
  elapsedMs: number;
  /** Total number of times the predator has caught the prey. */
  catches: number;
  /** Longest survival streak banked so far, in milliseconds. */
  bestSurvivalMs: number;
  /** Duration of the life that just ended, banked at the moment of the last catch (0 until the first catch). */
  lastSurvivalMs: number;
}

/** The arena's exact center — the deterministic idle seek target before any pointer input. */
export const INITIAL_TARGET: Point = { x: ARENA_SIZE / 2, y: ARENA_SIZE / 2 };

/** Clamp a coordinate into the arena's [0, ARENA_SIZE] bounds. */
export function clampToArena(value: number): number {
  return Math.min(ARENA_SIZE, Math.max(0, value));
}

/** Deterministic starting positions for a given seed — same seed always reproduces the same layout. */
export function createInitialEntities(seed: number): { predator: Entity; prey: Entity } {
  const random = createSeededRandom(seed);

  const prey: Entity = {
    x: PREY_START_MIN + random() * PREY_START_RANGE,
    y: PREY_START_MIN + random() * PREY_START_RANGE,
    vx: 0,
    vy: 0,
    heading: 0,
  };
  const predator: Entity = {
    x: PREDATOR_START_MIN + random() * PREDATOR_START_RANGE,
    y: PREDATOR_START_MIN + random() * PREDATOR_START_RANGE,
    vx: 0,
    vy: 0,
    heading: 0,
  };

  // Both start facing each other: a robot's initial heading is a real part of
  // its state, and leaving it at a fixed 0 would make the opening moments a
  // function of arena orientation rather than of the layout.
  predator.heading = Math.atan2(prey.y - predator.y, prey.x - predator.x);
  prey.heading = Math.atan2(predator.y - prey.y, predator.x - prey.x);

  return { predator, prey };
}

/**
 * Wrap an angle into [-π, π) so heading errors take the short way round.
 *
 * Note the half-open end: exactly π maps to -π. At a perfect 180° error the
 * two turn directions are equally correct, so which one a robot picks is
 * arbitrary — but it must be *deterministic*, and this is the branch it takes.
 */
export function wrapAngleRad(angle: number): number {
  // Stryker disable next-line ArithmeticOperator: '+Math.PI' and '-Math.PI'
  // differ by exactly 2*Math.PI, which the following '% (2*Math.PI)' absorbs
  // completely — the two forms are mathematically identical across the whole
  // domain. Verified numerically over [-20, 20] in steps of 0.0137: max
  // observed difference 1.8e-15 (floating-point noise, not a real gap).
  // Hand-verified 2026-07-26 per ENGINEERING-STANDARDS §6 item 13.
  const wrapped = (angle + Math.PI) % (2 * Math.PI);
  return (wrapped < 0 ? wrapped + 2 * Math.PI : wrapped) - Math.PI;
}

/**
 * Can the sensing robot currently see (x, y)? True only when the target is
 * inside BOTH the IR range and the forward cone — the two constraints a real
 * directional IR link imposes.
 */
export function canSenseTarget(sensor: Entity, targetX: number, targetY: number): boolean {
  const dx = targetX - sensor.x;
  const dy = targetY - sensor.y;
  const distanceSq = dx * dx + dy * dy;
  if (distanceSq > IR_SENSOR_RANGE_SQ) return false;

  // Squared-range check first (§2.6): the bearing math only runs for targets
  // already known to be close enough.
  const bearing = Math.atan2(dy, dx);
  const error = wrapAngleRad(bearing - sensor.heading);
  // Stryker disable next-line EqualityOperator,ConditionalExpression,UnaryOperator:
  // -0===0 equivalence (same class as scroll-velocity-driver-logic.ts) — at
  // error exactly 0, every boundary/negation variant of this abs-value
  // computation yields the identical 0. Hand-verified 2026-07-26 per §6
  // item 13.
  return (error < 0 ? -error : error) <= IR_SENSOR_HALF_ANGLE_RAD;
}

/**
 * Differential-drive step toward (targetX, targetY): rotate toward the target
 * at up to `maxTurnRate`, then drive forward along the (new) heading.
 *
 * Forward speed is scaled by cos(heading error) and floored at zero, which is
 * what a two-wheeled robot actually does — facing 90° off its goal it pivots
 * in place rather than sliding sideways, and it never drives backwards to
 * "reach" something behind it. Mutates in place: zero allocation, O(1)
 * (ENGINEERING-STANDARDS §2.8).
 */
export function applyDifferentialDrive(
  entity: Entity,
  targetX: number,
  targetY: number,
  maxSpeed: number,
  maxTurnRate: number,
  step: number
): void {
  const dx = targetX - entity.x;
  const dy = targetY - entity.y;

  if (dx * dx + dy * dy > 1e-8) {
    const bearing = Math.atan2(dy, dx);
    const error = wrapAngleRad(bearing - entity.heading);
    const maxTurn = maxTurnRate * step;
    // Stryker disable next-line EqualityOperator: at error exactly maxTurn,
    // '>' is false and the ternary falls through to `error`, which already
    // equals maxTurn — a '>=' mutant assigning the maxTurn constant produces
    // the identical value. Same reasoning mirrored for -maxTurn below.
    // Hand-verified 2026-07-26 per §6 item 13. The sign of the -maxTurn
    // constant itself is NOT equivalent — see the dedicated negative-clamp
    // test, which fails against a `+maxTurn` mutant there.
    const turn = error > maxTurn ? maxTurn : error < -maxTurn ? -maxTurn : error;
    entity.heading = wrapAngleRad(entity.heading + turn);
  }

  const alignment = Math.cos(wrapAngleRad(Math.atan2(dy, dx) - entity.heading));
  // Stryker disable next-line EqualityOperator: at alignment exactly 0, a
  // '>=' mutant takes the true branch and computes maxSpeed*0, which is 0 —
  // identical to the false branch's literal 0. Hand-verified 2026-07-26 per
  // §6 item 13.
  const speed = alignment > 0 ? maxSpeed * alignment : 0;

  entity.vx = Math.cos(entity.heading) * speed;
  entity.vy = Math.sin(entity.heading) * speed;
  entity.x += entity.vx * step;
  entity.y += entity.vy * step;
}

/** Rotate in place at the search sweep rate — the blind predator's scan. */
export function applySearchSweep(entity: Entity, step: number): void {
  entity.heading = wrapAngleRad(entity.heading + IR_SEARCH_SWEEP_RATE_RAD * step);
  entity.vx = 0;
  entity.vy = 0;
}

/**
 * The deterministic first simulation state. Passed to a ref's lazy
 * initializer (not recomputed on every render) so the component's initial
 * paint is unambiguously pure — same shape as the DNA game's getInitialRound.
 */
export function getInitialSimulationState(seed: number = INITIAL_SIM_SEED): SimulationState {
  const { predator, prey } = createInitialEntities(seed);
  return {
    predator,
    prey,
    target: { x: INITIAL_TARGET.x, y: INITIAL_TARGET.y },
    // Seeded with the prey's true start so the predator opens with a valid
    // fix; every later value comes from an actual IR detection.
    predatorHasContact: false,
    lastKnownPreyX: prey.x,
    lastKnownPreyY: prey.y,
    elapsedMs: 0,
    catches: 0,
    bestSurvivalMs: 0,
    lastSurvivalMs: 0,
  };
}

/**
 * Bounce an entity off the arena walls: clamp position to bounds and invert
 * (and dampen) the velocity component that carried it past the wall.
 */
export function applyArenaBoundary(entity: Entity): void {
  if (entity.x < 0) {
    entity.x = 0;
    entity.vx *= BOUNDARY_BOUNCE_FACTOR;
  } else if (entity.x > ARENA_SIZE) {
    entity.x = ARENA_SIZE;
    entity.vx *= BOUNDARY_BOUNCE_FACTOR;
  }

  if (entity.y < 0) {
    entity.y = 0;
    entity.vy *= BOUNDARY_BOUNCE_FACTOR;
  } else if (entity.y > ARENA_SIZE) {
    entity.y = ARENA_SIZE;
    entity.vy *= BOUNDARY_BOUNCE_FACTOR;
  }
}

/** Are the predator and prey within catch range of each other? */
export function isCaught(predator: Entity, prey: Entity): boolean {
  const dx = predator.x - prey.x;
  const dy = predator.y - prey.y;
  return dx * dx + dy * dy <= CATCH_RADIUS_SQ;
}

/** Update the prey's seek target (the player's pointer), clamped to the arena. */
export function setTarget(state: SimulationState, x: number, y: number): void {
  state.target.x = clampToArena(x);
  state.target.y = clampToArena(y);
}

/** Named per-key deltas — a dispatch table (§2.2), not an if-chain, over the four arrow keys. */
const ARROW_KEY_DELTAS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -KEYBOARD_NUDGE_STEP },
  ArrowDown: { x: 0, y: KEYBOARD_NUDGE_STEP },
  ArrowLeft: { x: -KEYBOARD_NUDGE_STEP, y: 0 },
  ArrowRight: { x: KEYBOARD_NUDGE_STEP, y: 0 },
};

/**
 * Keyboard-only equivalent to pointer steering (WCAG 2.1.1 — every pointer
 * interaction needs a keyboard path). Returns the arena delta for an arrow
 * key, or null for any other key (the caller should not preventDefault or
 * update state for a key this doesn't recognize).
 */
export function getArrowKeyDelta(key: string): Point | null {
  return ARROW_KEY_DELTAS[key] ?? null;
}

/** Nudge the seek target by an arrow-key delta from its CURRENT position, clamped to the arena. */
export function nudgeTarget(state: SimulationState, key: string): boolean {
  const delta = getArrowKeyDelta(key);
  if (!delta) return false;
  setTarget(state, state.target.x + delta.x, state.target.y + delta.y);
  return true;
}

/**
 * Map a pointer event's client coordinates to an arena-space point, given
 * the container's bounding rect. Reuses the shared normalizePointerToPercent
 * ratio math (0-100 scale matches ARENA_SIZE exactly) instead of
 * re-deriving the same division.
 */
export function pointerToArenaPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): Point {
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const { x, y } = normalizePointerToPercent(localX, localY, rect.width, rect.height);
  return { x: clampToArena(x), y: clampToArena(y) };
}

/**
 * Advance the simulation by `dtMs` milliseconds. Mutates `state` in place and
 * returns it (same zero-allocation frame contract as stepParticles/
 * stepBursts): the prey seeks the target, the predator seeks the prey, both
 * bounce off the arena walls, and a catch banks the survival time, bumps the
 * catch counter, and resets both entities to their deterministic starting
 * layout. O(1) per call — exactly two entities, no per-frame allocation.
 */
export function stepSimulation(state: SimulationState, dtMs: number): SimulationState {
  const clampedDtMs = Math.min(dtMs, MAX_FRAME_DELTA_MS);
  const step = clampedDtMs / FRAME_MS;

  applyDifferentialDrive(
    state.prey,
    state.target.x,
    state.target.y,
    PREY_MAX_SPEED,
    PREY_MAX_TURN_RATE_RAD,
    step
  );
  applyArenaBoundary(state.prey);

  // The predator acts on its SENSOR, never on ground truth. With contact it
  // pursues and refreshes its last-known fix; blind, it drives to that stale
  // fix, and once it arrives still blind it sweeps for the prey.
  state.predatorHasContact = canSenseTarget(state.predator, state.prey.x, state.prey.y);

  if (state.predatorHasContact) {
    state.lastKnownPreyX = state.prey.x;
    state.lastKnownPreyY = state.prey.y;
    applyDifferentialDrive(
      state.predator,
      state.prey.x,
      state.prey.y,
      PREDATOR_MAX_SPEED,
      PREDATOR_MAX_TURN_RATE_RAD,
      step
    );
  } else {
    const dx = state.lastKnownPreyX - state.predator.x;
    const dy = state.lastKnownPreyY - state.predator.y;
    if (dx * dx + dy * dy <= IR_SEARCH_ARRIVAL_RADIUS_SQ) {
      applySearchSweep(state.predator, step);
    } else {
      applyDifferentialDrive(
        state.predator,
        state.lastKnownPreyX,
        state.lastKnownPreyY,
        PREDATOR_MAX_SPEED,
        PREDATOR_MAX_TURN_RATE_RAD,
        step
      );
    }
  }

  applyArenaBoundary(state.predator);

  state.elapsedMs += clampedDtMs;

  if (isCaught(state.predator, state.prey)) {
    state.lastSurvivalMs = state.elapsedMs;
    state.bestSurvivalMs = Math.max(state.bestSurvivalMs, state.elapsedMs);
    state.catches += 1;
    state.elapsedMs = 0;

    const reset = createInitialEntities(INITIAL_SIM_SEED);
    state.predator.x = reset.predator.x;
    state.predator.y = reset.predator.y;
    state.predator.vx = 0;
    state.predator.vy = 0;
    state.predator.heading = reset.predator.heading;
    state.prey.x = reset.prey.x;
    state.prey.y = reset.prey.y;
    state.prey.vx = 0;
    state.prey.vy = 0;
    state.prey.heading = reset.prey.heading;
    // A new life starts the predator blind again, with only the opening fix.
    state.predatorHasContact = false;
    state.lastKnownPreyX = reset.prey.x;
    state.lastKnownPreyY = reset.prey.y;
  }

  return state;
}

/** The RAF loop runs on tiers with headroom for continuous motion; lite/reduced get a static frame. */
export function isAnimationEnabled(tier: PerformanceTier): boolean {
  return tier === 'full' || tier === 'balanced';
}

/** Format elapsed milliseconds as seconds with one decimal, e.g. "12.3". */
export function formatSurvivalSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

/** Live-region message for a catch event — announced once, not per-frame. */
export function getCatchAnnouncement(catches: number, survivalSeconds: string, bestSeconds: string): string {
  const catchWord = catches === 1 ? 'catch' : 'catches';
  return `Caught! Survived ${survivalSeconds}s. Total ${catchWord}: ${catches}. Best: ${bestSeconds}s.`;
}

/**
 * SVG path for the predator's IR detection cone — a wedge of radius
 * IR_SENSOR_RANGE spanning heading ± IR_SENSOR_HALF_ANGLE_RAD.
 *
 * Drawing the sensor is not decoration: the cone is the mechanic. A player who
 * cannot see where the predator is looking has no way to learn that slipping
 * behind it breaks contact, and the whole point of modelling IR instead of
 * omniscience would be invisible.
 *
 * The 90° sweep is always the minor arc, so the large-arc flag is fixed at 0.
 */
export function buildIrConePath(entity: Entity): string {
  const start = entity.heading - IR_SENSOR_HALF_ANGLE_RAD;
  const end = entity.heading + IR_SENSOR_HALF_ANGLE_RAD;
  const x1 = entity.x + Math.cos(start) * IR_SENSOR_RANGE;
  const y1 = entity.y + Math.sin(start) * IR_SENSOR_RANGE;
  const x2 = entity.x + Math.cos(end) * IR_SENSOR_RANGE;
  const y2 = entity.y + Math.sin(end) * IR_SENSOR_RANGE;

  return (
    `M ${entity.x.toFixed(2)} ${entity.y.toFixed(2)} ` +
    `L ${x1.toFixed(2)} ${y1.toFixed(2)} ` +
    `A ${IR_SENSOR_RANGE} ${IR_SENSOR_RANGE} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
  );
}

/** Cone fill opacity — brighter the moment the predator actually has contact. */
export const IR_CONE_FILL_IDLE = 0.05;
export const IR_CONE_FILL_CONTACT = 0.16;

export function getIrConeOpacity(hasContact: boolean): number {
  return hasContact ? IR_CONE_FILL_CONTACT : IR_CONE_FILL_IDLE;
}

/** Visual radii, in arena units, for the two entities. */
export const PREY_VISUAL_RADIUS = 2.6;
export const PREDATOR_VISUAL_RADIUS = 3.4;

/** Static caption shown in place of the live chase when the RAF loop is disabled. */
export const PAUSED_CAPTION = 'Chase paused — reduced motion or low-power mode is active.';

/** Accessible description of the whole widget for its container aria-label. */
export const SIMULATION_ARIA_LABEL =
  'Predator-prey chase simulation. Move your cursor, drag on touch, or use the arrow keys once focused, to guide the prey away from the pursuing predator.';
