/**
 * Test quality contract.
 *
 * A test that cannot fail is worse than no test: it spends CI time
 * manufacturing confidence. A 2026-07 audit found 45+ assertions that could
 * never fail for a reason distinct from render() throwing —
 * `expect(document.body).toBeTruthy()` (document.body always exists in
 * jsdom), `expect(container).toBeTruthy()` (RTL's render container is always
 * an element), and `.toBeTruthy()` on MotionValue wrapper objects (truthy
 * regardless of numeric payload; even 0 passes). All were fixed; this
 * contract makes the classes un-commitable:
 *
 *   1. A repo-wide sweep bans always-true assertion receivers in every test
 *      file, present and future.
 *   2. The shared framer-motion mock's fidelity is verified END-TO-END here
 *      through the real `framer-motion` import — the original inline mock
 *      silently froze useTransform at creation for months, and because
 *      nothing tested the mock, nothing could catch it. If the mock ever
 *      regresses to frozen/non-clamping behavior, this fails.
 *   3. Local per-file `vi.mock('framer-motion')` declarations are pinned to
 *      a documented registry: a local mock silently opts its whole file out
 *      of the shared mock's fidelity (exactly how a style assertion
 *      silently couldn't work in hero-coverage.test.tsx), so adding one is
 *      a decision on record, not a default.
 *   4. Rendered-text queries (getByText/getAllByText/etc.) may not use a
 *      wildcard (`.*`/`.+`) regex — a mutant that changes what's between the
 *      anchors, or a query that matches unrelated concatenated content, can
 *      still satisfy it. Prefer an exact string or a precise boundary regex.
 */
import React from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { motion, useMotionValue, useTransform } from 'framer-motion';

import { SectionHandoff } from '@/components/ui/SectionTransitions';
import { LOW_HARDWARE_CORES_THRESHOLD, LOW_HARDWARE_MEMORY_GB_THRESHOLD } from '@/hooks/usePerformanceProfile';

const SRC = resolve(process.cwd(), 'src');

function listTestFiles(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.test\.(ts|tsx)$/.test(entry.name)) files.push(full);
    }
  };
  walk(SRC);
  return files;
}

describe('test-quality-contract — no assertion that cannot fail', () => {
  it('no test asserts on always-truthy receivers', () => {
    // Each pattern's receiver is truthy in every jsdom test run regardless
    // of application behavior, so any matcher attached to it is decorative.
    // RTL's `container` from render() is always an element — a nullable DOM
    // lookup must use a different name (see remaining-lines.test.tsx's
    // profileContainer for the convention).
    const bannedPatterns: Array<{ pattern: RegExp; hint: string }> = [
      { pattern: /expect\(document\.body\)/, hint: 'document.body always exists — assert container.firstChild or real content instead' },
      { pattern: /expect\(document\.documentElement\)/, hint: 'documentElement always exists' },
      { pattern: /expect\(document\)\.toBe(Truthy|Defined)/, hint: 'document always exists' },
      { pattern: /expect\(window\)\.toBe(Truthy|Defined)/, hint: 'window always exists' },
      { pattern: /expect\(container\)\.toBe(Truthy|Defined)\(\)/, hint: "RTL's container is always an element — assert container.firstChild or real content" },
    ];

    const offenders: string[] = [];
    // This file necessarily spells the banned patterns out; skip self.
    const self = join(SRC, 'test-quality-contract.test.tsx');

    for (const file of listTestFiles()) {
      if (file === self) continue;
      const text = readFileSync(file, 'utf8');
      for (const { pattern, hint } of bannedPatterns) {
        if (pattern.test(text)) {
          offenders.push(`  ${file.replace(`${SRC}/`, 'src/')} — ${pattern} (${hint})`);
        }
      }
    }

    expect(offenders, `always-true assertion(s) — these can never fail:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('no rendered-text query uses a wildcard regex that any content could satisfy', () => {
    // getByText/getAllByText/etc. assert on what the USER actually sees. A
    // regex like /expires in 3 months.*renew soon/ passes as long as SOME
    // text sits between the two anchors — a mutant that renders the wrong
    // number, or drops the connecting content entirely and concatenates two
    // unrelated fragments, can still satisfy it. Found 2026-07 in this
    // repo's own reactive-status test; fixed to an exact string. Static
    // SOURCE-TEXT sweeps (contract tests that scan .ts/.tsx source for a
    // coding convention, e.g. animation-regression-contract.test.ts) are a
    // different category — not in scope here, since they're testing code
    // shape, not rendered output, and already have their own review history.
    const RTL_TEXT_QUERY_RE =
      /\b(?:get|getAll|query|queryAll|find|findAll)ByText\(\s*(\/(?:[^/\\\n]|\\.)*\/[a-z]*)/g;
    const WILDCARD_RE = /(?<!\\)\.[*+]/; // an un-escaped `.*` or `.+` inside the regex source

    const offenders: string[] = [];
    for (const file of listTestFiles()) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(RTL_TEXT_QUERY_RE)) {
        const regexSource = match[1];
        if (WILDCARD_RE.test(regexSource)) {
          const line = text.slice(0, match.index).split('\n').length;
          offenders.push(
            `  ${file.replace(`${SRC}/`, 'src/')}:${line} — ${regexSource} (use an exact string, or split into two precise assertions)`,
          );
        }
      }
    }

    expect(
      offenders,
      `wildcard regex(es) in a rendered-text query — these pass regardless of what's between the anchors:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('local framer-motion mocks are a documented decision, not a default', () => {
    // A file-local vi.mock('framer-motion') replaces the shared interpolating
    // mock for that entire file — motion-math and style assertions silently
    // stop working there. Every declaration must be registered here with the
    // reason it exists. Prefer the shared mock for new files.
    const LOCAL_FRAMER_MOCKS: Record<string, string> = {
      'src/app/pages-coverage.test.tsx': 'pre-dates the shared mock; bespoke shim tailored to whole-page renders',
      'src/components/hero-coverage.test.tsx': 'captures useMotionValue instances in call order to assert which value a mousemove wrote — needs its own factory',
      'src/components/particles-and-engines-coverage.test.tsx': 'pre-dates the shared mock; canvas-focused shim',
      'src/components/sections-coverage.test.tsx': 'pre-dates the shared mock; bespoke shim for section-level branch coverage',
      'src/components/ui/TextReveal.coverage.test.tsx': 'pre-dates the shared mock; minimal shim for reveal-state branches',
    };

    // Skip self: this file MENTIONS the declaration string (registry docs,
    // failure hints) without ever declaring a mock.
    const self = join(SRC, 'test-quality-contract.test.tsx');
    const declaring = listTestFiles()
      .filter((file) => file !== self && readFileSync(file, 'utf8').includes("vi.mock('framer-motion'"))
      .map((file) => file.replace(`${resolve(process.cwd())}/`, ''));

    const unregistered = declaring.filter((file) => !(file in LOCAL_FRAMER_MOCKS));
    expect(
      unregistered,
      `unregistered local framer-motion mock(s) — prefer the shared vitest.setup.ts mock; if a local one is genuinely needed, add a reasoned LOCAL_FRAMER_MOCKS entry:\n${unregistered.join('\n')}`,
    ).toEqual([]);

    // Self-cleaning: registry entries must still be doing work.
    for (const registered of Object.keys(LOCAL_FRAMER_MOCKS)) {
      expect(declaring, `LOCAL_FRAMER_MOCKS["${registered}"] no longer declares a local mock — delete the entry`).toContain(
        registered,
      );
    }
  });
});

describe('test-quality-contract — the shared motion mock stays faithful', () => {
  it('vitest.setup.ts builds its mock from the unit-tested motion-mock module', () => {
    const setup = readFileSync(resolve(process.cwd(), 'vitest.setup.ts'), 'utf8');
    expect(setup).toContain("from './src/test-utils/motion-mock'");
  });

  it('the default test environment reports hardware above the low-hardware thresholds', () => {
    // Regression: jsdom mirrors the REAL host's navigator.hardwareConcurrency
    // (unlike matchMedia, which vitest.setup.ts fully mocks), so this value is
    // deterministic per-machine but not across machines. A >4-core dev box
    // and a CI runner with fewer cores computed different performance tiers
    // for the exact same test, and section-transitions.test.tsx passed
    // locally while rendering nothing (an empty tree) in CI. vitest.setup.ts
    // now pins both navigator properties globally so every test gets the
    // same 'full'-tier default regardless of the host it runs on.
    expect(navigator.hardwareConcurrency).toBeGreaterThan(LOW_HARDWARE_CORES_THRESHOLD);
    expect((navigator as Navigator & { deviceMemory?: number }).deviceMemory).toBeGreaterThan(
      LOW_HARDWARE_MEMORY_GB_THRESHOLD,
    );
  });

  it('a tier-gated component renders under the default test environment (end-to-end pin)', () => {
    // Exercises the real usePerformanceProfile hook (no per-test mock) through
    // a real tier-gated component, reproducing the exact CI failure this
    // guards: SectionHandoff returns null outside 'full'/'balanced'.
    render(<SectionHandoff label="Projects" cue="transition cue" index={0} targetId="projects" />);
    expect(screen.getByRole('link', { name: /projects/i })).toBeTruthy();
  });

  it('useTransform range form interpolates LIVE input — never a frozen snapshot', () => {
    // The exact regression this guards: the pre-2026-07 inline mock returned
    // outputRange[0] forever, making motion-math assertions unwritable.
    const input = useMotionValue(0);
    const output = useTransform(input, [0, 1], [10, -10]);

    expect(output.get()).toBe(10);
    input.set(0.5);
    expect(output.get()).toBe(0);
    input.set(0.9);
    expect(output.get()).toBeCloseTo(-8);
  });

  it('useTransform clamps outside the input range, matching framer defaults', () => {
    const input = useMotionValue(0);
    const output = useTransform(input, [0, 1], [10, -10]);

    input.set(-100);
    expect(output.get()).toBe(10);
    input.set(100);
    expect(output.get()).toBe(-10);
  });

  it('useTransform function form re-runs its callback on every read', () => {
    const a = useMotionValue(1);
    const b = useMotionValue(2);
    const sum = useTransform([a, b], ([va, vb]: number[]) => va + vb);

    expect(sum.get()).toBe(3);
    a.set(40);
    expect(sum.get()).toBe(42);
  });

  it('style-bound motion values land in the DOM as live numbers', () => {
    const opacity = useMotionValue(0.34);
    const { container } = render(React.createElement(motion.div, { style: { opacity } }));

    // Real framer writes computed numbers to the DOM; the mock must match,
    // or component tests can only ever see "[object Object]".
    expect((container.firstChild as HTMLElement).style.opacity).toBe('0.34');
  });
});
