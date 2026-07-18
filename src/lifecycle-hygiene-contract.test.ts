/**
 * Lifecycle hygiene contract.
 *
 * Every timer, listener, and observer a component creates must die with the
 * component. A leaked setTimeout fires against destroyed instances (the
 * 2026-07 find: SmoothScroll queued zero-delay re-syncs that could call
 * scrollTo on a destroyed Lenis after unmount); a leaked listener keeps the
 * whole closure tree alive; a leaked observer keeps firing forever. None of
 * this shows up in tests — components mount once and the suite exits — so it
 * rots invisibly, exactly the class of drift the freshness contracts exist
 * to catch.
 *
 * File-level balance heuristics over every production source, present and
 * future. Heuristics can have legitimate exceptions (e.g. an
 * AbortController-based cleanup needs zero removeEventListener calls) —
 * those go in ALLOWED_LIFECYCLE_EXCEPTIONS with a reason.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(process.cwd(), 'src');

/** "relative/path.tsx::rule" → reason */
const ALLOWED_LIFECYCLE_EXCEPTIONS: Record<string, string> = {};

function listProductionSources(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) files.push(full);
    }
  };
  walk(SRC);
  return files;
}

function count(src: string, pattern: RegExp): number {
  return (src.match(pattern) ?? []).length;
}

function sweep(rule: string, check: (src: string) => string | null): string[] {
  const hits: string[] = [];
  for (const file of listProductionSources()) {
    const rel = file.replace(`${resolve(process.cwd())}/`, '');
    if (`${rel}::${rule}` in ALLOWED_LIFECYCLE_EXCEPTIONS) continue;
    const problem = check(readFileSync(file, 'utf8'));
    if (problem) hits.push(`  ${rel} — ${problem}`);
  }
  return hits;
}

describe('lifecycle-hygiene-contract — everything created gets cleaned up', () => {
  it('every file that sets timers also clears them', () => {
    const hits = sweep('timers', (src) => {
      const sets = count(src, /\bset(Timeout|Interval)\(/g);
      const clears = count(src, /\bclear(Timeout|Interval)\(/g);
      return sets > 0 && clears === 0 ? `${sets} timer(s) set, none cleared` : null;
    });
    expect(
      hits,
      `file(s) set timers without any clear — track the id and clear it in the effect cleanup:\n${hits.join('\n')}`,
    ).toEqual([]);
  });

  it('every file balances addEventListener with removeEventListener', () => {
    const hits = sweep('listeners', (src) => {
      const adds = count(src, /\baddEventListener\(/g);
      const removes = count(src, /\bremoveEventListener\(/g);
      return adds !== removes ? `${adds} add vs ${removes} remove` : null;
    });
    expect(
      hits,
      `unbalanced listener(s) — every subscription needs a matching removal in cleanup (or a reasoned exception for AbortController patterns):\n${hits.join('\n')}`,
    ).toEqual([]);
  });

  it('every file that requests an animation frame also cancels it', () => {
    // Unlike listeners, a self-recursive step-function loop
    // (`function step() { ...; id = requestAnimationFrame(step); }`) calls
    // requestAnimationFrame from multiple source positions (the initial kick
    // and the recursive re-schedule) but only ever needs ONE
    // cancelAnimationFrame to break the whole chain — an exact count-balance
    // check would false-positive on every one of this repo's existing
    // canvas/physics loops (CursorComet, RibbonBand, SkillWeb,
    // InteractiveParticles all legitimately have more request call sites than
    // cancel call sites). A presence check — at least one cancel exists at
    // all — still catches the real regression class (a new RAF loop that
    // forgets cleanup entirely runs forever against a destroyed component).
    const hits = sweep('raf', (src) => {
      const requests = count(src, /\brequestAnimationFrame\(/g);
      const cancels = count(src, /\bcancelAnimationFrame\(/g);
      return requests > 0 && cancels === 0 ? `${requests} requestAnimationFrame call(s), none cancelled` : null;
    });
    expect(
      hits,
      `file(s) request animation frames without ever cancelling — track the id and cancel it in the effect cleanup:\n${hits.join('\n')}`,
    ).toEqual([]);
  });

  it('every file that constructs an observer also disconnects or unobserves', () => {
    const hits = sweep('observers', (src) => {
      const created = count(src, /\bnew (IntersectionObserver|ResizeObserver|MutationObserver)\(/g);
      const cleaned = count(src, /\.(disconnect|unobserve)\(/g);
      return created > 0 && cleaned === 0 ? `${created} observer(s) created, none cleaned up` : null;
    });
    expect(hits, `observer(s) without cleanup:\n${hits.join('\n')}`).toEqual([]);
  });

  it('every ALLOWED_LIFECYCLE_EXCEPTIONS entry has a real reason', () => {
    for (const [key, reason] of Object.entries(ALLOWED_LIFECYCLE_EXCEPTIONS)) {
      expect(reason.length, `ALLOWED_LIFECYCLE_EXCEPTIONS["${key}"] needs a real reason`).toBeGreaterThan(10);
    }
  });
});
