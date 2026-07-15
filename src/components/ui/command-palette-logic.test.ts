import { describe, expect, it } from 'vitest';

import { navItems } from '@/data/navigation';
import { profile } from '@/data/profile';
import {
  type Command,
  type LruCache,
  buildCommandCatalog,
  buildEmptyResults,
  clampActiveIndex,
  createLru,
  isPaletteOpenShortcut,
  lruKeys,
  lruTouch,
  moveActiveIndex,
  rankCommands,
  scoreCommand,
  scoreSubsequence,
  splitByMatches,
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

describe('scoreSubsequence', () => {
  it('returns a zero-score empty match for an empty query', () => {
    expect(scoreSubsequence('', 'anything')).toEqual({ score: 0, matches: [] });
  });

  it('matches in-order character subsequences and reports indices', () => {
    // "go to github" → g@0, first t after 0 @3, first h after 3 @9.
    const result = scoreSubsequence('gth', 'go to github');
    expect(result).not.toBeNull();
    expect(result!.matches).toEqual([0, 3, 9]);
  });

  it('returns null for out-of-order or absent characters', () => {
    expect(scoreSubsequence('zzz', 'go to home')).toBeNull();
    expect(scoreSubsequence('ohg', 'github')).toBeNull();
  });

  it('rewards consecutive runs over scattered matches', () => {
    const consecutive = scoreSubsequence('git', 'github')!;
    const scattered = scoreSubsequence('git', 'gxixt')!;
    expect(consecutive.score).toBeGreaterThan(scattered.score);
  });

  it('rewards a match that begins a word after a separator', () => {
    const wordStart = scoreSubsequence('g', 'open github')!; // hits the 'g' after a space
    const midWord = scoreSubsequence('p', 'open')!; // 'p' is mid-word, no bonus
    expect(wordStart.score).toBeGreaterThan(midWord.score);
  });
});

describe('scoreCommand', () => {
  const catalog = buildCommandCatalog(navItems, profile.social);
  const github = catalog.find((c) => c.id === 'social:github')!;

  it('matches on the label', () => {
    const match = scoreCommand(github, 'open');
    expect(match).not.toBeNull();
    expect(match!.labelMatches.length).toBeGreaterThan(0);
  });

  it('matches on hidden keywords with no label highlight', () => {
    // "hub" is a subsequence of the keyword "github" but not of the label "Open GitHub"
    // in a way the label misses… force a keyword-only hit with a keyword-unique query.
    const home = catalog.find((c) => c.id === 'jump:#home')!;
    const match = scoreCommand(home, 'home');
    expect(match).not.toBeNull();
  });

  it('returns null when neither label nor keywords match', () => {
    expect(scoreCommand(github, 'qqzz')).toBeNull();
  });

  it('matches on keywords alone with no label highlight', () => {
    const synthetic: Command = {
      id: 'synthetic',
      label: 'ZZZ',
      hint: 'Link',
      keywords: 'match',
      action: { kind: 'href', url: '#' },
    };
    const result = scoreCommand(synthetic, 'match');
    expect(result).not.toBeNull();
    expect(result!.labelMatches).toEqual([]);
    expect(result!.score).toBeGreaterThan(0);
  });

  it('keeps the higher of label and keyword score', () => {
    const match = scoreCommand(github, 'git');
    expect(match!.score).toBeGreaterThan(0);
  });
});

describe('rankCommands', () => {
  const catalog = buildCommandCatalog(navItems, profile.social);

  it('returns an empty array for a blank query', () => {
    expect(rankCommands(catalog, '')).toEqual([]);
    expect(rankCommands(catalog, '   ')).toEqual([]);
  });

  it('ranks the best match first', () => {
    const results = rankCommands(catalog, 'git');
    expect(results[0].command.id).toBe('social:github');
  });

  it('returns nothing when no command matches', () => {
    expect(rankCommands(catalog, 'qqqzzz')).toEqual([]);
  });

  it('breaks score ties by catalog order (stable)', () => {
    // Every jump command shares the "go to " prefix, so "go" ties on score;
    // the first catalog entry must lead.
    const results = rankCommands(catalog, 'go');
    const firstJump = catalog.find((c) => c.action.kind === 'jump')!;
    expect(results[0].command.id).toBe(firstJump.id);
  });
});

describe('buildEmptyResults', () => {
  const catalog = buildCommandCatalog(navItems, profile.social);

  it('returns the whole catalog unmarked when there are no recents', () => {
    const results = buildEmptyResults(catalog, []);
    expect(results).toHaveLength(catalog.length);
    expect(results.every((r) => r.recent !== true)).toBe(true);
  });

  it('surfaces recents first in MRU order, then the rest', () => {
    const recentIds = ['social:github', catalog[0].id];
    const results = buildEmptyResults(catalog, recentIds);
    expect(results[0].command.id).toBe('social:github');
    expect(results[0].recent).toBe(true);
    expect(results[1].command.id).toBe(catalog[0].id);
    // No command appears twice.
    const ids = results.map((r) => r.command.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(results).toHaveLength(catalog.length);
  });

  it('ignores recent ids that are not in the catalog and dedupes repeats', () => {
    const results = buildEmptyResults(catalog, ['ghost', 'social:github', 'social:github']);
    const recentEntries = results.filter((r) => r.recent);
    expect(recentEntries).toHaveLength(1);
    expect(recentEntries[0].command.id).toBe('social:github');
  });
});

describe('splitByMatches', () => {
  it('returns a single unmatched segment when nothing matched', () => {
    expect(splitByMatches('GitHub', [])).toEqual([{ text: 'GitHub', matched: false }]);
  });

  it('splits a label into matched and unmatched runs', () => {
    const segments = splitByMatches('GitHub', [0, 1, 2]);
    expect(segments).toEqual([
      { text: 'Git', matched: true },
      { text: 'Hub', matched: false },
    ]);
  });

  it('handles a trailing match run', () => {
    const segments = splitByMatches('GoHome', [4, 5]);
    expect(segments).toEqual([
      { text: 'GoHo', matched: false },
      { text: 'me', matched: true },
    ]);
  });

  it('handles alternating single-character matches', () => {
    const segments = splitByMatches('abcd', [0, 2]);
    expect(segments).toEqual([
      { text: 'a', matched: true },
      { text: 'b', matched: false },
      { text: 'c', matched: true },
      { text: 'd', matched: false },
    ]);
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

describe('LRU recents cache', () => {
  it('starts empty', () => {
    const cache = createLru(3);
    expect(lruKeys(cache)).toEqual([]);
  });

  it('lists most-recently-touched first', () => {
    const cache = createLru(3);
    lruTouch(cache, 'a');
    lruTouch(cache, 'b');
    lruTouch(cache, 'c');
    expect(lruKeys(cache)).toEqual(['c', 'b', 'a']);
  });

  it('promotes an existing key to the front (detaching a middle node)', () => {
    const cache = createLru(3);
    lruTouch(cache, 'a');
    lruTouch(cache, 'b');
    lruTouch(cache, 'c');
    lruTouch(cache, 'b'); // b is in the middle → detach + push front
    expect(lruKeys(cache)).toEqual(['b', 'c', 'a']);
  });

  it('promotes the current tail without corrupting the list', () => {
    const cache = createLru(3);
    lruTouch(cache, 'a');
    lruTouch(cache, 'b');
    lruTouch(cache, 'a'); // a is the tail → detach from the end
    expect(lruKeys(cache)).toEqual(['a', 'b']);
  });

  it('re-touching the current head is a stable no-op reorder', () => {
    const cache = createLru(3);
    lruTouch(cache, 'a');
    lruTouch(cache, 'b'); // head is 'b'
    lruTouch(cache, 'b'); // detach the head node itself
    expect(lruKeys(cache)).toEqual(['b', 'a']);
  });

  it('evicts the least-recently-used past capacity', () => {
    const cache: LruCache = createLru(2);
    lruTouch(cache, 'a');
    lruTouch(cache, 'b');
    lruTouch(cache, 'c'); // evicts 'a'
    expect(lruKeys(cache)).toEqual(['c', 'b']);
    expect(cache.map.has('a')).toBe(false);
  });

  it('defaults to the shared capacity constant', () => {
    const cache = createLru();
    for (const key of ['a', 'b', 'c', 'd', 'e', 'f']) lruTouch(cache, key);
    // RECENTS_CAPACITY === 5, so the oldest ('a') is gone.
    expect(lruKeys(cache)).toHaveLength(5);
    expect(cache.map.has('a')).toBe(false);
  });
});
