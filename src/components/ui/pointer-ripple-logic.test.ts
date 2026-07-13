import { describe, expect, it } from 'vitest';

import {
  POINTER_RIPPLE_POOL_SIZE,
  RIPPLE_DIAMETER_PX,
  RIPPLE_POOL_INDICES,
  getNextRippleIndex,
  getRippleOffset,
} from './pointer-ripple-logic';

describe('RIPPLE_POOL_INDICES', () => {
  it('matches the pool size with sequential indices', () => {
    expect(RIPPLE_POOL_INDICES).toHaveLength(POINTER_RIPPLE_POOL_SIZE);
    expect([...RIPPLE_POOL_INDICES]).toEqual(
      Array.from({ length: POINTER_RIPPLE_POOL_SIZE }, (_, index) => index)
    );
  });
});

describe('getNextRippleIndex', () => {
  it('cycles round-robin through the pool', () => {
    expect(getNextRippleIndex(0, 4)).toBe(1);
    expect(getNextRippleIndex(2, 4)).toBe(3);
    expect(getNextRippleIndex(3, 4)).toBe(0);
  });
});

describe('getRippleOffset', () => {
  it('centres the ripple on the pointer position', () => {
    expect(getRippleOffset(200, 100, RIPPLE_DIAMETER_PX)).toEqual({
      left: 200 - RIPPLE_DIAMETER_PX / 2,
      top: 100 - RIPPLE_DIAMETER_PX / 2,
    });
  });
});
