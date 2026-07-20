import { describe, expect, it } from 'vitest';

import {
  ACTIVE_SECTION_TRIGGER_LINE,
  buildNavLabelMap,
  computeSectionBounds,
  hrefToSectionId,
  pickActiveHref,
  shouldCloseMobileMenuOnResize,
} from './navigation-logic';

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

  it('prefers an intersecting section even when a non-intersecting section is closer by raw distance', () => {
    // A mutant that hard-codes intersectsTrigger to `false` (or drops the
    // early `return section.href` entirely) falls straight through to the
    // closest-by-distance fallback. Craft a case where that fallback would
    // pick the WRONG section, so only a real intersect check returns the
    // right one.
    const href = pickActiveHref(
      [
        { href: '#far-intersect', top: 100, bottom: 200 }, // intersects; distance 40
        { href: '#near-miss', top: 145, bottom: 146 }, // doesn't intersect; distance 5 (closer)
      ],
      140
    );
    expect(href).toBe('#far-intersect');
  });

  it('computes distance as top MINUS triggerLine, not top plus triggerLine', () => {
    // Neither section here intersects, so the winner is decided purely by
    // `Math.abs(top - triggerLine)`. These two tops are chosen so the real
    // subtraction and a plus-mutant disagree on which one is closer.
    const href = pickActiveHref(
      [
        { href: '#a', top: 10, bottom: 50 }, // real distance |10-140|=130
        { href: '#b', top: -280, bottom: -200 }, // real distance |-280-140|=420
      ],
      140
    );
    expect(href).toBe('#a');
  });

  it('treats top === triggerLine as intersecting (boundary is <=, not <)', () => {
    const href = pickActiveHref(
      [
        // Distance-0 "closest" that must NOT win once superseded by an
        // actual intersect further in the array (real code returns early).
        { href: '#prior', top: 140, bottom: 50 },
        { href: '#boundary', top: 140, bottom: 300 },
      ],
      140
    );
    expect(href).toBe('#boundary');
  });

  it('treats bottom === triggerLine as intersecting (boundary is >=, not >)', () => {
    const href = pickActiveHref(
      [
        { href: '#prior2', top: 141, bottom: 999 }, // never intersects; distance 1
        { href: '#boundary2', top: 50, bottom: 140 }, // intersects at the exact bottom boundary
      ],
      140
    );
    expect(href).toBe('#boundary2');
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
