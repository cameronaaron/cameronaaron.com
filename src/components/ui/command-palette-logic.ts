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

/** Social keys rendered as "open" commands, in display order. */
const SOCIAL_COMMANDS: readonly { key: keyof SocialLinks; label: string }[] = [
  { key: 'github', label: 'GitHub' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'spotify', label: 'Spotify' },
  { key: 'appleMusic', label: 'Apple Music' },
];

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

/**
 * Subsequence match: every character of `query` appears in `text` in order
 * (the classic fuzzy-finder feel). O(text length) — bounded per command.
 */
export function isSubsequence(query: string, text: string): boolean {
  if (query.length === 0) return true;
  let q = 0;
  for (let t = 0; t < text.length && q < query.length; t += 1) {
    if (text[t] === query[q]) q += 1;
  }
  return q === query.length;
}

/** A command matches if the query is a subsequence of its label or keywords. */
export function commandMatchesQuery(command: Command, loweredQuery: string): boolean {
  return (
    isSubsequence(loweredQuery, command.label.toLowerCase()) ||
    isSubsequence(loweredQuery, command.keywords)
  );
}

/**
 * Filter the catalog by query in a single pass (no map().filter()). Empty
 * query returns the same array reference — zero allocation for the open state.
 * Bounded by catalog size, and runs on keystroke, never per frame.
 */
export function filterCommands(catalog: Command[], query: string): Command[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return catalog;

  const matches: Command[] = [];
  for (const command of catalog) {
    if (commandMatchesQuery(command, trimmed)) matches.push(command);
  }
  return matches;
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
