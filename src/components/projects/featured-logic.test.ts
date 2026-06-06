import { describe, expect, it } from 'vitest';
import {
  calculateFeaturedSpotlightPosition,
  clampPercent,
  getFeaturedIconVariant,
  getFeaturedProjectCta,
  getFeaturedProjectLeadToken,
} from '@/components/projects/featured-logic';

describe('featured project logic', () => {
  it('clamps spotlight percentages to safe bounds', () => {
    expect(clampPercent(-12)).toBe(0);
    expect(clampPercent(35)).toBe(35);
    expect(clampPercent(140)).toBe(100);
  });

  it('calculates and clamps spotlight coordinates from pointer position', () => {
    expect(calculateFeaturedSpotlightPosition({ left: 10, top: 10, width: 100, height: 100 }, 60, 60)).toEqual({ x: 50, y: 50 });
    expect(calculateFeaturedSpotlightPosition({ left: 10, top: 10, width: 100, height: 100 }, -20, 200)).toEqual({ x: 0, y: 100 });
  });

  it('derives featured display variants and text fallbacks', () => {
    expect(getFeaturedIconVariant(0)).toBe('pen');
    expect(getFeaturedIconVariant(1)).toBe('science');
    expect(getFeaturedIconVariant(5)).toBe('code');
    expect(getFeaturedProjectCta()).toBe('View Publication');
    expect(getFeaturedProjectLeadToken('Bridging Transitions Study')).toBe('Bridging');
  });
});
