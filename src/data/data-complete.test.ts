import { describe, expect, it } from 'vitest';

import { certifications, inProgressCertifications } from './certifications';
import { socialPlatforms } from './contact';
import { educationItems, honorsAndAffiliations, prerequisiteCourses } from './education';
import { experiences } from './experience';
import { projects } from './projects';
import { skills } from './skills';
import { testimonials } from './testimonials';
import { sortByDateDesc } from './dateOrdering';

describe('data module coverage', () => {
  it('contains populated clinical and education data', () => {
    expect(certifications.length).toBeGreaterThan(0);
    expect(inProgressCertifications.length).toBeGreaterThan(0);
    expect(educationItems.length).toBeGreaterThan(0);
    expect(prerequisiteCourses.length).toBeGreaterThan(0);
    expect(honorsAndAffiliations.length).toBeGreaterThan(0);
  });

  it('contains populated experience, projects, and testimonials', () => {
    expect(experiences.length).toBeGreaterThan(0);
    expect(projects.length).toBeGreaterThan(0);
    expect(testimonials.length).toBeGreaterThan(0);
  });

  it('contains social and skills definitions', () => {
    expect(socialPlatforms.length).toBeGreaterThan(0);
    expect(skills.technical.length).toBeGreaterThan(0);
    expect(skills.domains.length).toBeGreaterThan(0);
    expect(skills.certifications.length).toBeGreaterThan(0);
  });

  it('records the four recently-completed nursing prerequisite courses with A grades', () => {
    const find = (courseFragment: string) =>
      prerequisiteCourses.find((c) => c.course.includes(courseFragment));

    const anatomy = find('ANATOMY 001');
    expect(anatomy?.grade).toBe('A');
    expect(anatomy?.gpa).toBe('4.00');
    expect(anatomy?.status).toBe('Completed');

    const physiology = find('PHYSIOL 001');
    expect(physiology?.grade).toBe('A');
    expect(physiology?.gpa).toBe('4.00');
    expect(physiology?.status).toBe('Completed');

    const childDev = find('CH DEV 001');
    expect(childDev?.grade).toBe('A');
    expect(childDev?.gpa).toBe('4.00');
    expect(childDev?.status).toBe('Completed');

    const sociology = find('SOC 001');
    expect(sociology?.grade).toBe('A');
    expect(sociology?.gpa).toBe('4.00');
    expect(sociology?.status).toBe('Completed');
  });

  it('records LACCD nursing prerequisite coursework with current transcript GPA and Dean’s Honor', () => {
    const laccd = educationItems.find((item) =>
      item.institution.includes('Los Angeles Community College District')
    );

    expect(laccd).toBeDefined();
    expect(laccd?.period).toBe('Sep 2025 - Dec 2026');
    // Aug 28, 2026 LACCD transcript: cum GPA 3.72, 40.00 units earned.
    expect(laccd?.details.some((d) => d.includes('3.72'))).toBe(true);
    expect(laccd?.details.some((d) => d.includes('40.00'))).toBe(true);
    expect(laccd?.details.some((d) => d.includes("Dean's Honor List"))).toBe(true);
    expect(laccd?.details.some((d) => d.includes('CHEM 051'))).toBe(true);
    expect(laccd?.details.some((d) => d.includes('EKG'))).toBe(true);

    const sortedByDate = sortByDateDesc(educationItems, (item) => item.period);
    expect(sortedByDate[0].institution).toContain('Los Angeles Community College District');
  });

  it('records the Summer 2026 STAT 101 statistics course as completed with an A', () => {
    const stat101 = prerequisiteCourses.find((c) => c.course.includes('STAT 101'));

    expect(stat101).toBeDefined();
    expect(stat101?.requirement).toBe('Statistics');
    expect(stat101?.units).toBe('4.00');
    expect(stat101?.grade).toBe('A');
    expect(stat101?.gpa).toBe('4.00');
    expect(stat101?.status).toBe('Completed');

    // STAT 101 REPLACES the Connecticut College statistics course (PSY 201,
    // C) rather than sitting alongside it — exactly one statistics row.
    expect(prerequisiteCourses.filter((c) => c.requirement.startsWith('Statistics'))).toHaveLength(1);
    expect(prerequisiteCourses.some((c) => c.course.includes('PSY 201'))).toBe(false);
  });

  it('marks both CHEM 051 prerequisite entries as in-progress for the current fall term', () => {
    const chem051Entries = prerequisiteCourses.filter((c) => c.course.includes('CHEM 051'));

    expect(chem051Entries.length).toBeGreaterThanOrEqual(2);
    for (const entry of chem051Entries) {
      expect(entry.status).toBe('In Progress');
      expect(entry.grade).toBe('In Progress');
    }

    const plannedChem = prerequisiteCourses.filter(
      (c) => c.course.includes('CHEM') && c.status === 'Planned'
    );
    expect(plannedChem).toHaveLength(0);
  });

  it('includes Spring 2026 Full Time Dean’s Honor List in honors and affiliations', () => {
    const springHonor = honorsAndAffiliations.find((h) => h.label.includes('Jun 2026'));

    expect(springHonor).toBeDefined();
    expect(springHonor?.label).toContain("Dean's Honor List");
    expect(springHonor?.label).toContain('LACCD');
  });

  it('includes the NREMT EMT Item Review Panel recognition as the most recent honor', () => {
    const panelHonor = honorsAndAffiliations.find((h) => h.label.includes('Item Review Panel'));

    expect(panelHonor).toBeDefined();
    expect(panelHonor?.label).toContain('National Registry of EMTs');
    expect(panelHonor?.label).toContain('Jul 2026');
    expect(panelHonor?.url).toBe('https://www.nremt.org/verify-credentials');

    const sortedHonors = sortByDateDesc(honorsAndAffiliations, (h) => h.label);
    expect(sortedHonors[0].label).toContain('Item Review Panel');
  });

  it('preserves testimonial source links for externally referenced recommendations', () => {
    const joy = testimonials.find((testimonial) => testimonial.name === 'Dr. Joy Lawson Davis, Ed.D.');

    expect(joy).toBeTruthy();
    expect(joy?.profileUrl).toBe('https://www.linkedin.com/in/drjoybrighttalentedblack/');
    expect(joy?.originalPostUrl).toBe(
      'https://www.facebook.com/joyld1/posts/pfbid0261cux8P1tjRCUGC9WyJpk8fxzpNnxbYQeceKUNX7T6aFMy4H89XgVPcmwdd6BHGLl'
    );

    const sourcedTestimonials = testimonials.filter((testimonial) => testimonial.originalPostUrl);
    expect(sourcedTestimonials.length).toBeGreaterThan(0);

    for (const testimonial of sourcedTestimonials) {
      expect(testimonial.profileUrl).toBeTruthy();
      expect(() => new URL(testimonial.originalPostUrl as string)).not.toThrow();
    }
  });

  it('never sets companyUrl without company — the link would silently never render', () => {
    // TestimonialCard only renders the company block (link included) when
    // `company` is truthy — a companyUrl set alongside a missing company
    // string is dead data: the link exists in the object but never reaches
    // the DOM. Found 2026-07: Vinicius SantAnna had a verified, live
    // dutchie.com companyUrl that had never once rendered.
    const orphanedCompanyUrls = testimonials.filter((t) => t.companyUrl && !t.company);
    expect(
      orphanedCompanyUrls.map((t) => t.name),
      'these testimonials have a companyUrl but no company text, so the link never renders — add the company name',
    ).toEqual([]);
  });

  it('reports testimonial data-completeness gaps for visibility (does not fail the build)', () => {
    // Not every gap is fixable — many recommenders' companies or LinkedIn
    // profile URLs simply aren't public/known, and guessing a profile URL
    // risks linking a testimonial to a stranger, which is worse than no
    // link. This surfaces the current gap count in test output so it stays
    // visible and doesn't silently grow, without blocking commits over
    // information nobody can verify.
    const missingCompany = testimonials.filter((t) => !t.company).map((t) => t.name);
    const missingProfile = testimonials.filter((t) => !t.profileUrl).map((t) => t.name);
    console.log(
      `testimonials: ${missingCompany.length}/${testimonials.length} missing company, ` +
        `${missingProfile.length}/${testimonials.length} missing profileUrl`,
    );
    expect(testimonials.length).toBeGreaterThan(0);
  });
});
