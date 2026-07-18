import { describe, expect, it } from 'vitest';

import { resolveHashElementId, shouldResetScrollPosition } from './smooth-scroll-logic';

describe('shouldResetScrollPosition', () => {
  it('never resets when a hash anchor is present', () => {
    expect(shouldResetScrollPosition('#projects', 'reload')).toBe(false);
    expect(shouldResetScrollPosition('#contact', 'back_forward')).toBe(false);
  });

  it('resets on reload and back/forward navigations without a hash', () => {
    expect(shouldResetScrollPosition('', 'reload')).toBe(true);
    expect(shouldResetScrollPosition('', 'back_forward')).toBe(true);
  });

  it('keeps the browser-restored position on normal navigations', () => {
    expect(shouldResetScrollPosition('', 'navigate')).toBe(false);
    expect(shouldResetScrollPosition('', undefined)).toBe(false);
  });
});

describe('resolveHashElementId', () => {
  it('strips the leading # to produce the element id', () => {
    expect(resolveHashElementId('#education')).toBe('education');
    expect(resolveHashElementId('#contact')).toBe('contact');
  });

  it('returns null for an empty hash', () => {
    expect(resolveHashElementId('')).toBeNull();
  });

  it('returns null for the bare # fragment', () => {
    expect(resolveHashElementId('#')).toBeNull();
  });

  it('accepts a 2-character hash (boundary is <2, not <=2)', () => {
    expect(resolveHashElementId('#a')).toBe('a');
  });

  it('returns null when the string does not start with #, even if long enough', () => {
    expect(resolveHashElementId('xy')).toBeNull();
  });
});
