import { beforeEach, describe, expect, it, vi } from 'vitest';

const { preloadSpy, fontCalls } = vi.hoisted(() => ({
  preloadSpy: vi.fn(),
  fontCalls: new Map<string, Record<string, unknown>>(),
}));

vi.mock('react-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-dom')>()),
  preload: preloadSpy,
}));

vi.mock('next/font/google', () => {
  const record = (name: string) => (options: Record<string, unknown>) => {
    fontCalls.set(name, options);
    return { className: `mock-${name}`, variable: `mock-${name}` };
  };
  return {
    Manrope: record('Manrope'),
    Bricolage_Grotesque: record('Bricolage_Grotesque'),
    Geist_Mono: record('Geist_Mono'),
  };
});

import { DISPLAY_FONT_FILE, MONO_FONT_FILE, preloadFontFiles } from './font-preloads';
import Home from './page';
import NursingPage from './nursing/page';
import './layout';

const preloadedHrefs = () => preloadSpy.mock.calls.map(([href]) => href);

describe('route-scoped font preloads', () => {
  beforeEach(() => {
    preloadSpy.mockClear();
  });

  it('hints each file as a CORS woff2 font, matching how @font-face fetches it', () => {
    preloadFontFiles([DISPLAY_FONT_FILE, MONO_FONT_FILE]);

    expect(preloadSpy.mock.calls).toEqual([
      [DISPLAY_FONT_FILE, { as: 'font', type: 'font/woff2', crossOrigin: '' }],
      [MONO_FONT_FILE, { as: 'font', type: 'font/woff2', crossOrigin: '' }],
    ]);
  });

  it('points at the non-preload file names next/font emits, never the .p. variant', () => {
    for (const href of [DISPLAY_FONT_FILE, MONO_FONT_FILE]) {
      expect(href).toMatch(/^\/_next\/static\/media\/[0-9a-f]{16}-s\.[a-z0-9_-]+\.woff2$/);
      expect(href).not.toContain('-s.p.');
    }
  });

  it('keeps the layout from preloading accent fonts on every route', () => {
    expect(fontCalls.get('Bricolage_Grotesque')).toMatchObject({ preload: false });
    expect(fontCalls.get('Geist_Mono')).toMatchObject({ preload: false });
    // The body font paints on every route, so the layout keeps preloading it.
    expect(fontCalls.get('Manrope')).toMatchObject({ preload: true });
  });

  it('hints both accent fonts on the home page, whose hero paints them', () => {
    Home();
    expect(preloadedHrefs()).toEqual([DISPLAY_FONT_FILE, MONO_FONT_FILE]);
  });

  it('hints only the display font on the nursing tracker', () => {
    NursingPage();
    expect(preloadedHrefs()).toEqual([DISPLAY_FONT_FILE]);
  });
});
