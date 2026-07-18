import { describe, expect, it } from 'vitest';
import { RAIL_SECTIONS, getMostVisibleEntry } from './section-rail-logic';

describe('RAIL_SECTIONS', () => {
  it('pins the exact id/label catalog for every rail item', () => {
    expect(RAIL_SECTIONS).toEqual([
      { id: 'home', label: 'Intro' },
      { id: 'certifications', label: 'Credentials' },
      { id: 'experience', label: 'Experience' },
      { id: 'education', label: 'Education' },
      { id: 'projects', label: 'Research' },
      { id: 'skills', label: 'Skills' },
      { id: 'testimonials', label: 'Voices' },
      { id: 'contact', label: 'Connect' },
    ]);
  });
});

function makeEntry(id: string, ratio: number): IntersectionObserverEntry {
  const el = document.createElement('div');
  el.id = id;
  return {
    target: el,
    isIntersecting: ratio > 0,
    intersectionRatio: ratio,
    boundingClientRect: {} as DOMRectReadOnly,
    intersectionRect: {} as DOMRectReadOnly,
    rootBounds: null,
    time: 0,
  } as IntersectionObserverEntry;
}

describe('getMostVisibleEntry', () => {
  it('returns the entry with the highest intersectionRatio', () => {
    const entries = [
      makeEntry('home', 0.1),
      makeEntry('experience', 0.9),
      makeEntry('projects', 0.4),
    ];
    const result = getMostVisibleEntry(entries);
    expect(result?.target.id).toBe('experience');
  });

  it('returns undefined when no entries are intersecting', () => {
    const entries = [makeEntry('home', 0), makeEntry('skills', 0)];
    expect(getMostVisibleEntry(entries)).toBeUndefined();
  });

  it('returns undefined for an empty array', () => {
    expect(getMostVisibleEntry([])).toBeUndefined();
  });

  it('returns the sole intersecting entry when only one is visible', () => {
    const entries = [makeEntry('contact', 0), makeEntry('education', 0.5)];
    const result = getMostVisibleEntry(entries);
    expect(result?.target.id).toBe('education');
  });

  it('returns the first when two entries have equal ratio', () => {
    // sort is stable in V8 — entries with equal ratio keep their relative order
    const entries = [makeEntry('home', 0.5), makeEntry('skills', 0.5)];
    const result = getMostVisibleEntry(entries);
    // Both are equally visible; the first one in the filtered list wins.
    // A mutant that widens the comparison to `>=` would let the SECOND entry
    // (skills) overwrite `best` on the tie — check the winning id, not just
    // the ratio value (which is identical either way).
    expect(result?.target.id).toBe('home');
    expect(result?.intersectionRatio).toBe(0.5);
  });

  it('filters out non-intersecting entries before ranking', () => {
    const entries = [
      makeEntry('a', 0.0),
      makeEntry('b', 0.3),
      makeEntry('c', 0.0),
      makeEntry('d', 0.7),
    ];
    expect(getMostVisibleEntry(entries)?.target.id).toBe('d');
  });
});
