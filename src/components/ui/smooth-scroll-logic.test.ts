import { describe, expect, it } from 'vitest';

import { shouldResetScrollPosition } from './smooth-scroll-logic';

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
