import { describe, expect, it } from 'vitest';
import { getMostVisibleEntry } from './section-rail-logic';

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
    // Both are equally visible; the first one in the filtered list wins
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
