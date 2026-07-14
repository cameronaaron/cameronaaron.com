import { describe, expect, it } from 'vitest';

import { navItems } from '@/data/navigation';
import { profile } from '@/data/profile';
import {
  buildCommandCatalog,
  clampActiveIndex,
  commandMatchesQuery,
  filterCommands,
  isPaletteOpenShortcut,
  isSubsequence,
  moveActiveIndex,
} from './command-palette-logic';

describe('buildCommandCatalog', () => {
  it('builds a jump command per nav item plus a link per social', () => {
    const catalog = buildCommandCatalog(navItems, profile.social);

    const jumps = catalog.filter((c) => c.action.kind === 'jump');
    const links = catalog.filter((c) => c.action.kind === 'href');
    expect(jumps).toHaveLength(navItems.length);
    expect(links).toHaveLength(4);

    const home = catalog.find((c) => c.id === 'jump:#home');
    expect(home?.action).toEqual({ kind: 'jump', targetId: 'home' });

    const github = catalog.find((c) => c.id === 'social:github');
    expect(github?.action).toEqual({ kind: 'href', url: profile.social.github });
  });

  it('strips the leading hash from jump targets so getElementById resolves', () => {
    const catalog = buildCommandCatalog(navItems, profile.social);
    for (const command of catalog) {
      if (command.action.kind === 'jump') {
        expect(command.action.targetId.startsWith('#')).toBe(false);
      }
    }
  });
});

describe('isSubsequence', () => {
  it('matches in-order character subsequences', () => {
    expect(isSubsequence('gth', 'go to github')).toBe(true);
    expect(isSubsequence('exp', 'go to experience')).toBe(true);
    expect(isSubsequence('', 'anything')).toBe(true);
  });

  it('rejects out-of-order or absent characters', () => {
    expect(isSubsequence('zzz', 'go to home')).toBe(false);
    expect(isSubsequence('ohg', 'github')).toBe(false);
  });
});

describe('filterCommands', () => {
  const catalog = buildCommandCatalog(navItems, profile.social);

  it('returns the same reference for an empty query (zero allocation)', () => {
    expect(filterCommands(catalog, '')).toBe(catalog);
    expect(filterCommands(catalog, '   ')).toBe(catalog);
  });

  it('narrows to subsequence matches in a single pass', () => {
    const results = filterCommands(catalog, 'git');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((c) => commandMatchesQuery(c, 'git'))).toBe(true);
    expect(results.some((c) => c.id === 'social:github')).toBe(true);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterCommands(catalog, 'qqqzzz')).toEqual([]);
  });
});

describe('moveActiveIndex', () => {
  it('wraps forward and backward', () => {
    expect(moveActiveIndex(0, 1, 3)).toBe(1);
    expect(moveActiveIndex(2, 1, 3)).toBe(0);
    expect(moveActiveIndex(0, -1, 3)).toBe(2);
  });

  it('clamps an empty list to 0', () => {
    expect(moveActiveIndex(5, 1, 0)).toBe(0);
  });
});

describe('clampActiveIndex', () => {
  it('keeps the index inside the current results', () => {
    expect(clampActiveIndex(5, 3)).toBe(2);
    expect(clampActiveIndex(-1, 3)).toBe(0);
    expect(clampActiveIndex(1, 3)).toBe(1);
    expect(clampActiveIndex(0, 0)).toBe(0);
  });
});

describe('isPaletteOpenShortcut', () => {
  it('opens on Cmd+K and Ctrl+K', () => {
    expect(isPaletteOpenShortcut({ key: 'k', metaKey: true, ctrlKey: false })).toBe(true);
    expect(isPaletteOpenShortcut({ key: 'K', metaKey: false, ctrlKey: true })).toBe(true);
  });

  it('opens on a bare slash', () => {
    expect(isPaletteOpenShortcut({ key: '/', metaKey: false, ctrlKey: false })).toBe(true);
  });

  it('ignores plain letters and modified slashes', () => {
    expect(isPaletteOpenShortcut({ key: 'k', metaKey: false, ctrlKey: false })).toBe(false);
    expect(isPaletteOpenShortcut({ key: '/', metaKey: true, ctrlKey: false })).toBe(false);
  });
});
