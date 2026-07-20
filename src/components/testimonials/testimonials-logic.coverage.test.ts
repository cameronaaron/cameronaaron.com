import { describe, expect, it } from 'vitest';
import type { Testimonial } from '@/data/testimonials';
import {
  cycleSpotlightIndex,
  filterTestimonialsByRelationship,
  getFeaturedTestimonials,
  getSpotlightTestimonial,
  RELATIONSHIP_OPTIONS,
  sortTestimonialsByDate,
} from '@/components/testimonials/testimonials-logic';

const makeTestimonial = (overrides: Partial<Testimonial> & Pick<Testimonial, 'name' | 'role' | 'relationship' | 'date' | 'text'>): Testimonial => ({
  ...overrides,
});

const colleagueTestimonial = makeTestimonial({
  name: 'Alice',
  role: 'Engineer',
  relationship: 'Colleague',
  date: 'January 2023',
  text: 'Great work.',
});

const managerTestimonial = makeTestimonial({
  name: 'Bob',
  role: 'VP Engineering',
  relationship: 'Manager',
  date: 'February 2023',
  text: 'Excellent.',
  featured: true,
});

const mentorTestimonial = makeTestimonial({
  name: 'Carol',
  role: 'Professor of CS',
  relationship: 'Professor',
  date: 'March 2023',
  text: 'Outstanding student.',
  featured: true,
});

const mentorDirectTestimonial = makeTestimonial({
  name: 'Dave',
  role: 'Career Advisor',
  relationship: 'Mentor',
  date: 'April 2023',
  text: 'Great mentee.',
});

const allTestimonial = makeTestimonial({
  name: 'Eve',
  role: 'Director',
  relationship: 'Industry Connection',
  date: 'May 2022',
  text: 'Impressive person.',
});

describe('testimonials/logic coverage — line 47', () => {
  describe('RELATIONSHIP_OPTIONS', () => {
    it('has all four filter keys in order', () => {
      expect(RELATIONSHIP_OPTIONS.map((o) => o.key)).toEqual(['all', 'manager', 'mentor', 'colleague']);
    });

    it('has human-readable labels for each key', () => {
      const labels = RELATIONSHIP_OPTIONS.map((o) => o.label);
      expect(labels).toContain('All Voices');
      expect(labels).toContain('Managers');
      expect(labels).toContain('Mentors');
      expect(labels).toContain('Colleagues');
    });
  });

  describe('sortTestimonialsByDate', () => {
    it('sorts newer dates before older dates', () => {
      const items = [colleagueTestimonial, managerTestimonial, mentorTestimonial];
      const sorted = sortTestimonialsByDate(items);
      expect(sorted[0]).toBe(mentorTestimonial); // April 2023 is newest
      expect(sorted[2]).toBe(colleagueTestimonial); // January 2023 is oldest
    });

    it('returns a new array without mutating the original', () => {
      const items = [colleagueTestimonial, managerTestimonial];
      const sorted = sortTestimonialsByDate(items);
      expect(sorted).not.toBe(items);
    });

    it('handles empty array', () => {
      expect(sortTestimonialsByDate([])).toEqual([]);
    });
  });

  describe('getFeaturedTestimonials', () => {
    it('returns only items with featured === true', () => {
      const items = [colleagueTestimonial, managerTestimonial, mentorTestimonial];
      const featured = getFeaturedTestimonials(items);
      expect(featured).toHaveLength(2);
      expect(featured).toContain(managerTestimonial);
      expect(featured).toContain(mentorTestimonial);
      expect(featured).not.toContain(colleagueTestimonial);
    });

    it('returns empty array when no items are featured', () => {
      const items = [colleagueTestimonial, mentorDirectTestimonial];
      expect(getFeaturedTestimonials(items)).toHaveLength(0);
    });

    it('handles empty array', () => {
      expect(getFeaturedTestimonials([])).toEqual([]);
    });
  });

  describe('getSpotlightTestimonial', () => {
    const items = [managerTestimonial, mentorTestimonial, colleagueTestimonial];

    it('returns the item at the given valid index', () => {
      expect(getSpotlightTestimonial(items, 0)).toBe(managerTestimonial);
      expect(getSpotlightTestimonial(items, 1)).toBe(mentorTestimonial);
      expect(getSpotlightTestimonial(items, 2)).toBe(colleagueTestimonial);
    });

    it('falls back to items[0] when the index is out of range', () => {
      expect(getSpotlightTestimonial(items, 999)).toBe(managerTestimonial);
    });

    it('returns undefined when the array is empty', () => {
      expect(getSpotlightTestimonial([], 0)).toBeUndefined();
    });
  });

  describe('cycleSpotlightIndex', () => {
    it('advances forward', () => {
      expect(cycleSpotlightIndex(0, 1, 4)).toBe(1);
      expect(cycleSpotlightIndex(3, 1, 4)).toBe(0); // wraps around
    });

    it('goes backward', () => {
      expect(cycleSpotlightIndex(0, -1, 4)).toBe(3); // wraps around
      expect(cycleSpotlightIndex(2, -1, 4)).toBe(1);
    });

    it('returns 0 when count is 0 (guard against division by zero)', () => {
      expect(cycleSpotlightIndex(0, 1, 0)).toBe(0);
      expect(cycleSpotlightIndex(5, -1, 0)).toBe(0);
    });
  });

  describe('filterTestimonialsByRelationship', () => {
    const items = [
      colleagueTestimonial,
      managerTestimonial,
      mentorTestimonial,
      mentorDirectTestimonial,
      allTestimonial,
    ];

    it("'all' filter returns every item", () => {
      const result = filterTestimonialsByRelationship(items, 'all');
      expect(result).toHaveLength(items.length);
    });

    it("'manager' filter returns items whose relationship includes 'manager'", () => {
      const result = filterTestimonialsByRelationship(items, 'manager');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(managerTestimonial);
    });

    it("'mentor' filter matches 'mentor' relationship", () => {
      const result = filterTestimonialsByRelationship(items, 'mentor');
      expect(result).toContain(mentorDirectTestimonial);
    });

    it("'mentor' filter also matches 'professor' relationship", () => {
      const result = filterTestimonialsByRelationship(items, 'mentor');
      expect(result).toContain(mentorTestimonial);
    });

    // This is the branch on line 47 that was not covered:
    // the fallthrough `return relationship.includes('colleague')` when filter === 'colleague'
    it("'colleague' filter returns items whose relationship includes 'colleague' (line 47)", () => {
      const result = filterTestimonialsByRelationship(items, 'colleague');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(colleagueTestimonial);
    });

    it("'colleague' filter excludes non-colleague relationships", () => {
      const result = filterTestimonialsByRelationship(items, 'colleague');
      expect(result).not.toContain(managerTestimonial);
      expect(result).not.toContain(mentorTestimonial);
      expect(result).not.toContain(allTestimonial);
    });

    it("'colleague' filter is case-insensitive", () => {
      const upperCase = makeTestimonial({
        name: 'Frank',
        role: 'Developer',
        relationship: 'Senior Colleague',
        date: 'June 2022',
        text: 'Good work.',
      });
      const result = filterTestimonialsByRelationship([upperCase], 'colleague');
      expect(result).toContain(upperCase);
    });

    it('returns empty array when no items match the filter', () => {
      const result = filterTestimonialsByRelationship([allTestimonial], 'colleague');
      expect(result).toHaveLength(0);
    });

    it('handles empty array for all filters', () => {
      expect(filterTestimonialsByRelationship([], 'all')).toEqual([]);
      expect(filterTestimonialsByRelationship([], 'manager')).toEqual([]);
      expect(filterTestimonialsByRelationship([], 'mentor')).toEqual([]);
      expect(filterTestimonialsByRelationship([], 'colleague')).toEqual([]);
    });
  });
});
