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
