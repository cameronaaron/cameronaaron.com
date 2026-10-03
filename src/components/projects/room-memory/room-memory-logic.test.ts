import { describe, expect, it } from 'vitest';

import {
  DEMO_HALF_LIFE_SECONDS,
  DISPLAY_GAIN,
  FIELD_CELLS,
  FIELD_FLOOR,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  GALLERY_HALF_LIFE_MINUTES,
  KEY_STEP,
  MEMORY_FIELD_ALPHA,
  MEMORY_FIELD_RGB,
  MOVING_DEPOSIT,
  MOVING_RADIUS,
  PRESENT_BODY_RGB,
  GROUND_RGB,
  ROOM_ARIA_LABEL,
  SENSING_HZ,
  SENSING_TICK_MS,
  SPEED_SMOOTHING_KEEP,
  STILL_DEPOSIT,
  STILL_RADIUS,
  STILL_SPEED,
  TIME_COMPRESSION,
  createField,
  createRoom,
  decayMemory,
  depositMemory,
  describeBody,
  formatDensity,
  isAnimationEnabled,
  isStill,
  memoryDensity,
  pointerToRoom,
  setPointer,
  stepPointerByKey,
  stepRoom,
  writeFieldPixels,
} from './room-memory-logic';

/** The installation's depositMemory (lib/memory-engine.ts), verbatim, as the reference. */
function referenceDeposit(field: Float32Array, point: { x: number; y: number }, amount: number, radius = 2) {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const cx = Math.round(clamp(point.x, 0, 1) * (FIELD_WIDTH - 1));
  const cy = Math.round(clamp(point.y, 0, 1) * (FIELD_HEIGHT - 1));
  const reach = Math.max(1, Math.ceil(radius * 2));
  for (let y = Math.max(0, cy - reach); y <= Math.min(FIELD_HEIGHT - 1, cy + reach); y += 1) {
    for (let x = Math.max(0, cx - reach); x <= Math.min(FIELD_WIDTH - 1, cx + reach); x += 1) {
      const distanceSquared = (x - cx) ** 2 + (y - cy) ** 2;
      const weight = Math.exp(-distanceSquared / (2 * radius * radius));
      const index = y * FIELD_WIDTH + x;
      field[index] = clamp(field[index] + amount * weight, 0, 1);
    }
  }
}

describe('constants are the installation’s', () => {
  it('pins the field, sensing rate, deposits and palette', () => {
    expect([FIELD_WIDTH, FIELD_HEIGHT, FIELD_CELLS]).toEqual([64, 36, 2304]);
    expect(SENSING_HZ).toBe(24);
    expect(SENSING_TICK_MS).toBeCloseTo(41.6667, 3);
    expect([STILL_SPEED, STILL_DEPOSIT, STILL_RADIUS, MOVING_DEPOSIT, MOVING_RADIUS]).toEqual([0.025, 0.0018, 3.4, 0.0008, 1.8]);
    expect(SPEED_SMOOTHING_KEEP).toBe(0.65);
    expect([GALLERY_HALF_LIFE_MINUTES, TIME_COMPRESSION, DEMO_HALF_LIFE_SECONDS]).toEqual([120, 900, 8]);
    expect(FIELD_FLOOR).toBe(0.0001);
    expect(DISPLAY_GAIN).toBe(20);
    expect(GROUND_RGB).toEqual([0, 0, 0]);
    expect(MEMORY_FIELD_RGB).toEqual([46, 104, 124]);
    expect(MEMORY_FIELD_ALPHA).toBe(0.62);
    expect(PRESENT_BODY_RGB).toEqual([255, 238, 214]);
  });
});

describe('depositMemory', () => {
  it('matches the installation’s kernel exactly, at the centre, an edge and a corner', () => {
    for (const [x, y, amount, radius] of [
      [0.5, 0.5, STILL_DEPOSIT, STILL_RADIUS],
      [0.02, 0.7, MOVING_DEPOSIT, MOVING_RADIUS],
      [1, 0, 0.3, 2],
      [-1, 2, 0.9, 1],
    ] as const) {
      const ours = createField();
      const theirs = createField();
      depositMemory(ours, x, y, amount, radius);
      referenceDeposit(theirs, { x, y }, amount, radius);
      expect(Array.from(ours)).toEqual(Array.from(theirs));
    }
  });

  it('clamps an over-full cell at 1', () => {
    const field = createField();
    for (let i = 0; i < 5; i += 1) depositMemory(field, 0.5, 0.5, 0.4, 1);
    expect(Math.max(...field)).toBe(1);
  });

  it('remembers stillness deeper and wider than motion', () => {
    const still = createField();
    const moving = createField();
    depositMemory(still, 0.5, 0.5, STILL_DEPOSIT, STILL_RADIUS);
    depositMemory(moving, 0.5, 0.5, MOVING_DEPOSIT, MOVING_RADIUS);
    expect(Math.max(...still) / Math.max(...moving)).toBeCloseTo(2.25, 5);
    // Footprint above a just-visible level, not nonzero cells (that only
    // measures the kernel's reach cutoff).
    const visible = (field: Float32Array) => field.filter((v) => v > 0.0002).length;
    expect(visible(still)).toBeGreaterThan(visible(moving) * 3);
  });
});

describe('decayMemory', () => {
  it('halves the field every half-life and floors tiny values to zero', () => {
    const field = createField();
    field[0] = 0.8;
    field[1] = 0.00015;
    decayMemory(field, 8, 8);
    expect(field[0]).toBeCloseTo(0.4, 6);
    expect(field[1]).toBe(0);
    decayMemory(field, 0, 8);
    expect(field[0]).toBeCloseTo(0.4, 6);
  });

  it('keeps a value just above the floor', () => {
    // FIELD_FLOOR itself rounds below 0.0001 in a Float32Array and is
    // zeroed, exactly as in the installation, so test just above it.
    const field = createField();
    field[2] = 0.00011;
    decayMemory(field, 0, 8);
    expect(field[2]).toBeCloseTo(0.00011, 9);
  });
});

describe('the room', () => {
  it('classifies stillness at the installation’s threshold', () => {
    expect(isStill(0)).toBe(true);
    expect(isStill(0.0249)).toBe(true);
    expect(isStill(0.025)).toBe(false);
  });

  it('runs in whole sensing ticks and carries the remainder', () => {
    const room = createRoom();
    stepRoom(room, 100);
    expect(room.elapsedMs).toBeCloseTo(SENSING_TICK_MS * 2, 6);
    expect(room.pendingMs).toBeCloseTo(100 - SENSING_TICK_MS * 2, 6);
  });

  it('caps a long frame so a background tab cannot dump minutes of decay at once', () => {
    const room = createRoom();
    stepRoom(room, 10_000);
    expect(room.elapsedMs).toBeCloseTo(SENSING_TICK_MS * 6, 6);
  });

  it('a body that stands still deposits the still mark', () => {
    const room = createRoom();
    setPointer(room, { x: 0.5, y: 0.5 });
    stepRoom(room, SENSING_TICK_MS);
    expect(room.body).toEqual({ x: 0.5, y: 0.5, speed: 0 });
    const centre = Math.round(0.5 * 35) * FIELD_WIDTH + Math.round(0.5 * 63);
    const decay = 2 ** (-(SENSING_TICK_MS / 1000) / DEMO_HALF_LIFE_SECONDS);
    expect(room.field[centre]).toBeCloseTo(STILL_DEPOSIT * decay, 9);
  });

  it('smooths speed as the tracker does and switches to the moving mark', () => {
    const room = createRoom();
    setPointer(room, { x: 0.2, y: 0.5 });
    stepRoom(room, SENSING_TICK_MS);
    setPointer(room, { x: 0.3, y: 0.5 });
    stepRoom(room, SENSING_TICK_MS);
    const measured = 0.1 / (SENSING_TICK_MS / 1000);
    expect(room.body!.speed).toBeCloseTo(measured * 0.35, 9);
    expect(room.body!.x).toBe(0.3);
    expect(describeBody(room.body)).toBe('Moving. The room keeps only a faint trace.');
  });

  it('measures speed in both axes and compounds the smoothing tick over tick', () => {
    const room = createRoom();
    const tick = SENSING_TICK_MS / 1000;
    setPointer(room, { x: 0.5, y: 0.2 });
    stepRoom(room, SENSING_TICK_MS);
    setPointer(room, { x: 0.53, y: 0.24 });
    stepRoom(room, SENSING_TICK_MS);
    const first = (0.05 / tick) * 0.35;
    expect(room.body!.speed).toBeCloseTo(first, 9);
    stepRoom(room, SENSING_TICK_MS);
    expect(room.body!.speed).toBeCloseTo(first * 0.65, 9);
  });

  it('forgets the body when the pointer leaves, and keeps forgetting the field', () => {
    const room = createRoom();
    setPointer(room, { x: 0.5, y: 0.5 });
    stepRoom(room, 200);
    const before = memoryDensity(room.field);
    setPointer(room, null);
    expect(room.body).toBeNull();
    stepRoom(room, 200);
    expect(memoryDensity(room.field)).toBeLessThan(before);
    expect(describeBody(null)).toBe('The room is empty. It is forgetting.');
    expect(describeBody({ x: 0, y: 0, speed: 0 })).toBe('Still. The room is remembering you deeply.');
  });
});

describe('rendering and input', () => {
  it('adds the memory teal to a black ground as light', () => {
    const field = createField();
    field[0] = 1;
    field[1] = 0.0125; // sqrt(0.0125 × 20) = 0.5
    const pixels = new Uint8ClampedArray(FIELD_CELLS * 4);
    writeFieldPixels(field, pixels);
    expect(Array.from(pixels.slice(0, 4))).toEqual([Math.round(46 * 0.62), Math.round(104 * 0.62), Math.round(124 * 0.62), 255]);
    expect(Array.from(pixels.slice(4, 8))).toEqual([Math.round(46 * 0.5 * 0.62), Math.round(104 * 0.5 * 0.62), Math.round(124 * 0.5 * 0.62), 255]);
    expect(Array.from(pixels.slice(8, 12))).toEqual([0, 0, 0, 255]);
  });

  it('maps the pointer into the room and clamps at the walls', () => {
    const rect = { left: 10, top: 20, width: 200, height: 100 };
    expect(pointerToRoom(110, 70, rect)).toEqual({ x: 0.5, y: 0.5 });
    expect(pointerToRoom(-50, 500, rect)).toEqual({ x: 0, y: 1 });
  });

  it('walks with the arrow keys from the centre, two cells a step', () => {
    expect(KEY_STEP).toBe(2 / 64);
    expect(stepPointerByKey(null, 'ArrowRight')).toEqual({ x: 0.5 + KEY_STEP, y: 0.5 });
    expect(stepPointerByKey({ x: 0, y: 0.5 }, 'ArrowLeft')).toEqual({ x: 0, y: 0.5 });
    expect(stepPointerByKey({ x: 0.5, y: 0.5 }, 'ArrowUp')).toEqual({ x: 0.5, y: 0.5 - KEY_STEP });
    expect(stepPointerByKey({ x: 0.5, y: 1 }, 'ArrowDown')).toEqual({ x: 0.5, y: 1 });
    expect(stepPointerByKey({ x: 0.5, y: 0.5 }, 'Enter')).toBeNull();
  });

  it('animates only on tiers with headroom', () => {
    expect(['full', 'balanced', 'lite', 'reduced'].map(isAnimationEnabled)).toEqual([true, true, false, false]);
  });

  it('formats density and the accessible name', () => {
    const field = createField();
    expect(formatDensity(field)).toBe('0.0‰ of the room remembered');
    field.fill(0.0025);
    expect(formatDensity(field)).toBe('2.5‰ of the room remembered');
    expect(ROOM_ARIA_LABEL).toBe(
      'The Room Remembers: move your pointer, or use the arrow keys, through a dark room that remembers where you stood and slowly forgets.'
    );
  });
});
