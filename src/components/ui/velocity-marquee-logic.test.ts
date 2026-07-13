import { describe, expect, it } from 'vitest';

import {
  CONTACT_MARQUEE_PHRASES,
  HERO_MARQUEE_PHRASES,
  MARQUEE_MAX_SHIFT_PX,
  MARQUEE_MAX_SKEW_DEG,
  MARQUEE_TRACK_DURATION_S,
  MARQUEE_VELOCITY_CLAMP_PX_S,
  buildMarqueeItems,
  clampMarqueeVelocity,
  getMarqueeMotionConfig,
  marqueeVelocityToShiftPx,
  marqueeVelocityToSkewDeg,
} from './velocity-marquee-logic';

describe('velocity marquee logic', () => {
  it('exposes non-empty phrase catalogs for both bands', () => {
    expect(HERO_MARQUEE_PHRASES.length).toBeGreaterThan(2);
    expect(CONTACT_MARQUEE_PHRASES.length).toBeGreaterThan(2);
    for (const phrase of [...HERO_MARQUEE_PHRASES, ...CONTACT_MARQUEE_PHRASES]) {
      expect(phrase.trim().length).toBeGreaterThan(0);
    }
  });

  it('animates and reacts to velocity on the full tier only', () => {
    expect(getMarqueeMotionConfig('full')).toEqual({ animateTrack: true, velocityReactive: true });
    expect(getMarqueeMotionConfig('balanced')).toEqual({ animateTrack: false, velocityReactive: false });
    expect(getMarqueeMotionConfig('lite')).toEqual({ animateTrack: false, velocityReactive: false });
    expect(getMarqueeMotionConfig('reduced')).toEqual({ animateTrack: false, velocityReactive: false });
  });

  it('clamps velocity symmetrically at the saturation window', () => {
    expect(clampMarqueeVelocity(0)).toBe(0);
    expect(clampMarqueeVelocity(500)).toBe(500);
    expect(clampMarqueeVelocity(MARQUEE_VELOCITY_CLAMP_PX_S + 5000)).toBe(MARQUEE_VELOCITY_CLAMP_PX_S);
    expect(clampMarqueeVelocity(-MARQUEE_VELOCITY_CLAMP_PX_S - 5000)).toBe(-MARQUEE_VELOCITY_CLAMP_PX_S);
  });

  it('maps velocity to skew linearly, saturating at the max skew', () => {
    expect(marqueeVelocityToSkewDeg(0)).toBe(0);
    expect(marqueeVelocityToSkewDeg(MARQUEE_VELOCITY_CLAMP_PX_S)).toBe(MARQUEE_MAX_SKEW_DEG);
    expect(marqueeVelocityToSkewDeg(-MARQUEE_VELOCITY_CLAMP_PX_S)).toBe(-MARQUEE_MAX_SKEW_DEG);
    expect(marqueeVelocityToSkewDeg(MARQUEE_VELOCITY_CLAMP_PX_S / 2)).toBeCloseTo(MARQUEE_MAX_SKEW_DEG / 2);
    expect(marqueeVelocityToSkewDeg(MARQUEE_VELOCITY_CLAMP_PX_S * 10)).toBe(MARQUEE_MAX_SKEW_DEG);
  });

  it('maps velocity to a shift that follows the band direction', () => {
    expect(marqueeVelocityToShiftPx(0, 1)).toBe(-0);
    expect(marqueeVelocityToShiftPx(MARQUEE_VELOCITY_CLAMP_PX_S, 1)).toBe(-MARQUEE_MAX_SHIFT_PX);
    expect(marqueeVelocityToShiftPx(MARQUEE_VELOCITY_CLAMP_PX_S, -1)).toBe(MARQUEE_MAX_SHIFT_PX);
    expect(marqueeVelocityToShiftPx(-MARQUEE_VELOCITY_CLAMP_PX_S, 1)).toBe(MARQUEE_MAX_SHIFT_PX);
  });

  it('duplicates the phrase list exactly twice with unique keys and alternating treatment', () => {
    const items = buildMarqueeItems(HERO_MARQUEE_PHRASES);

    expect(items).toHaveLength(HERO_MARQUEE_PHRASES.length * 2);
    expect(new Set(items.map((item) => item.key)).size).toBe(items.length);
    expect(items[0].text).toBe(HERO_MARQUEE_PHRASES[0]);
    expect(items[HERO_MARQUEE_PHRASES.length].text).toBe(HERO_MARQUEE_PHRASES[0]);
    expect(items[0].outlined).toBe(false);
    expect(items[1].outlined).toBe(true);
  });

  it('keeps the CSS loop period a positive finite number of seconds', () => {
    expect(MARQUEE_TRACK_DURATION_S).toBeGreaterThan(0);
    expect(Number.isFinite(MARQUEE_TRACK_DURATION_S)).toBe(true);
  });
});
