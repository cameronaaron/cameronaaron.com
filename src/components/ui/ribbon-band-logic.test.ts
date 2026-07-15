import { describe, expect, it } from 'vitest';

import {
  RIBBON_COLORS,
  RIBBON_LANES,
  RIBBON_NODE_COUNT,
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

  it('skips a degenerate zero-length segment', () => {
    const ribbon = createRibbon(3, 0, 0, 20, 0);
    ribbon.x[1] = 0;
    ribbon.y[1] = 0; // node 1 coincides with node 0
    expect(() => satisfyConstraints(ribbon, 2)).not.toThrow();
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
