import { describe, expect, it } from 'vitest';
import { navItems } from '@/data/navigation';
import { HERO_DISCIPLINES, splitHeroName } from './hero-logic';

describe('hero disciplines', () => {
  it('names the four disciplines in reading order', () => {
    expect(HERO_DISCIPLINES.map((discipline) => discipline.name)).toEqual([
      'Engineering',
      'Security',
      'Clinical care',
      'NP path',
    ]);
  });

  it('sends every discipline to a section that exists in the navigation', () => {
    const sectionHrefs = new Set(navItems.map((item) => item.href));
    for (const discipline of HERO_DISCIPLINES) {
      expect(sectionHrefs.has(discipline.href), `${discipline.name} → ${discipline.href}`).toBe(true);
    }
  });

  it('gives each discipline its own destination, title and action', () => {
    for (const field of ['href', 'title', 'action', 'description'] as const) {
      expect(new Set(HERO_DISCIPLINES.map((discipline) => discipline[field])).size).toBe(HERO_DISCIPLINES.length);
    }
  });
});

describe('splitHeroName', () => {
  it('separates the two name lines from the post-nominals and drops the comma', () => {
    expect(splitHeroName('Cameron Aaron, M.Ed.')).toEqual({
      givenName: 'Cameron',
      familyName: 'Aaron',
      credentials: 'M.Ed.',
    });
  });

  it('keeps multi-part credentials together', () => {
    expect(splitHeroName('Ada Byron, RN, MSN').credentials).toBe('RN, MSN');
  });

  it('returns empty parts rather than undefined for a short or empty name', () => {
    expect(splitHeroName('Cher')).toEqual({ givenName: 'Cher', familyName: '', credentials: '' });
    expect(splitHeroName('')).toEqual({ givenName: '', familyName: '', credentials: '' });
  });
});
