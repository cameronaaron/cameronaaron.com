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

  it('sorts an ongoing range after every range that has ended', () => {
    // Read as unparseable, "Present" fell back to the start date, so a role
    // held since Jul 2025 sorted below one that ended Oct 2026.
    expect(getDateSortKey('Jul 2025 - Present')).toBeGreaterThan(getDateSortKey('Jul 2026 - Oct 2026'));
    expect(getDateSortKey('2025 - Present')).toBeGreaterThan(getDateSortKey('Dec 2099'));
    // "Present" means now only as a range's end.
    expect(getDateSortKey('Present')).toBe(Number.NEGATIVE_INFINITY);
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

    // Sep 2026 work (Homestead first in source order, stable sort) now leads.
    expect(sortedProjects[0].title).toContain('Homestead');
    expect(sortedCertifications[0].name).toBe('Certified Nursing Assistant (CNA)');
    expect(sortedEducation[0].credential).toContain('Nursing Prerequisite Coursework');
    expect(sortedHonors[0].label).toContain('Magna Cum Laude');
    expect(sortedHonors[1].label).toContain('Item Review Panel');
  });
});
