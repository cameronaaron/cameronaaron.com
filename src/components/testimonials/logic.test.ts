import { describe, expect, it } from 'vitest';
import { testimonials } from '@/data/testimonials';
import {
  cycleSpotlightIndex,
  filterTestimonialsByRelationship,
  getFeaturedTestimonials,
  getSpotlightTestimonial,
  RELATIONSHIP_OPTIONS,
  sortTestimonialsByDate,
} from '@/components/testimonials/logic';

describe('testimonials logic', () => {
  it('defines relationship filter options used by the UI', () => {
    expect(RELATIONSHIP_OPTIONS.map((option) => option.key)).toEqual([
      'all',
      'manager',
      'mentor',
      'colleague',
    ]);
  });

  it('sorts testimonials and returns featured spotlight entries', () => {
    const sorted = sortTestimonialsByDate(testimonials);
    const featured = getFeaturedTestimonials(sorted);

    expect(sorted[0]?.name).toBe('Dr. Joy Lawson Davis, Ed.D.');
    expect(featured.length).toBeGreaterThan(0);
  });

  it('filters testimonials by relationship category', () => {
    const managers = filterTestimonialsByRelationship(testimonials, 'manager');
    const mentors = filterTestimonialsByRelationship(testimonials, 'mentor');

    expect(managers.every((item) => item.relationship.toLowerCase().includes('manager'))).toBe(true);
    expect(
      mentors.every((item) => {
        const relationship = item.relationship.toLowerCase();
        return relationship.includes('mentor') || relationship.includes('professor');
      })
    ).toBe(true);
  });

  it('cycles spotlight index with wraparound and supports empty lists', () => {
    expect(cycleSpotlightIndex(0, -1, 4)).toBe(3);
    expect(cycleSpotlightIndex(3, 1, 4)).toBe(0);
    expect(cycleSpotlightIndex(0, 1, 0)).toBe(0);
  });

  it('falls back to first spotlight item when index is out of range', () => {
    const featured = getFeaturedTestimonials(sortTestimonialsByDate(testimonials));

    expect(getSpotlightTestimonial(featured, 999)).toBe(featured[0]);
  });
});
