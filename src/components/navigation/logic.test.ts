import { describe, expect, it } from 'vitest';

import {
  ACTIVE_SECTION_TRIGGER_LINE,
  buildNavLabelMap,
  computeSectionBounds,
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

  it('computes desktop close behavior from the breakpoint', () => {
    expect(shouldCloseMobileMenuOnResize(500)).toBe(false);
    expect(shouldCloseMobileMenuOnResize(1024)).toBe(true);
  });

  it('buildNavLabelMap returns a ReadonlyMap with O(1) href→name lookup', () => {
    const items = [
      { name: 'Home', href: '#home' },
      { name: 'Skills', href: '#skills' },
      { name: 'Contact', href: '#contact' },
    ];
    const map = buildNavLabelMap(items);

    expect(map.get('#home')).toBe('Home');
    expect(map.get('#skills')).toBe('Skills');
    expect(map.get('#contact')).toBe('Contact');
    expect(map.get('#missing')).toBeUndefined();
    expect(map.size).toBe(3);
  });

  it('buildNavLabelMap returns empty map for empty items list', () => {
    expect(buildNavLabelMap([]).size).toBe(0);
  });
});
