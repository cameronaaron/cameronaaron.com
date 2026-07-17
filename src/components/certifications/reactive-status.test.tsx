import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Certifications from '@/components/Certifications';

describe('Certifications — reactive expiry status', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders every verified credential as verified at the current real date', () => {
    render(<Certifications />);
    // No credential is due to expire soon right now — nothing should read as expiring/expired.
    expect(screen.queryByText(/renew soon/i)).toBeNull();
    expect(screen.queryByText(/renewal needed/i)).toBeNull();
  });

  it('flags a credential as expiring-soon once within the warning window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 10, 15)); // Nov 2027 — EMT (LA County) expires Feb 2028, 3 months out
    render(<Certifications />);
    expect(screen.getAllByText(/expires in 3 months.*renew soon/i).length).toBeGreaterThan(0);
  });

  it('flags every dated credential as expired long past its printed expiry', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2032, 0, 1));
    render(<Certifications />);
    expect(screen.getAllByText(/renewal needed/i).length).toBeGreaterThan(0);
    // The no-expiry credentials (NIH training, the CHW "Earned" certificate) never flip to expired.
    expect(screen.getAllByText(/protecting human research participants/i).length).toBeGreaterThan(0);
  });

  it('uses singular "month" at the exact 1-month-remaining boundary', () => {
    vi.useFakeTimers();
    // BLS (AHA) expires Aug 2027 — Jul 2027 puts it exactly 1 month out.
    vi.setSystemTime(new Date(2027, 6, 15));
    render(<Certifications />);
    expect(screen.getAllByText(/expires in 1 month(?!s)/i).length).toBeGreaterThan(0);
  });

  it('uses singular "month ago" at the exact 1-month-expired boundary', () => {
    vi.useFakeTimers();
    // EMT (LA County) expires Feb 2028 — Mar 2028 puts it exactly 1 month past.
    vi.setSystemTime(new Date(2028, 2, 10));
    render(<Certifications />);
    expect(screen.getAllByText(/expired 1 month ago(?!s)/i).length).toBeGreaterThan(0);
  });
});
