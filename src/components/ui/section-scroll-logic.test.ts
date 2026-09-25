import { describe, expect, it } from 'vitest';

import {
  createSectionScrollState,
  SECTION_REAIM_MAX,
  SECTION_REAIM_TOLERANCE_PX,
  SECTION_SETTLE_FRAMES,
  stepSectionScroll,
} from './section-scroll-logic';

describe('section scroll re-aim logic', () => {
  it('starts aimed at the target with no re-aims and no settled frames', () => {
    expect(createSectionScrollState(5000, 120)).toEqual({ aimedAt: 5000, reaims: 0, lastScrollY: 120, stableFrames: 0 });
  });

  it('re-aims when a resolved placeholder pushes the target past the tolerance', () => {
    const state = createSectionScrollState(5000, 0);
    expect(stepSectionScroll(state, 5000 + SECTION_REAIM_TOLERANCE_PX + 1, 400)).toBe('reaim');
    expect(state).toEqual({ aimedAt: 5000 + SECTION_REAIM_TOLERANCE_PX + 1, reaims: 1, lastScrollY: 400, stableFrames: 0 });
  });

  it('re-aims when the target moves up past the tolerance too', () => {
    const state = createSectionScrollState(5000, 0);
    expect(stepSectionScroll(state, 5000 - SECTION_REAIM_TOLERANCE_PX - 1, 0)).toBe('reaim');
  });

  it('treats drift exactly at the tolerance as noise, not a move', () => {
    const state = createSectionScrollState(5000, 0);
    expect(stepSectionScroll(state, 5000 + SECTION_REAIM_TOLERANCE_PX, 10)).toBe('continue');
    expect(state.aimedAt).toBe(5000);
    expect(state.reaims).toBe(0);
  });

  it('keeps going while the scroll is still moving toward an unmoved target', () => {
    const state = createSectionScrollState(5000, 0);
    for (let y = 100; y <= 1000; y += 100) {
      expect(stepSectionScroll(state, 5000, y)).toBe('continue');
    }
    expect(state.stableFrames).toBe(0);
    expect(state.lastScrollY).toBe(1000);
  });

  it('finishes only after the scroll has rested for the full settle window', () => {
    const state = createSectionScrollState(5000, 4920);
    for (let frame = 1; frame < SECTION_SETTLE_FRAMES; frame += 1) {
      expect(stepSectionScroll(state, 5000, 4920)).toBe('continue');
      expect(state.stableFrames).toBe(frame);
    }
    expect(stepSectionScroll(state, 5000, 4920)).toBe('done');
  });

  it('restarts the settle window whenever the scroll moves again', () => {
    const state = createSectionScrollState(5000, 4920);
    for (let frame = 1; frame < SECTION_SETTLE_FRAMES; frame += 1) stepSectionScroll(state, 5000, 4920);
    expect(stepSectionScroll(state, 5000, 4921)).toBe('continue');
    expect(state.stableFrames).toBe(0);
  });

  it('resets the settle window on a re-aim so the new scroll gets to run', () => {
    const state = createSectionScrollState(5000, 4920);
    for (let frame = 1; frame < SECTION_SETTLE_FRAMES; frame += 1) stepSectionScroll(state, 5000, 4920);
    expect(stepSectionScroll(state, 9000, 4920)).toBe('reaim');
    expect(state.stableFrames).toBe(0);
    expect(stepSectionScroll(state, 9000, 4920)).toBe('continue');
    expect(state.stableFrames).toBe(1);
  });

  it('stops re-aiming at the cap and lets the jump settle instead of looping forever', () => {
    const state = createSectionScrollState(0, 0);
    let target = 0;
    for (let i = 0; i < SECTION_REAIM_MAX; i += 1) {
      target += 1000;
      expect(stepSectionScroll(state, target, 0)).toBe('reaim');
    }
    expect(state.reaims).toBe(SECTION_REAIM_MAX);
    expect(stepSectionScroll(state, target + 1000, 0)).toBe('continue');
    expect(state.aimedAt).toBe(target);
  });

  it('pins the tuning values the 2026-09 prototype measured against /out', () => {
    expect(SECTION_REAIM_TOLERANCE_PX).toBe(24);
    expect(SECTION_REAIM_MAX).toBe(20);
    expect(SECTION_SETTLE_FRAMES).toBe(6);
  });
});
