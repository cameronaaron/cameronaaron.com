import { describe, expect, it } from 'vitest';
import {
  getFloatingBadgeFloatAnimation,
  getFloatingBadgePositionClass,
  getFloatingBadgeRotateAnimation,
  getFloatingBadgeYOffset,
} from '@/components/ui/floating-badge-logic';

describe('floating badge logic', () => {
  it('maps positions to class names', () => {
    expect(getFloatingBadgePositionClass('top-right')).toBe('-top-4 -right-4');
    expect(getFloatingBadgePositionClass('bottom-left')).toBe('-bottom-4 -left-4');
  });

  it('maps positions to y-offset animation tracks', () => {
    expect(getFloatingBadgeYOffset('top-right')).toEqual([0, -10, 0]);
    expect(getFloatingBadgeYOffset('bottom-left')).toEqual([0, 10, 0]);
  });

  it('float animation returns keyframes normally and a static 0 under reduced motion', () => {
    expect(getFloatingBadgeFloatAnimation('top-right', false)).toEqual([0, -10, 0]);
    expect(getFloatingBadgeFloatAnimation('bottom-left', false)).toEqual([0, 10, 0]);
    expect(getFloatingBadgeFloatAnimation('top-right', true)).toBe(0);
  });

  it('rotate animation returns wobble keyframes normally and a static 0 under reduced motion', () => {
    expect(getFloatingBadgeRotateAnimation(false)).toEqual([0, 5, -5, 0]);
    expect(getFloatingBadgeRotateAnimation(true)).toBe(0);
  });
});
