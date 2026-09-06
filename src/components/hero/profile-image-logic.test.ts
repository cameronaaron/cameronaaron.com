import { describe, expect, it } from 'vitest';
import {
  calculateProfilePointerTargets,
  PROFILE_CONTAINER_ID,
  PROFILE_SPRING_CONFIG,
} from '@/components/hero/profile-image-logic';

describe('profile image logic', () => {
  it('exposes stable container id and spring settings', () => {
    expect(PROFILE_CONTAINER_ID).toBe('profile-container');
    expect(PROFILE_SPRING_CONFIG).toEqual({ damping: 20, stiffness: 100 });
  });

  it('calculates normalized pointer offsets relative to image center', () => {
    expect(calculateProfilePointerTargets({ left: 100, top: 100, width: 240, height: 240 }, 220, 220)).toEqual({ x: 0, y: 0 });
    expect(calculateProfilePointerTargets({ left: 100, top: 100, width: 240, height: 240 }, 340, 340)).toEqual({ x: 1, y: 1 });
  });
});
