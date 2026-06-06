import { describe, expect, it } from 'vitest';
import {
  getCompanyAriaLabel,
  getOriginalPostAriaLabel,
  getProfileAriaLabel,
  getRelationshipMeta,
  getTestimonialCardClass,
} from '@/components/testimonials/card-logic';

describe('testimonial card logic', () => {
  it('builds class names for featured and standard cards', () => {
    expect(getTestimonialCardClass(true)).toContain('border-purple-500/30');
    expect(getTestimonialCardClass(false)).toBe('h-full p-6 ');
  });

  it('builds accessible aria labels for outbound profile and company links', () => {
    expect(getProfileAriaLabel('Cameron')).toBe("Open Cameron's LinkedIn profile");
    expect(getCompanyAriaLabel('Connecticut College')).toBe('Open Connecticut College website');
    expect(getOriginalPostAriaLabel('Cameron')).toBe('Open the original post for Cameron');
  });

  it('formats relationship metadata text consistently', () => {
    expect(getRelationshipMeta('Manager', 'June 2026')).toBe('Manager • June 2026');
  });
});
