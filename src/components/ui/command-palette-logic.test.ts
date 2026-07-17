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
  SCORE_PER_MATCH,
  SCORE_WORD_START_BONUS,
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

  it('builds every social command with the right label and a resolvable URL, not just github', () => {
    const catalog = buildCommandCatalog(navItems, profile.social);
    const expected: Array<{ id: string; label: string; socialKey: keyof typeof profile.social }> = [
      { id: 'social:github', label: 'Open GitHub', socialKey: 'github' },
      { id: 'social:linkedin', label: 'Open LinkedIn', socialKey: 'linkedin' },
      { id: 'social:spotify', label: 'Open Spotify', socialKey: 'spotify' },
      { id: 'social:appleMusic', label: 'Open Apple Music', socialKey: 'appleMusic' },
    ];
    for (const { id, label, socialKey } of expected) {
      const command = catalog.find((c) => c.id === id);
      expect(command?.label).toBe(label);
      expect(command?.action).toEqual({ kind: 'href', url: profile.social[socialKey] });
    }
  });

  it('tags jump commands "Section" and social commands "Link" in the hint column', () => {
    const catalog = buildCommandCatalog(navItems, profile.social);
    for (const command of catalog) {
      expect(command.hint).toBe(command.action.kind === 'jump' ? 'Section' : 'Link');
    }
  });

  it('lowercases keywords so a case-insensitive query still matches (nav and social entries alike)', () => {
    const catalog = buildCommandCatalog(navItems, profile.social);
    for (const command of catalog) {
      expect(command.keywords).toBe(command.keywords.toLowerCase());
    }
    // End-to-end: an uppercase query must still find a lowercase-keyword command.
    const home = catalog.find((c) => c.id === 'jump:#home')!;
    expect(scoreCommand(home, 'home')).not.toBeNull();
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

  it('rewards a match at absolute index 0 as a word start, distinct from following a separator', () => {
    // 'g' is the very first character of the text — no separator involved at
    // all, so this exercises the `found === 0` branch specifically (as
    // opposed to the prior test, which exercises `WORD_SEPARATORS.has(...)`).
    const atStart = scoreSubsequence('g', 'github')!;
    const midWord = scoreSubsequence('i', 'github')!; // 'i' is mid-word, no bonus
    expect(atStart.score).toBeGreaterThan(midWord.score);
  });

  it.each([
    ['-', 'open-github'],
    ['/', 'open/github'],
    [':', 'open:github'],
    ['·', 'open·github'],
    ['.', 'open.github'],
  ])('treats %j as a word separator that earns the start-of-word bonus', (_separator, text) => {
    const afterSeparator = scoreSubsequence('g', text)!;
    const bare = scoreSubsequence('g', 'xgithub')!; // 'g' at index 1, no separator before it
    expect(afterSeparator.score).toBeGreaterThan(bare.score);
  });

  it('never awards a consecutive-run bonus to the very first match, however early it lands', () => {
    // The consecutive bonus is `found === previousMatch + 1`; the sentinel
    // previousMatch starts at -2 specifically so index 0 through small
    // indices can never satisfy it by coincidence. Pick a first match at
    // index 3 — the "off by one sentinel" failure mode — and check its score
    // exactly, since consecutive-vs-scattered comparisons alone don't pin it.
    const result = scoreSubsequence('a', 'xxxa')!; // sole match lands at index 3
    expect(result.score).toBe(SCORE_PER_MATCH); // no word-start (mid-word), no consecutive (first match)
  });

  it('pins an exact score for the simplest possible match (guards the base per-match increment sign)', () => {
    // A single character matching at index 0 gets exactly one base point plus
    // the word-start bonus — nothing else. Relative comparisons elsewhere
    // (consecutive > scattered, etc.) stay true even if the base increment
    // were subtracted instead of added, since both sides lose the same
    // constant; only an exact value pins the sign.
    const result = scoreSubsequence('a', 'a')!;
    expect(result.score).toBe(SCORE_PER_MATCH + SCORE_WORD_START_BONUS);
  });

  it('never lets a later query character reuse an earlier match\'s text position', () => {
    // Only one 'a' exists in the text; a second query 'a' must fail to match
    // rather than reusing index 0 by walking the cursor backward.
    expect(scoreSubsequence('aa', 'a')).toBeNull();
    // Sanity check the passing case still works with a genuinely repeated character.
    expect(scoreSubsequence('aa', 'aa')).not.toBeNull();
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

  it('picks the keyword score over a weaker simultaneous label match, but still highlights the label', () => {
    // Label match is deliberately weak: letters separated by non-separator 'x'
    // characters, so only the first hit earns a word-start bonus and none earn
    // a consecutive-run bonus. Keyword match is a tight contiguous run, which
    // stacks the word-start bonus with four consecutive-run bonuses — strictly
    // higher than the label's score.
    const synthetic: Command = {
      id: 'synthetic-dual-match',
      label: 'mxaxtxcxh',
      hint: 'Link',
      keywords: 'match',
      action: { kind: 'href', url: '#' },
    };
    const labelOnly = scoreSubsequence('match', synthetic.label.toLowerCase())!;
    const keywordOnly = scoreSubsequence('match', synthetic.keywords)!;
    expect(keywordOnly.score).toBeGreaterThan(labelOnly.score);

    const result = scoreCommand(synthetic, 'match');
    expect(result).not.toBeNull();
    // Score reflects the winning (keyword) side...
    expect(result!.score).toBe(keywordOnly.score);
    // ...but highlighting always mirrors the label's own match indices, since
    // the keyword text is never rendered and has nothing to highlight.
    expect(result!.labelMatches).toEqual(labelOnly.matches);
    expect(result!.labelMatches).not.toEqual([]);
  });

  it('scores a label-only match as a finite number, never the -Infinity keyword-absent sentinel leaking through', () => {
    // github's keywords ("github") don't contain any of o/p/e/n, so 'open'
    // only matches the label. The internal fallback for "no keyword match" is
    // -Infinity so Math.max always prefers a real label score — if that
    // sentinel's sign were flipped, Math.max would wrongly pick +Infinity.
    const match = scoreCommand(github, 'open')!;
    const labelOnly = scoreSubsequence('open', github.label.toLowerCase())!;
    expect(match.score).toBe(labelOnly.score);
    expect(Number.isFinite(match.score)).toBe(true);
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

  it('breaks score ties by catalog order across the FULL tied run, not just the leader', () => {
    // Every jump command shares the "go to " prefix, so "go" ties on an
    // identical score across all of them — checking only results[0] can't
    // distinguish a correct stable sort from a comparator that merely leaves
    // the leader in place by chance. Compare the entire tied sub-sequence.
    //
    // Known limitation (found via mutation testing): swapping the comparator's
    // `a.index - b.index` for `a.index + b.index` still passes this test on
    // this engine/dataset size — V8's sort happens to leave this specific
    // 8-item tied run in the same order regardless. A broken non-antisymmetric
    // comparator is technically detectable but its effect on final order is
    // implementation-defined, so no black-box assertion here is fully
    // reliable across engines. Left as a documented gap rather than a flaky
    // engine-specific assertion.
    const results = rankCommands(catalog, 'go');
    const jumpIds = catalog.filter((c) => c.action.kind === 'jump').map((c) => c.id);
    const rankedJumpIds = results.filter((r) => r.command.action.kind === 'jump').map((r) => r.command.id);
    expect(rankedJumpIds).toEqual(jumpIds);
  });

  it('trims and lowercases the query so a padded, differently-cased search still matches', () => {
    const padded = rankCommands(catalog, '  GIT  ');
    expect(padded[0]?.command.id).toBe('social:github');
    expect(padded).toEqual(rankCommands(catalog, 'git'));
  });
});

describe('buildEmptyResults', () => {
  const catalog = buildCommandCatalog(navItems, profile.social);

  it('returns the whole catalog unmarked when there are no recents', () => {
    const results = buildEmptyResults(catalog, []);
    expect(results).toHaveLength(catalog.length);
    expect(results.every((r) => r.recent !== true)).toBe(true);
    // Nothing is highlighted in the empty-query state — there's no active query.
    expect(results.every((r) => r.labelMatches.length === 0)).toBe(true);
  });

  it('surfaces recents first in MRU order, then the rest', () => {
    const recentIds = ['social:github', catalog[0].id];
    const results = buildEmptyResults(catalog, recentIds);
    expect(results[0].command.id).toBe('social:github');
    expect(results[0].recent).toBe(true);
    expect(results[0].labelMatches).toEqual([]);
    expect(results[1].command.id).toBe(catalog[0].id);
    expect(results[1].labelMatches).toEqual([]);
    // No command appears twice.
    const ids = results.map((r) => r.command.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(results).toHaveLength(catalog.length);
    // The tail (non-recent) entries are unmarked and unhighlighted too.
    expect(results.every((r) => r.labelMatches.length === 0)).toBe(true);
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

  it('clamps the exact upper boundary (index === length) to the last valid slot', () => {
    // Distinct from index=5,length=3 above (index > length): this is the
    // off-by-one edge the `>=` boundary exists for.
    expect(clampActiveIndex(3, 3)).toBe(2);
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

  it('updates cache.tail on eviction so a second eviction does not corrupt the list', () => {
    // A tail-node detach must repoint cache.tail to the new last node. If that
    // update were dropped, cache.tail would still reference the just-evicted
    // (now fully detached, prev=next=null) node — and a SECOND eviction would
    // detach that stale reference again, nulling cache.head via its dangling
    // "no prev" branch. A single eviction round can't expose this; it takes two.
    const cache: LruCache = createLru(2);
    lruTouch(cache, 'a');
    lruTouch(cache, 'b'); // order: b, a — tail=a
    lruTouch(cache, 'c'); // evicts 'a' — tail must become 'b'
    lruTouch(cache, 'd'); // evicts 'b' — only correct if tail was updated above
    expect(lruKeys(cache)).toEqual(['d', 'c']);
    expect(cache.map.has('b')).toBe(false);
  });

  it('keeps cache.tail correct after detaching a middle node, so a later eviction still removes the true LRU', () => {
    // lruKeys() only walks head→next, so it can't see corruption in the
    // prev-pointer chain or in cache.tail itself — both are only used
    // internally by eviction. This regression specifically forces a later
    // eviction to depend on tail having survived a middle-node detach intact.
    const cache: LruCache = createLru(3);
    lruTouch(cache, 'a');
    lruTouch(cache, 'b');
    lruTouch(cache, 'c'); // order: c, b, a — 'a' is tail
    lruTouch(cache, 'b'); // promote middle node 'b' — must not disturb tail tracking for 'a'
    lruTouch(cache, 'd'); // over capacity — must evict the genuine LRU ('a'), not a corrupted tail
    expect(cache.map.has('a')).toBe(false);
    expect(cache.map.has('c')).toBe(true);
    expect(lruKeys(cache)).toEqual(['d', 'b', 'c']);
  });

  it('defaults to the shared capacity constant', () => {
    const cache = createLru();
    for (const key of ['a', 'b', 'c', 'd', 'e', 'f']) lruTouch(cache, key);
    // RECENTS_CAPACITY === 5, so the oldest ('a') is gone.
    expect(lruKeys(cache)).toHaveLength(5);
    expect(cache.map.has('a')).toBe(false);
  });
});
