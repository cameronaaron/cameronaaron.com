/**
 * "The Room Remembers" — paired with The Room Remembers You.
 *
 * A port of the installation's memory field (lib/memory-engine.ts), not a
 * look-alike. The room keeps a 64 × 36 field; each sensing tick, every
 * observed body deposits a Gaussian mark into it, and the whole field decays
 * by half every `memoryMinutes`. Two numbers carry the piece's behaviour and
 * are copied exactly: a body standing still (smoothed speed under 0.025 room
 * widths per second) deposits 0.0018 over a radius of 3.4 cells, and a moving
 * one deposits 0.0008 over 1.8. Stillness is remembered deeper and wider than
 * motion — the room is shaped by where people stop.
 *
 * Here the pointer is the body. As in the installation, the room never sees
 * an image of anyone: it knows only a position and a speed. Two honest
 * changes for a web page, both named: time is compressed 900× (the default
 * 120-minute half-life becomes 8 seconds) so forgetting is watchable, and a
 * square-root display gain lifts the faint field to a visible level. The ratio between a
 * still mark and a moving one is unchanged.
 *
 * Colours are the installation's dark-room palette (lib/palette.ts): a black
 * ground, the memory field added as light in its teal, and the present body
 * in its warm white.
 *
 * Per frame: O(field) decay and pixel write into reused buffers, O(radius²)
 * deposit — no allocation (ENGINEERING-STANDARDS §2.8).
 */

export const FIELD_WIDTH = 64;
export const FIELD_HEIGHT = 36;
export const FIELD_CELLS = FIELD_WIDTH * FIELD_HEIGHT;

/** The FULL hardware profile's sensing rate. */
export const SENSING_HZ = 24;
export const SENSING_TICK_MS = 1000 / SENSING_HZ;

export const STILL_SPEED = 0.025;
export const STILL_DEPOSIT = 0.0018;
export const STILL_RADIUS = 3.4;
export const MOVING_DEPOSIT = 0.0008;
export const MOVING_RADIUS = 1.8;
/** The tracker's exponential smoothing: speed = speed × 0.65 + measured × 0.35. */
export const SPEED_SMOOTHING_KEEP = 0.65;

export const GALLERY_HALF_LIFE_MINUTES = 120;
export const TIME_COMPRESSION = 900;
export const DEMO_HALF_LIFE_SECONDS = (GALLERY_HALF_LIFE_MINUTES * 60) / TIME_COMPRESSION;
export const FIELD_FLOOR = 0.0001;

/**
 * Display only: brightness = sqrt(value × gain). The stored field is the
 * installation's; a linear 6× gain was measured in a real browser to leave a
 * walked trail invisible (1.2 s of stillness rendered near RGB 9,20,24), so
 * the square root lifts faint memory the way the projected particle field
 * makes it legible on a wall.
 */
export const DISPLAY_GAIN = 20;

export const GROUND_RGB: readonly [number, number, number] = [0, 0, 0];
export const MEMORY_FIELD_RGB: readonly [number, number, number] = [46, 104, 124];
export const MEMORY_FIELD_ALPHA = 0.62;
export const PRESENT_BODY_RGB: readonly [number, number, number] = [255, 238, 214];

export function createField(): Float32Array {
  return new Float32Array(FIELD_CELLS);
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** lib/memory-engine.ts depositMemory, line for line. `x`/`y` are 0–1. */
export function depositMemory(field: Float32Array, x: number, y: number, amount: number, radius: number): void {
  const cx = Math.round(clamp(x, 0, 1) * (FIELD_WIDTH - 1));
  const cy = Math.round(clamp(y, 0, 1) * (FIELD_HEIGHT - 1));
  const reach = Math.max(1, Math.ceil(radius * 2));
  const twoRadiusSquared = 2 * radius * radius;
  for (let row = Math.max(0, cy - reach); row <= Math.min(FIELD_HEIGHT - 1, cy + reach); row += 1) {
    for (let col = Math.max(0, cx - reach); col <= Math.min(FIELD_WIDTH - 1, cx + reach); col += 1) {
      const dx = col - cx;
      const dy = row - cy;
      const index = row * FIELD_WIDTH + col;
      field[index] = clamp(field[index] + amount * Math.exp(-(dx * dx + dy * dy) / twoRadiusSquared), 0, 1);
    }
  }
}

/** Halves the field every `halfLifeSeconds`; values under the floor become 0. */
export function decayMemory(field: Float32Array, elapsedSeconds: number, halfLifeSeconds: number): void {
  const factor = 2 ** (-elapsedSeconds / halfLifeSeconds);
  for (let index = 0; index < field.length; index += 1) {
    const value = field[index] * factor;
    field[index] = value < FIELD_FLOOR ? 0 : value;
  }
}

export function isStill(speed: number): boolean {
  return speed < STILL_SPEED;
}

export function memoryDensity(field: Float32Array): number {
  let total = 0;
  for (let index = 0; index < field.length; index += 1) total += field[index];
  return total / field.length;
}

export interface Body {
  x: number;
  y: number;
  /** Smoothed speed in room widths per second. */
  speed: number;
}

export interface RoomState {
  field: Float32Array;
  body: Body | null;
  /** Where the pointer is now; the body catches up to it each sensing tick. */
  pointer: { x: number; y: number } | null;
  /** Unspent time toward the next sensing tick. */
  pendingMs: number;
  elapsedMs: number;
}

export function createRoom(): RoomState {
  return { field: createField(), body: null, pointer: null, pendingMs: 0, elapsedMs: 0 };
}

/** Pointer (in 0–1 room coordinates) or null when it leaves the room. */
export function setPointer(state: RoomState, point: { x: number; y: number } | null): void {
  state.pointer = point;
  if (point === null) state.body = null;
}

/**
 * Advances the room by `dtMs`, in whole sensing ticks: observe the body
 * (speed smoothed as the tracker does), deposit its mark, then decay.
 * Mutates `state` in place; nothing is allocated.
 */
export function stepRoom(state: RoomState, dtMs: number): void {
  state.pendingMs += Math.min(dtMs, 250);
  const tickSeconds = SENSING_TICK_MS / 1000;
  while (state.pendingMs >= SENSING_TICK_MS) {
    state.pendingMs -= SENSING_TICK_MS;
    state.elapsedMs += SENSING_TICK_MS;
    const pointer = state.pointer;
    if (pointer !== null) {
      if (state.body === null) {
        state.body = { x: pointer.x, y: pointer.y, speed: 0 };
      } else {
        const dx = pointer.x - state.body.x;
        const dy = pointer.y - state.body.y;
        const measured = Math.sqrt(dx * dx + dy * dy) / tickSeconds;
        state.body.speed = state.body.speed * SPEED_SMOOTHING_KEEP + measured * (1 - SPEED_SMOOTHING_KEEP);
        state.body.x = pointer.x;
        state.body.y = pointer.y;
      }
      const still = isStill(state.body.speed);
      depositMemory(
        state.field,
        state.body.x,
        state.body.y,
        still ? STILL_DEPOSIT : MOVING_DEPOSIT,
        still ? STILL_RADIUS : MOVING_RADIUS
      );
    }
    decayMemory(state.field, tickSeconds, DEMO_HALF_LIFE_SECONDS);
  }
}

/**
 * Writes the field into RGBA pixels: black ground plus the memory teal added
 * as light. Reuses the caller's buffer — no allocation per frame.
 */
export function writeFieldPixels(field: Float32Array, pixels: Uint8ClampedArray): void {
  const [r, g, b] = MEMORY_FIELD_RGB;
  for (let index = 0; index < field.length; index += 1) {
    const intensity = Math.min(1, Math.sqrt(field[index] * DISPLAY_GAIN)) * MEMORY_FIELD_ALPHA;
    const offset = index * 4;
    pixels[offset] = GROUND_RGB[0] + r * intensity;
    pixels[offset + 1] = GROUND_RGB[1] + g * intensity;
    pixels[offset + 2] = GROUND_RGB[2] + b * intensity;
    pixels[offset + 3] = 255;
  }
}

/** Client pointer position to 0–1 room coordinates. */
export function pointerToRoom(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
): { x: number; y: number } {
  return { x: clamp((clientX - rect.left) / rect.width, 0, 1), y: clamp((clientY - rect.top) / rect.height, 0, 1) };
}

/** Keyboard stand-in for walking: arrow keys move a body two cells at a time. */
export const KEY_STEP = 2 / FIELD_WIDTH;

export function stepPointerByKey(
  pointer: { x: number; y: number } | null,
  key: string
): { x: number; y: number } | null {
  const from = pointer ?? { x: 0.5, y: 0.5 };
  if (key === 'ArrowLeft') return { x: clamp(from.x - KEY_STEP, 0, 1), y: from.y };
  if (key === 'ArrowRight') return { x: clamp(from.x + KEY_STEP, 0, 1), y: from.y };
  if (key === 'ArrowUp') return { x: from.x, y: clamp(from.y - KEY_STEP, 0, 1) };
  if (key === 'ArrowDown') return { x: from.x, y: clamp(from.y + KEY_STEP, 0, 1) };
  return null;
}

export function isAnimationEnabled(tier: string): boolean {
  return tier === 'full' || tier === 'balanced';
}

export function describeBody(body: Body | null): string {
  if (body === null) return 'The room is empty. It is forgetting.';
  return isStill(body.speed)
    ? 'Still. The room is remembering you deeply.'
    : 'Moving. The room keeps only a faint trace.';
}

export function formatDensity(field: Float32Array): string {
  return `${(memoryDensity(field) * 1000).toFixed(1)}‰ of the room remembered`;
}

export const ROOM_ARIA_LABEL =
  'The Room Remembers: move your pointer, or use the arrow keys, through a dark room that remembers where you stood and slowly forgets.';
