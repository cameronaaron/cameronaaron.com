/**
 * LCP fetch-priority contract for the hero profile image.
 *
 * Found 2026-07-23 by inspecting the built /out HTML: under `unoptimized`
 * static export, next/image's `priority` prop does NOT emit
 * `fetchpriority="high"` — the rendered <img> had only `loading="eager"`, so
 * the LCP image queued at default priority behind the initial async-script
 * wave. The attribute must be passed explicitly, and this test pins it so a
 * refactor (or a next upgrade changing prop pass-through) can't silently drop
 * it again. Also pins the <picture> AVIF mobile source (the render-path
 * format contract's component-level counterpart).
 */
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProfileImage from '@/components/hero/ProfileImage';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('profile-image-lcp — the hero image wins the bandwidth race', () => {
  it('renders the LCP <img> with fetchpriority="high" and eager loading', () => {
    const { container } = render(<ProfileImage src="/images/profile-hero.avif" alt="Cameron Aaron" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('fetchpriority')).toBe('high');
    expect(img!.getAttribute('loading')).toBe('eager');
  });

  it('serves the narrow-viewport slot an AVIF source via <picture>', () => {
    const { container } = render(<ProfileImage src="/images/profile-hero.avif" alt="Cameron Aaron" />);
    const source = container.querySelector('picture > source');
    expect(source).not.toBeNull();
    expect(source!.getAttribute('srcset')).toBe('/images/profile-hero-sm.avif');
    expect(source!.getAttribute('type')).toBe('image/avif');
    expect(source!.getAttribute('media')).toBe('(max-width: 639px)');
  });
});
