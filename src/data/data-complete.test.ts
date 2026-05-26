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
});
