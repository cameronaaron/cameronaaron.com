import { describe, expect, it } from 'vitest';
import { getFloatingBadgePositionClass, getFloatingBadgeYOffset } from '@/components/ui/floating-badge-logic';

describe('floating badge logic', () => {
  it('maps positions to class names', () => {
    expect(getFloatingBadgePositionClass('top-right')).toBe('-top-4 -right-4');
    expect(getFloatingBadgePositionClass('bottom-left')).toBe('-bottom-4 -left-4');
  });

  it('maps positions to y-offset animation tracks', () => {
    expect(getFloatingBadgeYOffset('top-right')).toEqual([0, -10, 0]);
    expect(getFloatingBadgeYOffset('bottom-left')).toEqual([0, 10, 0]);
  });
});
