import { describe, expect, it } from 'vitest';
import {
  getFeaturedIconVariant,
  getFeaturedProjectCta,
  getFeaturedProjectLeadToken,
} from '@/components/projects/featured-logic';

describe('featured project logic', () => {

  it('derives featured display variants and text fallbacks', () => {
    expect(getFeaturedIconVariant(0)).toBe('pen');
    expect(getFeaturedIconVariant(1)).toBe('science');
    expect(getFeaturedIconVariant(5)).toBe('code');
    expect(getFeaturedProjectCta()).toBe('View Publication');
    expect(getFeaturedProjectLeadToken('Bridging Transitions Study')).toBe('Bridging');
  });
});
