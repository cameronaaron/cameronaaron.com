import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Certifications from './Certifications';
import Testimonials from './Testimonials';

describe('date sorting regression guards', () => {
  it('keeps testimonials sorted by recency without requiring expansion', () => {
    render(<Testimonials />);

    expect(screen.getByTestId('testimonial-item-0').textContent).toContain('JoeAnna McDonald');
    expect(screen.getByTestId('testimonial-item-1').textContent).toContain('H. John Schaeffer');
    expect(screen.queryByRole('button', { name: /view all/i })).toBeNull();
  });

  it('keeps certifications ordered by latest expiration and completion dates', () => {
    render(<Certifications />);

    expect(screen.getByTestId('cert-row-0').textContent).toContain('Certified Nursing Assistant (CNA)');
    expect(screen.getByTestId('cert-row-1').textContent).toContain('National Registry of EMTs');
    expect(screen.getByTestId('cert-row-2').textContent).toContain('Los Angeles County EMS Agency');
  });
});
