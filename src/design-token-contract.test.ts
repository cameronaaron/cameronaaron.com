/**
 * Design-token contract (2026-11 "Daylight" redesign).
 *
 * The site was repainted from a dark theme to a light one by replacing every
 * hard-coded palette utility (`text-white`, `border-white/10`, `bg-black/30`,
 * `text-cyan-300`…) with a semantic token (`text-foreground`,
 * `border-foreground/10`, `bg-surface`, `text-primary`). That only stays true
 * if nobody writes `text-white` again: on a light page it is invisible text,
 * and nothing else in the gate would notice.
 *
 * Two properties are pinned here:
 *   1. production source uses semantic colour tokens, not raw palette names;
 *   2. the tokens themselves keep WCAG AA contrast against the surfaces they
 *      are set on — so a future palette tweak cannot quietly make body text,
 *      status text, or the highlighter illegible.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildRootViewport } from '@/data/metadata';

const ROOT = resolve(process.cwd());
const SRC = join(ROOT, 'src');

function listProductionSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listProductionSources(full, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

const UTILITY = '(?:text|bg|border(?:-[trblxy])?|ring(?:-offset)?|from|via|to|shadow|outline|divide|fill|stroke|decoration|accent|caret)';

/** Theme-inverting names: on a light page these are wrong by construction. */
const INVERTING = new RegExp(`(?<![\\w-])${UTILITY}-(?:white|black)(?![\\w-])`, 'g');

/** Raw Tailwind hue ramps. Allowed only where a file needs a colour that is not a role. */
const RAW_HUE = new RegExp(
  `(?<![\\w-])${UTILITY}-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}(?![\\w-])`,
  'g',
);

/** Files that legitimately need a colour with no semantic role, and why (§6 item 18). */
const RAW_HUE_ALLOWED: Record<string, string> = {
  'src/data/contact.ts': 'Each social platform keeps its own brand gradient on a 36px icon tile — a brand colour is not a site role.',
  'src/components/projects/uds-decoder/uds-decoder-logic.ts': 'Categorical: violet distinguishes a fourth diagnostic-frame field after primary/success/warning are used.',
  'src/components/projects/small-world/small-world-logic.ts': 'Categorical: violet marks shortcut edges in the network diagram, distinct from the primary-coloured lattice.',
  'src/components/projects/reaction-game/ReactionTimeGame.tsx': 'Categorical: fuchsia marks the personal-best readout apart from the current and average times.',
};

describe('design-token-contract — colours are roles, not paint names', () => {
  const files = listProductionSources(SRC);

  it('no production file uses a white/black utility (invisible or inverted on a light page)', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const hits = readFileSync(file, 'utf8').match(INVERTING);
      if (hits) offenders.push(`  ${relative(ROOT, file)}: ${[...new Set(hits)].join(', ')}`);
    }
    // Guard the guard (§6 item 8): the sweep must be reading real files, and
    // the pattern must be able to fire.
    expect(files.length).toBeGreaterThan(80);
    expect('class="text-white hover:bg-black/40 md:border-t-white/10"'.match(INVERTING)).toEqual([
      'text-white',
      'bg-black',
      'border-t-white',
    ]);
    expect('bg-white-ish text-whitewash nav-text-white'.match(INVERTING)).toBeNull();
    expect(
      offenders,
      `use text-foreground / bg-surface / border-foreground/N (or *-primary-foreground on a filled accent):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('raw hue ramps appear only in files with a recorded, non-role reason', () => {
    const offenders: string[] = [];
    const used = new Set<string>();
    for (const file of files) {
      const rel = relative(ROOT, file);
      const hits = readFileSync(file, 'utf8').match(RAW_HUE);
      if (!hits) continue;
      if (rel in RAW_HUE_ALLOWED) used.add(rel);
      else offenders.push(`  ${rel}: ${[...new Set(hits)].join(', ')}`);
    }
    expect('text-cyan-300 bg-emerald-500/10 from-amber-400'.match(RAW_HUE)).toHaveLength(3);
    expect(
      offenders,
      `use a semantic token (primary / success / warning / danger / muted) or add a reasoned RAW_HUE_ALLOWED entry:\n${offenders.join('\n')}`,
    ).toEqual([]);
    // Self-cleaning: an allowlist entry whose file no longer needs it must go.
    expect(Object.keys(RAW_HUE_ALLOWED).filter((rel) => !used.has(rel)), 'stale RAW_HUE_ALLOWED entries').toEqual([]);
  });
});

describe('design-token-contract — the palette keeps WCAG AA contrast', () => {
  const css = readFileSync(join(SRC, 'app', 'globals.css'), 'utf8');
  const theme = css.slice(css.indexOf('@theme {'), css.indexOf('}', css.indexOf('@theme {')));

  const token = (name: string): string => {
    const value = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})\\s*;`, 'i').exec(theme)?.[1];
    if (!value) throw new Error(`--color-${name} is not a 6-digit hex in the @theme block`);
    return value;
  };

  /** WCAG 2.x relative luminance of a #rrggbb colour. */
  const luminance = (hex: string): number => {
    const channel = (offset: number) => {
      const srgb = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  };

  const contrast = (a: string, b: string): number => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  };

  it('the contrast maths matches the WCAG reference values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(contrast('#ffffff', '#ffffff')).toBe(1);
  });

  it.each([
    ['foreground', 'background'],
    ['foreground', 'surface'],
    ['foreground', 'muted'],
    ['muted-foreground', 'background'],
    ['muted-foreground', 'surface'],
    ['muted-foreground', 'muted'],
    ['primary', 'background'],
    ['primary', 'surface'],
    ['success', 'background'],
    ['success', 'surface'],
    ['warning', 'background'],
    ['warning', 'surface'],
    ['danger', 'background'],
    ['danger', 'surface'],
    ['primary-foreground', 'primary'],
    ['secondary-foreground', 'secondary'],
    ['accent-foreground', 'accent'],
  ])('%s on %s is at least 4.5:1', (text, surface) => {
    expect(contrast(token(text), token(surface))).toBeGreaterThanOrEqual(4.5);
  });

  it('the page is declared light, so form controls and scrollbars match it', () => {
    expect(css).toMatch(/color-scheme:\s*light;/);
    expect(css).not.toMatch(/color-scheme:\s*dark;/);
  });

  it('browser chrome and the installed-app splash use the page paper, not a second colour', () => {
    // Three places repeat the background outside CSS: the viewport theme
    // colour, the PWA manifest, and the declared colour scheme. Each was still
    // the old dark theme's value after the stylesheet changed, because nothing
    // tied them to it. They are derived from the token here so they cannot
    // drift again.
    const paper = token('background');
    const viewport = buildRootViewport();
    const manifest = JSON.parse(readFileSync(join(ROOT, 'public', 'manifest.json'), 'utf8')) as {
      background_color: string;
      theme_color: string;
    };

    expect(viewport.themeColor.map((entry) => entry.color)).toEqual([paper, paper]);
    expect(viewport.colorScheme).toBe('light');
    expect(manifest.background_color).toBe(paper);
    expect(manifest.theme_color).toBe(paper);
  });
});
