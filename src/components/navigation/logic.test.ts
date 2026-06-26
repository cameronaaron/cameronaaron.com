import { describe, expect, it } from 'vitest';

import {
  ACTIVE_SECTION_TRIGGER_LINE,
  computeSectionBounds,
  getActiveNavLabel,
  hrefToSectionId,
  pickActiveHref,
  shouldCloseMobileMenuOnResize,
} from './logic';

describe('navigation logic', () => {
  it('maps hash hrefs to section ids', () => {
    expect(hrefToSectionId('#home')).toBe('home');
    expect(hrefToSectionId('contact')).toBe('contact');
  });

  it('computes section bounds from document ids', () => {
    const home = document.createElement('section');
    home.id = 'home';
    Object.defineProperty(home, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ top: 10, bottom: 400 }),
    });

    document.body.appendChild(home);

    const sections = computeSectionBounds([{ name: 'Home', href: '#home' }]);
    expect(sections).toEqual([{ href: '#home', top: 10, bottom: 400 }]);

    document.body.innerHTML = '';
  });

  it('prefers section intersecting trigger line', () => {
    const href = pickActiveHref(
      [
        { href: '#home', top: 0, bottom: 100 },
        { href: '#skills', top: 120, bottom: 420 },
      ],
      ACTIVE_SECTION_TRIGGER_LINE,
      '#home'
    );

    expect(href).toBe('#skills');
  });

  it('falls back to closest section when none intersects trigger', () => {
    const href = pickActiveHref(
      [
        { href: '#home', top: 300, bottom: 500 },
        { href: '#skills', top: 180, bottom: 220 },
      ],
      140,
      '#home'
    );

    expect(href).toBe('#skills');
  });

  it('returns fallback when no section bounds are available', () => {
    expect(pickActiveHref([], 140, '#contact')).toBe('#contact');
  });

  it('uses default triggerLine and fallbackHref when called with only sections', () => {
    expect(pickActiveHref([])).toBe('#home');
  });

  it('computes active label and desktop close behavior', () => {
    const items = [
      { name: 'Home', href: '#home' },
      { name: 'Skills', href: '#skills' },
    ];

    expect(getActiveNavLabel(items, '#skills')).toBe('Skills');
    expect(getActiveNavLabel(items, '#missing')).toBe('Home');
    expect(shouldCloseMobileMenuOnResize(500)).toBe(false);
    expect(shouldCloseMobileMenuOnResize(1024)).toBe(true);
  });
});
