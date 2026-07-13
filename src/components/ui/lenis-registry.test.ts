import { afterEach, describe, expect, it } from 'vitest';

import { getActiveLenis, setActiveLenis } from './lenis-registry';

describe('lenis registry', () => {
  afterEach(() => {
    setActiveLenis(null);
  });

  it('returns null before any instance is registered', () => {
    expect(getActiveLenis()).toBeNull();
  });

  it('returns the instance passed to setActiveLenis', () => {
    const fakeLenis = { scrollTo: () => {} } as never;
    setActiveLenis(fakeLenis);
    expect(getActiveLenis()).toBe(fakeLenis);
  });

  it('clears the instance when set back to null', () => {
    setActiveLenis({ scrollTo: () => {} } as never);
    setActiveLenis(null);
    expect(getActiveLenis()).toBeNull();
  });
});
