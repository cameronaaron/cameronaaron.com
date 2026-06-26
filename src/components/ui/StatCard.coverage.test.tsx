import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('StatCard branch coverage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: false, media: q, onchange: null,
        addListener: vi.fn(), removeListener: vi.fn(),
        addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('renders with prefersReducedMotion true (disables animations)', async () => {
    vi.doMock('@/hooks/useInteractionMode', () => ({
      useInteractionMode: () => ({
        enableHoverMotion: false,
        prefersReducedMotion: true,
        isCoarsePointer: true,
      }),
    }));

    const { default: StatCard } = await import('./StatCard');
    const { getByText } = render(<StatCard value="99+" label="Projects" />);
    expect(getByText('99+')).toBeTruthy();
    expect(getByText('Projects')).toBeTruthy();
  });

  it('renders with enableHoverMotion true (hover animations enabled)', async () => {
    vi.doMock('@/hooks/useInteractionMode', () => ({
      useInteractionMode: () => ({
        enableHoverMotion: true,
        prefersReducedMotion: false,
        isCoarsePointer: false,
      }),
    }));

    const { default: StatCard } = await import('./StatCard');
    const { getByText } = render(<StatCard value="5+" label="Years" />);
    expect(getByText('5+')).toBeTruthy();
  });
});
