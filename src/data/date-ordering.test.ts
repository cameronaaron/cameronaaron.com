import { describe, expect, it } from 'vitest';

import { certifications } from './certifications';
import { educationItems, honorsAndAffiliations } from './education';
import { projects } from './projects';
import { testimonials } from './testimonials';
import { getDateSortKey, sortByDateDesc } from './dateOrdering';

describe('date ordering utility', () => {
  it('handles range, season, month-year, and parenthetical dates', () => {
    expect(getDateSortKey('May 2023 - Jun 2026')).toBeGreaterThan(getDateSortKey('Aug 2023 - Jun 2024'));
    expect(getDateSortKey('2019 - 2021')).toBeGreaterThan(getDateSortKey('2018 - 2020'));
    expect(getDateSortKey('2025 - TBD')).toBeGreaterThan(Number.NEGATIVE_INFINITY);
    expect(getDateSortKey('Spring 2019')).toBeGreaterThan(getDateSortKey('Aug 2018'));
    expect(getDateSortKey('Active (Expires Sep 2028)')).toBeGreaterThan(getDateSortKey('Active (Expires Dec 2027)'));
    expect(getDateSortKey('unknown - unknown')).toBe(Number.NEGATIVE_INFINITY);
    expect(getDateSortKey('')).toBe(Number.NEGATIVE_INFINITY);
    expect(getDateSortKey(undefined)).toBe(Number.NEGATIVE_INFINITY);
  });

  it('returns sorted copies without mutating source arrays', () => {
    const originalTestimonialOrder = testimonials.map((testimonial) => testimonial.name);
    const sortedTestimonials = sortByDateDesc(testimonials, (testimonial) => testimonial.date);

    expect(sortedTestimonials[0].name).toBe('Dr. Joy Lawson Davis, Ed.D.');
    expect(testimonials.map((testimonial) => testimonial.name)).toEqual(originalTestimonialOrder);
  });

  it('keeps high-level data sets sortable by latest date markers', () => {
    const sortedProjects = sortByDateDesc(projects, (project) => project.period);
    const sortedCertifications = sortByDateDesc(certifications, (certification) => certification.status);
    const sortedEducation = sortByDateDesc(educationItems, (item) => item.period);
    const sortedHonors = sortByDateDesc(honorsAndAffiliations, (item) => item.label);

    expect(sortedProjects[0].title).toContain('Bridging Transitions');
    expect(sortedCertifications[0].name).toBe('Certified Nursing Assistant (CNA)');
    expect(sortedEducation[0].credential).toContain('Nursing Prerequisite Coursework');
    expect(sortedHonors[0].label).toContain('Item Review Panel');
  });
});
