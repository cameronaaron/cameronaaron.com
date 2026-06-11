import { describe, expect, it } from 'vitest';

import { certifications, inProgressCertifications } from './certifications';
import { socialPlatforms } from './contact';
import { educationItems, honorsAndAffiliations, prerequisiteCourses } from './education';
import { experiences } from './experience';
import { projects } from './projects';
import { skills } from './skills';
import { testimonials } from './testimonials';

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
});
