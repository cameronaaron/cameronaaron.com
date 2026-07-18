import { describe, expect, it } from 'vitest';

import {
  POINTER_REPEL_RADIUS,
  POINTER_REPEL_RADIUS_SQ,
  RIBBON_COLORS,
  RIBBON_LANES,
  RIBBON_NODE_COUNT,
  RIBBON_REST_ENERGY,
  applyPointerForce,
  createRibbon,
  createRibbonSet,
  integrateRibbon,
  ribbonKineticEnergy,
  ribbonSetAtRest,
  satisfyConstraints,
  stepRibbon,
  type RibbonState,
} from './ribbon-band-logic';

describe('POINTER_REPEL_RADIUS_SQ', () => {
  it('is the radius squared, not divided by itself', () => {
    expect(POINTER_REPEL_RADIUS_SQ).toBe(POINTER_REPEL_RADIUS * POINTER_REPEL_RADIUS);
    expect(POINTER_REPEL_RADIUS_SQ).toBe(16900);
  });
});

describe('RIBBON_COLORS', () => {
  it('pins the exact stroke colour for each lane (not just array length)', () => {
    // A structural length check (elsewhere) can't catch a mutant that blanks
    // out one string literal — pin the exact values too.
    expect(RIBBON_COLORS).toEqual([
      'rgba(56, 214, 255, 0.55)',
      'rgba(92, 240, 205, 0.5)',
      'rgba(126, 231, 255, 0.42)',
    ]);
  });
});

describe('createRibbon', () => {
  it('spaces nodes evenly with both endpoints pinned', () => {
    const ribbon = createRibbon(5, 0, 0, 40, 0);
    expect(ribbon.count).toBe(5);
    expect(Array.from(ribbon.x)).toEqual([0, 10, 20, 30, 40]);
    expect(ribbon.pinned[0]).toBe(1);
    expect(ribbon.pinned[4]).toBe(1);
    expect(ribbon.pinned[2]).toBe(0);
  });

  it('seeds previous positions equal to current (zero initial velocity)', () => {
    const ribbon = createRibbon(4, 0, 0, 30, 15);
    expect(ribbonKineticEnergy(ribbon)).toBe(0);
  });

  it('gives the ribbon slack so its rest length exceeds the straight segment', () => {
    const ribbon = createRibbon(3, 0, 0, 20, 0); // 2 segments of 10px
    expect(ribbon.restLength).toBeGreaterThan(10);
  });

  it('degrades safely to a single node without dividing by zero', () => {
    const ribbon = createRibbon(1, 5, 5, 5, 5);
    expect(Array.from(ribbon.x)).toEqual([5]);
    expect(Number.isFinite(ribbon.restLength)).toBe(true);
  });

  it('interpolates x/y correctly with nonzero start coordinates (not just offsets from 0)', () => {
    // x0=5,y0=5,x1=25,y1=15 — every prior test used x0=0 or y0=0, under which
    // (a - b) and (a + b) coincide and mask a subtraction-to-addition mutant.
    const ribbon = createRibbon(3, 5, 5, 25, 15);
    expect(ribbon.x[1]).toBe(15); // 5 + (25-5)*0.5
    expect(ribbon.y[1]).toBe(10); // 5 + (15-5)*0.5
    expect(ribbon.restLength).toBeCloseTo(12.074767078498866, 10);
  });
});

describe('createRibbonSet', () => {
  it('builds one ribbon per lane, strung across the full width', () => {
    const ribbons = createRibbonSet(200, 100);
    expect(ribbons).toHaveLength(RIBBON_LANES.length);
    expect(RIBBON_COLORS.length).toBeGreaterThanOrEqual(ribbons.length);
    for (let i = 0; i < ribbons.length; i += 1) {
      expect(ribbons[i].count).toBe(RIBBON_NODE_COUNT);
      expect(ribbons[i].x[0]).toBe(0);
      expect(ribbons[i].x[ribbons[i].count - 1]).toBe(200);
      expect(ribbons[i].y[0]).toBeCloseTo(100 * RIBBON_LANES[i]);
      // The endpoint (last node's y) is built from a separate height*lane
      // expression than the start node's y — check it independently so a
      // mutation isolated to just that second occurrence can't hide behind
      // the first node's assertion above.
      expect(ribbons[i].y[ribbons[i].count - 1]).toBeCloseTo(100 * RIBBON_LANES[i]);
    }
  });
});

describe('integrateRibbon', () => {
  it('pulls free nodes down under gravity but leaves pinned ends fixed', () => {
    const ribbon = createRibbon(3, 0, 0, 20, 0);
    integrateRibbon(ribbon);
    expect(ribbon.y[0]).toBe(0); // pinned
    expect(ribbon.y[2]).toBe(0); // pinned
    expect(ribbon.y[1]).toBeGreaterThan(0); // free node fell
  });

  it('carries momentum forward through the previous-position term', () => {
    const ribbon = createRibbon(3, 0, 0, 20, 0);
    // Give the middle node an initial rightward velocity by displacing prev.
    ribbon.px[1] = ribbon.x[1] - 5;
    integrateRibbon(ribbon, 0, 1); // no gravity, no damping → keep the 5px step
    expect(ribbon.x[1]).toBeCloseTo(15);
  });

  it('scales velocity by damping via multiplication, not division, on both axes', () => {
    // damping=1 (used above) makes * and / indistinguishable, and y0===y1===5
    // makes (y-py) and (y+py) indistinguishable when py=0. Use damping=0.5
    // and a nonzero py on both axes to pin the exact formula.
    const ribbon = createRibbon(3, 0, 5, 20, 5);
    ribbon.px[1] = ribbon.x[1] - 4; // stored velocity of 4
    ribbon.py[1] = ribbon.y[1] - 3; // stored velocity of 3
    integrateRibbon(ribbon, 0, 0.5); // no gravity, damping=0.5
    expect(ribbon.x[1]).toBe(12); // 10 + 4*0.5
    expect(ribbon.y[1]).toBe(6.5); // 5 + 3*0.5
  });
});

describe('applyPointerForce', () => {
  it('pushes an in-range free node away from the pointer', () => {
    const ribbon = createRibbon(3, 0, 0, 20, 0);
    const before = ribbon.y[1];
    // Pointer just above the middle node → node is pushed downward (away).
    applyPointerForce(ribbon, 10, -5, 100, 20);
    expect(ribbon.y[1]).toBeGreaterThan(before);
  });

  it('ignores nodes outside the repel radius', () => {
    const ribbon = createRibbon(3, 0, 0, 20, 0);
    const snapshot = Array.from(ribbon.y);
    applyPointerForce(ribbon, 1000, 1000, 100, 20);
    expect(Array.from(ribbon.y)).toEqual(snapshot);
  });

  it('ignores a node sitting exactly on the pointer (zero distance)', () => {
    const ribbon = createRibbon(3, 0, 0, 20, 0);
    const snapshot = Array.from(ribbon.x);
    applyPointerForce(ribbon, ribbon.x[1], ribbon.y[1], 100, 20);
    expect(Array.from(ribbon.x)).toEqual(snapshot);
  });

  it('computes the exact axis-aligned falloff displacement (magnitude, not just direction)', () => {
    // node1 sits at (10,0). Pointer at (0,0): dx=10, dy=0, dist=10, radius=20,
    // strength=10 -> falloff = (1 - 10/20) * 10 = 5; displacement = (dx/dist)*falloff = 5.
    const ribbon = createRibbon(3, 0, 0, 20, 0);
    applyPointerForce(ribbon, 0, 0, 20, 10);
    expect(ribbon.x[1]).toBe(15);
    expect(ribbon.y[1]).toBe(0);
  });

  it('computes the exact diagonal falloff displacement (both dx and dy nonzero)', () => {
    // node1 at (10,0). Pointer at (4,-8): dx=6, dy=8, dist=10, radius=20,
    // strength=10 -> falloff=5; dx-component=(6/10)*5=3, dy-component=(8/10)*5=4.
    const ribbon = createRibbon(3, 0, 0, 20, 0);
    applyPointerForce(ribbon, 4, -8, 20, 10);
    expect(ribbon.x[1]).toBe(13);
    expect(ribbon.y[1]).toBe(4);
  });
});

describe('satisfyConstraints', () => {
  it('pulls an over-stretched segment back toward its rest length', () => {
    const ribbon = createRibbon(3, 0, 0, 20, 0);
    ribbon.x[1] = 40; // yank the free middle node far right
    satisfyConstraints(ribbon, 5);
    // The pinned ends are unchanged; the free node is drawn back inward.
    expect(ribbon.x[0]).toBe(0);
    expect(ribbon.x[2]).toBe(20);
    expect(ribbon.x[1]).toBeLessThan(40);
  });

  it('leaves a fully-pinned segment untouched', () => {
    const ribbon = createRibbon(2, 0, 0, 5, 0); // both nodes pinned
    ribbon.x[1] = 99;
    satisfyConstraints(ribbon, 3);
    expect(ribbon.x[1]).toBe(99); // never corrected — both ends immovable
  });

  it('skips a degenerate zero-length segment without corrupting the rest of the chain', () => {
    const ribbon = createRibbon(3, 0, 0, 20, 0);
    ribbon.x[1] = 0;
    ribbon.y[1] = 0; // node 1 (free) coincides with pinned node 0 -> dist===0
    satisfyConstraints(ribbon, 1);
    // If the dist===0 guard doesn't fire, dividing by that zero distance
    // produces +/-Infinity, then Infinity*0 (the pinned node's zero weight)
    // is NaN, which propagates through the next segment and corrupts even
    // the far pinned endpoint. A bare not.toThrow() misses this: NaN never
    // throws, it just silently poisons the array.
    expect(ribbon.x[0]).toBe(0); // pinned node 0 - must stay finite, not NaN
    expect(ribbon.x[2]).toBe(20); // pinned node 2 - unreachable by the degenerate segment
    expect(ribbon.y[2]).toBe(0);
    // The healthy neighboring segment (node1-node2) still relaxes normally.
    expect(ribbon.x[1]).toBeCloseTo(9.2, 5);
  });

  it('runs exactly `iterations` relaxation passes, not one more or one fewer', () => {
    // Two free interior nodes (1 and 2) both stretched away from rest length;
    // full convergence takes multiple passes, so 1 vs 2 iterations produce
    // measurably different intermediate positions.
    const onePass = createRibbon(4, 0, 0, 30, 0);
    onePass.x[1] = 5;
    onePass.x[2] = 25;
    satisfyConstraints(onePass, 1);
    expect(onePass.x[1]).toBeCloseTo(12.5, 5);
    expect(onePass.x[2]).toBeCloseTo(19.200000762939453, 5);

    const twoPasses = createRibbon(4, 0, 0, 30, 0);
    twoPasses.x[1] = 5;
    twoPasses.x[2] = 25;
    satisfyConstraints(twoPasses, 2);
    expect(twoPasses.x[1]).toBeCloseTo(9.600000381469727, 5);
  });

  it('applies vertical (y-axis) correction with the correct sign, not just horizontal', () => {
    // A vertical ribbon: prior tests only ever displaced x, which can't catch
    // a dy computed with a flipped sign or operator (y=0 for all nodes there).
    const ribbon = createRibbon(3, 0, 0, 0, 40);
    ribbon.y[1] = 5; // yanked far up from its rest position
    satisfyConstraints(ribbon, 1);
    expect(ribbon.y[1]).toBeCloseTo(18.399999618530273, 5);
    expect(ribbon.x[1]).toBe(0); // no horizontal displacement introduced
  });

  it('divides (not multiplies) by total when redistributing correction across two free interior nodes', () => {
    // With only one interior free node (the tests above), the middle node's
    // "j"-side correction from one segment is always fully overwritten by the
    // next segment's full-weight ("i"-side, moveA=1) correction against the
    // far pinned endpoint — new_x = pinnedX - restLength*sign(...), which is
    // path-independent, so it silently masks a moveA/moveB formula bug. A
    // 5-node ribbon has TWO adjacent free interior nodes, so the middle one's
    // correction is only ever partially blended (moveA=0.5, not 1) by its
    // neighbor — nothing overwrites it, and a division-vs-multiplication (or
    // a += vs -=) bug on either axis becomes directly observable.
    const horizontal = createRibbon(5, 0, 0, 40, 0);
    horizontal.x[2] = 30; // stretch segment(1,2), compress segment(2,3)
    satisfyConstraints(horizontal, 1);
    expect(horizontal.x[1]).toBeCloseTo(15, 5);
    expect(horizontal.x[2]).toBeCloseTo(22.5, 5);
    expect(horizontal.x[3]).toBeCloseTo(29.200000762939453, 5);

    const vertical = createRibbon(5, 0, 0, 0, 40);
    vertical.y[2] = 30;
    satisfyConstraints(vertical, 1);
    expect(vertical.y[1]).toBeCloseTo(15, 5);
    expect(vertical.y[2]).toBeCloseTo(22.5, 5);
    expect(vertical.y[3]).toBeCloseTo(29.200000762939453, 5);
  });
});

describe('ribbonSetAtRest exact boundary', () => {
  it('treats energy exactly equal to RIBBON_REST_ENERGY as at rest (the boundary is ">", not ">=")', () => {
    // Float32Array-backed state can't hit this IEEE-754 boundary exactly —
    // squaring a rounded-to-float32 velocity essentially never lands on the
    // exact float64 bit pattern of the RIBBON_REST_ENERGY literal (confirmed
    // by exhaustive search over the representable float32 range near
    // sqrt(RIBBON_REST_ENERGY): zero matches). Math.sqrt(RIBBON_REST_ENERGY)
    // squared in plain float64 arithmetic *does* land exactly back on the
    // constant, so this fixture swaps in Float64Array-backed buffers — the
    // functions under test only ever index into these arrays, never check
    // their concrete type, so this is a faithful exact-precision fixture.
    const dx = Math.sqrt(RIBBON_REST_ENERGY);
    expect(dx * dx).toBe(RIBBON_REST_ENERGY); // sanity-check the fixture itself
    const atBoundary: RibbonState = {
      count: 3,
      x: new Float64Array([0, dx, 0]) as unknown as Float32Array,
      y: new Float64Array(3) as unknown as Float32Array,
      px: new Float64Array(3) as unknown as Float32Array,
      py: new Float64Array(3) as unknown as Float32Array,
      pinned: new Uint8Array([1, 0, 1]),
      restLength: 10,
    };
    expect(ribbonKineticEnergy(atBoundary)).toBe(RIBBON_REST_ENERGY);
    expect(ribbonSetAtRest([atBoundary])).toBe(true);
  });
});

describe('stepRibbon + rest detection', () => {
  it('applies the pointer force only while active', () => {
    const active = createRibbon(3, 0, 0, 20, 0);
    const idle = createRibbon(3, 0, 0, 20, 0);
    stepRibbon(active, { x: 10, y: -5, active: true });
    stepRibbon(idle, { x: 10, y: -5, active: false });
    expect(ribbonKineticEnergy(active)).toBeGreaterThan(ribbonKineticEnergy(idle));
  });

  it('settles toward rest when left alone under gravity', () => {
    const ribbon = createRibbon(RIBBON_NODE_COUNT, 0, 40, 300, 40);
    for (let i = 0; i < 4000; i += 1) {
      stepRibbon(ribbon, { x: 0, y: 0, active: false });
    }
    expect(ribbonSetAtRest([ribbon])).toBe(true);
  });

  it('reports the set as moving while any ribbon carries energy', () => {
    const still = createRibbon(3, 0, 0, 20, 0);
    const moving = createRibbon(3, 0, 0, 20, 0);
    moving.px[1] = moving.x[1] - 50; // large stored velocity
    expect(ribbonSetAtRest([still, moving])).toBe(false);
    expect(ribbonSetAtRest([still])).toBe(true);
  });
});

describe('ribbonKineticEnergy', () => {
  it('excludes pinned nodes from the energy sum', () => {
    const ribbon: RibbonState = createRibbon(2, 0, 0, 10, 0); // both pinned
    ribbon.px[0] = -100; // even a huge pinned displacement contributes nothing
    expect(ribbonKineticEnergy(ribbon)).toBe(0);
  });
});
