import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VelocityMarquee from './VelocityMarquee';
import { HERO_MARQUEE_PHRASES } from './velocity-marquee-logic';

// VelocityMarquee self-reads the performance tier (RSC islands migration,
// 2026-07) instead of taking it as a prop, so a Server Component page can
// render it. Drive the tier through the hook mock.
let mockTier = 'full';
vi.mock('@/hooks/usePerformanceProfile', () => ({
  usePerformanceProfile: () => ({ performanceTier: mockTier }),
}));

beforeEach(() => {
  mockTier = 'full';
});

describe('VelocityMarquee', () => {
  it('is entirely decorative: aria-hidden and pointer-transparent', () => {
    render(<VelocityMarquee phrases={HERO_MARQUEE_PHRASES} />);

    const band = screen.getByTestId('velocity-marquee');
    expect(band.getAttribute('aria-hidden')).toBe('true');
    expect(band.className).toContain('pointer-events-none');
    expect(band.className).toContain('select-none');
  });

  it('renders every phrase exactly twice for the seamless -50% wrap', () => {
    render(<VelocityMarquee phrases={HERO_MARQUEE_PHRASES} />);

    for (const phrase of HERO_MARQUEE_PHRASES) {
      expect(screen.getAllByText(phrase)).toHaveLength(2);
    }
  });

  it('runs the CSS loop on the full tier', () => {
    render(<VelocityMarquee phrases={HERO_MARQUEE_PHRASES} />);

    const track = screen.getByTestId('marquee-track');
    expect(track.className).toContain('marquee-track');
    expect(track.className).not.toContain('marquee-track-reverse');
  });

  it.each(['balanced', 'lite', 'reduced'] as const)('renders statically on the %s tier', (tier) => {
    mockTier = tier;
    render(<VelocityMarquee phrases={HERO_MARQUEE_PHRASES} />);

    const track = screen.getByTestId('marquee-track');
    expect(track.className).not.toContain('marquee-track');
  });

  it('reverses the loop direction when direction is -1', () => {
    render(<VelocityMarquee phrases={HERO_MARQUEE_PHRASES} direction={-1} />);

    const track = screen.getByTestId('marquee-track');
    expect(track.className).toContain('marquee-track-reverse');
  });

  it('alternates gradient-filled and outlined text treatments', () => {
    render(<VelocityMarquee phrases={HERO_MARQUEE_PHRASES} />);

    const [first] = screen.getAllByText(HERO_MARQUEE_PHRASES[0]);
    const [second] = screen.getAllByText(HERO_MARQUEE_PHRASES[1]);
    expect(first.className).toContain('bg-clip-text');
    expect(second.className).toContain('-webkit-text-stroke');
  });

  it('defaults to the forward direction and appends custom classes', () => {
    render(<VelocityMarquee phrases={HERO_MARQUEE_PHRASES} className="mt-2" />);

    const band = screen.getByTestId('velocity-marquee');
    expect(band.className).toContain('mt-2');
    expect(screen.getByTestId('marquee-track').className).toContain('marquee-track');
  });
});
