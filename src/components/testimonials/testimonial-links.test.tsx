import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TestimonialCard from './TestimonialCard';

import type { Testimonial } from '@/data/testimonials';

describe('testimonial link rendering', () => {
  it('renders both profile and original post links when supplied', () => {
    const testimonial: Testimonial = {
      name: 'Dr. Joy Lawson Davis, Ed.D.',
      role: 'Author, Scholar, Professional Development Trainer',
      relationship: 'Capstone Committee Member',
      date: 'June 2026',
      text: 'Great work Cameron!!',
      profileUrl: 'https://www.linkedin.com/in/drjoybrighttalentedblack/',
      originalPostUrl:
        'https://www.facebook.com/joyld1/posts/pfbid0261cux8P1tjRCUGC9WyJpk8fxzpNnxbYQeceKUNX7T6aFMy4H89XgVPcmwdd6BHGLl',
    };

    render(<TestimonialCard testimonial={testimonial} index={0} />);

    const profileLink = screen.getByRole('link', {
      name: /open dr\. joy lawson davis, ed\.d\.'s linkedin profile/i,
    });
    expect(profileLink.getAttribute('href')).toBe(testimonial.profileUrl);

    const originalPostLink = screen.getByRole('link', {
      name: /open the original post for dr\. joy lawson davis, ed\.d\./i,
    });
    expect(originalPostLink.getAttribute('href')).toBe(testimonial.originalPostUrl);
  });

  it('omits original post link when no source URL is provided', () => {
    const testimonial: Testimonial = {
      name: 'Example Recommender',
      role: 'Mentor',
      relationship: 'Mentor',
      date: 'May 2024',
      text: 'Outstanding work and leadership.',
    };

    render(<TestimonialCard testimonial={testimonial} index={0} />);

    expect(screen.queryByRole('link', { name: /original post/i })).toBeNull();
  });
});
