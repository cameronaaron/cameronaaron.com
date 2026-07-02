import { describe, expect, it } from 'vitest';

import { QUICK_DOCK_LINKS, getDockLinkMotion, getDockMenuMotion } from './quick-actions-dock-logic';

describe('QUICK_DOCK_LINKS', () => {
  it('links every entry to an in-page section anchor', () => {
    expect(QUICK_DOCK_LINKS.length).toBeGreaterThan(0);
    for (const link of QUICK_DOCK_LINKS) {
      expect(link.href).toMatch(/^#[a-z]+$/);
      expect(link.label.length).toBeGreaterThan(0);
    }
  });
});

describe('getDockMenuMotion', () => {
  it('skips the entry offset when motion is reduced', () => {
    expect(getDockMenuMotion(true)).toEqual({
      initial: { opacity: 1 },
      exit: { opacity: 0 },
    });
  });

  it('slides the menu in from below at full motion', () => {
    expect(getDockMenuMotion(false)).toEqual({
      initial: { opacity: 0, y: 8 },
      exit: { opacity: 0, y: 8 },
    });
  });
});

describe('getDockLinkMotion', () => {
  it('removes stagger, offset, and hover motion when reduced', () => {
    const motion = getDockLinkMotion(true, 3);
    expect(motion.initial).toEqual({ opacity: 1 });
    expect(motion.exit).toEqual({ opacity: 0 });
    expect(motion.transition.delay).toBe(0);
    expect(motion.whileHover).toBeUndefined();
  });

  it('staggers each link by index at full motion', () => {
    const motion = getDockLinkMotion(false, 2);
    expect(motion.initial).toEqual({ opacity: 0, x: 6 });
    expect(motion.exit).toEqual({ opacity: 0, x: 6 });
    expect(motion.transition.delay).toBeCloseTo(0.06);
    expect(motion.whileHover).toEqual({ x: -2, scale: 1.02 });
  });
});
