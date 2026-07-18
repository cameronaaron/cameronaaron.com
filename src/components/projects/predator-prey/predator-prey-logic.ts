import { createSeededRandom, normalizePointerToPercent } from '@/components/hero/interactive-particles/engine';
import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

/**
 * "Don't get caught" — a live predator/prey chase paired with the "Predatory
 * and Prey Behavior Modifying MIP Robots" project. Two entities run genuine
 * steering-behavior physics (seek + arrival, velocity integration, boundary
 * bounce) inside a fixed 0-100 arena: the PREY seeks the player's pointer
 * (with inertia — it never teleports to the cursor), and the PREDATOR
 * autonomously seeks the prey. Getting caught resets the round and banks a
 * "best survival time"; the player's only job is to keep steering the prey
 * away from the predator.
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

// ── Steering constants (arena-units per step / per step^2) ──────────────────
export const PREY_MAX_SPEED = 1.4;
export const PREY_MAX_FORCE = 0.22;
export const PREDATOR_MAX_SPEED = 1.1;
export const PREDATOR_MAX_FORCE = 0.16;
export const VELOCITY_DAMPING = 0.995;
export const BOUNDARY_BOUNCE_FACTOR = -0.85;

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
}

export interface Point {
  x: number;
  y: number;
}

export interface SimulationState {
  predator: Entity;
  prey: Entity;
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
  };
  const predator: Entity = {
    x: PREDATOR_START_MIN + random() * PREDATOR_START_RANGE,
    y: PREDATOR_START_MIN + random() * PREDATOR_START_RANGE,
    vx: 0,
    vy: 0,
  };

  return { predator, prey };
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
    elapsedMs: 0,
    catches: 0,
    bestSurvivalMs: 0,
    lastSurvivalMs: 0,
  };
}

/**
 * Seek steering: accelerate `entity` toward (targetX, targetY), clamped to
 * maxForce, then integrate velocity and position by `step`. Mutates in
 * place — zero allocation, O(1) per call (ENGINEERING-STANDARDS §2.8).
 */
export function applySeek(
  entity: Entity,
  targetX: number,
  targetY: number,
  maxSpeed: number,
  maxForce: number,
  step: number,
): void {
  const dx = targetX - entity.x;
  const dy = targetY - entity.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  let desiredX = 0;
  let desiredY = 0;
  if (distance > 1e-4) {
    desiredX = (dx / distance) * maxSpeed;
    desiredY = (dy / distance) * maxSpeed;
  }

  let steerX = desiredX - entity.vx;
  let steerY = desiredY - entity.vy;
  const steerMagnitude = Math.sqrt(steerX * steerX + steerY * steerY);
  if (steerMagnitude > maxForce) {
    const scale = maxForce / steerMagnitude;
    steerX *= scale;
    steerY *= scale;
  }

  entity.vx = (entity.vx + steerX * step) * VELOCITY_DAMPING;
  entity.vy = (entity.vy + steerY * step) * VELOCITY_DAMPING;
  entity.x += entity.vx * step;
  entity.y += entity.vy * step;
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

  applySeek(state.prey, state.target.x, state.target.y, PREY_MAX_SPEED, PREY_MAX_FORCE, step);
  applyArenaBoundary(state.prey);

  applySeek(state.predator, state.prey.x, state.prey.y, PREDATOR_MAX_SPEED, PREDATOR_MAX_FORCE, step);
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
    state.prey.x = reset.prey.x;
    state.prey.y = reset.prey.y;
    state.prey.vx = 0;
    state.prey.vy = 0;
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

/** Visual radii, in arena units, for the two entities. */
export const PREY_VISUAL_RADIUS = 2.6;
export const PREDATOR_VISUAL_RADIUS = 3.4;

/** Static caption shown in place of the live chase when the RAF loop is disabled. */
export const PAUSED_CAPTION = 'Chase paused — reduced motion or low-power mode is active.';

/** Accessible description of the whole widget for its container aria-label. */
export const SIMULATION_ARIA_LABEL =
  'Predator-prey chase simulation. Move your cursor, drag on touch, or use the arrow keys once focused, to guide the prey away from the pursuing predator.';
