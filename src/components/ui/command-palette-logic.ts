import type { NavItem } from '@/data/navigation';
import type { SocialLinks } from '@/data/profile';

/** A command either scrolls to a section or opens an external URL. */
export type CommandAction =
  | { kind: 'jump'; targetId: string }
  | { kind: 'href'; url: string };

export interface Command {
  id: string;
  label: string;
  /** Right-aligned category tag shown in the row. */
  hint: string;
  /** Extra searchable text not shown in the label. */
  keywords: string;
  action: CommandAction;
}

/**
 * A scored catalog entry. `score` ranks matches (higher = better); `labelMatches`
 * are the indices in the label that the query hit, so the row can highlight them.
 * `recent` marks entries surfaced from the LRU recents cache (empty-query state).
 */
export interface CommandMatch {
  command: Command;
  score: number;
  labelMatches: number[];
  recent?: boolean;
}

/** Social keys rendered as "open" commands, in display order. */
const SOCIAL_COMMANDS: readonly { key: keyof SocialLinks; label: string }[] = [
  { key: 'github', label: 'GitHub' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'spotify', label: 'Spotify' },
  { key: 'appleMusic', label: 'Apple Music' },
];

/** Characters that begin a new "word" — a match right after one scores a bonus. */
const WORD_SEPARATORS = new Set([' ', '-', '/', ':', '·', '.']);

/** Positional fuzzy-scoring weights (named, not inline — §2.6). */
export const SCORE_PER_MATCH = 1;
export const SCORE_CONSECUTIVE_BONUS = 8;
export const SCORE_WORD_START_BONUS = 10;

/** How many recently-run commands the LRU cache retains. */
export const RECENTS_CAPACITY = 5;

/**
 * Build the command catalog once from the nav sections and social links.
 * Pure and deterministic — the component memoizes this with `[]` so it runs a
 * single time, never per render or per keystroke.
 */
export function buildCommandCatalog(navItems: NavItem[], social: SocialLinks): Command[] {
  const catalog: Command[] = [];

  for (const item of navItems) {
    catalog.push({
      id: `jump:${item.href}`,
      label: `Go to ${item.name}`,
      hint: 'Section',
      keywords: item.name.toLowerCase(),
      action: { kind: 'jump', targetId: item.href.replace(/^#/, '') },
    });
  }

  for (const entry of SOCIAL_COMMANDS) {
    catalog.push({
      id: `social:${entry.key}`,
      label: `Open ${entry.label}`,
      hint: 'Link',
      keywords: entry.label.toLowerCase(),
      action: { kind: 'href', url: social[entry.key] },
    });
  }

  return catalog;
}

export interface SubsequenceMatch {
  score: number;
  /** Indices in `text` that matched, in order. */
  matches: number[];
}

/**
 * Greedy positional subsequence match: every character of `query` must appear
 * in `text` in order (the classic fuzzy-finder feel), but instead of a bare
 * boolean it returns a score that rewards consecutive runs and word-boundary
 * hits, plus the matched indices for highlighting. One left-to-right pass —
 * O(text length), bounded per command, run on keystroke not per frame.
 * Returns `null` when `query` is not a subsequence of `text`.
 */
export function scoreSubsequence(query: string, text: string): SubsequenceMatch | null {
  if (query.length === 0) return { score: 0, matches: [] };

  const matches: number[] = [];
  let score = 0;
  let cursor = 0;
  let previousMatch = -2; // so the first hit is never "consecutive"

  for (let q = 0; q < query.length; q += 1) {
    const target = query[q];
    let found = -1;
    while (cursor < text.length) {
      if (text[cursor] === target) {
        found = cursor;
        break;
      }
      cursor += 1;
    }
    if (found === -1) return null;

    score += SCORE_PER_MATCH;
    if (found === previousMatch + 1) score += SCORE_CONSECUTIVE_BONUS;
    if (found === 0 || WORD_SEPARATORS.has(text[found - 1])) score += SCORE_WORD_START_BONUS;

    matches.push(found);
    previousMatch = found;
    cursor = found + 1;
  }

  return { score, matches };
}

/**
 * Score one command against a lowercased query. Matches against both the label
 * and the hidden keywords, keeps the higher score, and reports the label's
 * matched indices for highlighting. Returns `null` when neither matches.
 */
export function scoreCommand(command: Command, loweredQuery: string): CommandMatch | null {
  const labelMatch = scoreSubsequence(loweredQuery, command.label.toLowerCase());
  const keywordMatch = scoreSubsequence(loweredQuery, command.keywords);
  if (!labelMatch && !keywordMatch) return null;

  const labelScore = labelMatch ? labelMatch.score : -Infinity;
  const keywordScore = keywordMatch ? keywordMatch.score : -Infinity;
  return {
    command,
    score: Math.max(labelScore, keywordScore),
    labelMatches: labelMatch ? labelMatch.matches : [],
  };
}

/**
 * Rank the catalog for a non-empty query: score each command once, then
 * decorate-sort-undecorate by score (desc), tiebroken by catalog order so the
 * result is stable. The comparator only ever compares precomputed numbers
 * (§2.5). Empty query returns `[]` — the component uses `buildEmptyResults`
 * for that state so recents can lead.
 */
export function rankCommands(catalog: Command[], query: string): CommandMatch[] {
  const lowered = query.trim().toLowerCase();
  if (lowered.length === 0) return [];

  const decorated: { match: CommandMatch; index: number }[] = [];
  for (let i = 0; i < catalog.length; i += 1) {
    const match = scoreCommand(catalog[i], lowered);
    if (match) decorated.push({ match, index: i });
  }
  decorated.sort((a, b) => b.match.score - a.match.score || a.index - b.index);
  return decorated.map((entry) => entry.match);
}

/**
 * Empty-query results: recently-run commands first (in MRU order, marked
 * `recent`), then the rest of the catalog in its natural order. Recent ids are
 * resolved through a Map built once (O(1) per lookup, not a scan per id), and a
 * Set dedupes so a recent id never also appears in the tail.
 */
export function buildEmptyResults(catalog: Command[], recentIds: string[]): CommandMatch[] {
  if (recentIds.length === 0) {
    const all: CommandMatch[] = [];
    for (const command of catalog) all.push({ command, score: 0, labelMatches: [] });
    return all;
  }

  const byId = new Map(catalog.map((command) => [command.id, command]));
  const results: CommandMatch[] = [];
  const surfaced = new Set<string>();

  for (const id of recentIds) {
    const command = byId.get(id);
    if (command && !surfaced.has(id)) {
      results.push({ command, score: 0, labelMatches: [], recent: true });
      surfaced.add(id);
    }
  }
  for (const command of catalog) {
    if (!surfaced.has(command.id)) results.push({ command, score: 0, labelMatches: [] });
  }
  return results;
}

/** A run of label text, flagged when it falls on a matched query character. */
export interface LabelSegment {
  text: string;
  matched: boolean;
}

/**
 * Split a label into matched / unmatched runs for highlighting. `matches` is
 * the sorted index list from `scoreSubsequence`; adjacent characters of the
 * same kind are coalesced into one segment so the row renders a handful of
 * spans, not one per character. One pass over the label.
 */
export function splitByMatches(label: string, matches: number[]): LabelSegment[] {
  if (matches.length === 0) return [{ text: label, matched: false }];

  const hit = new Set(matches);
  const segments: LabelSegment[] = [];
  let start = 0;
  let current = hit.has(0);

  for (let i = 1; i <= label.length; i += 1) {
    const isMatched = i < label.length && hit.has(i);
    if (i === label.length || isMatched !== current) {
      segments.push({ text: label.slice(start, i), matched: current });
      start = i;
      current = isMatched;
    }
  }
  return segments;
}

/** Wrap the active row index by `delta`, clamping an empty list to 0. */
export function moveActiveIndex(current: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return (current + delta + length) % length;
}

/** Keep the active index in range after the filtered list shrinks. */
export function clampActiveIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

/** True when the keystroke should open the palette (Cmd/Ctrl+K or "/"). */
export function isPaletteOpenShortcut(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
}): boolean {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === 'k') return true;
  return key === '/' && !event.metaKey && !event.ctrlKey;
}

/**
 * A recents cache backed by a hash map + intrusive doubly-linked list. `touch`
 * promotes a key to most-recently-used and evicts the least-recently-used once
 * over capacity — both O(1), no array shifting or re-sorting. `head` is MRU,
 * `tail` is LRU. This is the textbook LRU structure; the palette uses it to
 * surface just-run commands first while the query is empty.
 */
interface LruNode {
  key: string;
  prev: LruNode | null;
  next: LruNode | null;
}

export interface LruCache {
  capacity: number;
  map: Map<string, LruNode>;
  head: LruNode | null;
  tail: LruNode | null;
}

export function createLru(capacity: number = RECENTS_CAPACITY): LruCache {
  return { capacity, map: new Map(), head: null, tail: null };
}

/** Unlink a node from the list, mending its neighbours (and head/tail ends). */
function detach(cache: LruCache, node: LruNode): void {
  if (node.prev) {
    node.prev.next = node.next;
  } else {
    cache.head = node.next;
  }
  if (node.next) {
    node.next.prev = node.prev;
  } else {
    cache.tail = node.prev;
  }
  node.prev = null;
  node.next = null;
}

/** Insert a detached node at the MRU end. */
function pushFront(cache: LruCache, node: LruNode): void {
  node.prev = null;
  node.next = cache.head;
  if (cache.head) {
    cache.head.prev = node;
  } else {
    cache.tail = node;
  }
  cache.head = node;
}

/** Promote `key` to most-recently-used, inserting it and evicting if needed. */
export function lruTouch(cache: LruCache, key: string): void {
  const existing = cache.map.get(key);
  if (existing) {
    detach(cache, existing);
    pushFront(cache, existing);
    return;
  }

  const node: LruNode = { key, prev: null, next: null };
  cache.map.set(key, node);
  pushFront(cache, node);

  if (cache.map.size > cache.capacity && cache.tail) {
    cache.map.delete(cache.tail.key);
    detach(cache, cache.tail);
  }
}

/** Keys in MRU → LRU order (walk from head). */
export function lruKeys(cache: LruCache): string[] {
  const keys: string[] = [];
  let node = cache.head;
  while (node) {
    keys.push(node.key);
    node = node.next;
  }
  return keys;
}
