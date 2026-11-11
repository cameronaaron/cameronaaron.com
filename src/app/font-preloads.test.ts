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
    Atkinson_Hyperlegible_Next: record('Atkinson_Hyperlegible_Next'),
    Newsreader: record('Newsreader'),
  };
});

import { DISPLAY_FONT_FILE, preloadFontFiles } from './font-preloads';
import Home from './page';
import NursingPage from './nursing/page';
import CapstonePage from './capstone/page';
import CredentialsPage from './credentials/page';
import InternetPage from './internet/page';
import './layout';

const preloadedHrefs = () => preloadSpy.mock.calls.map(([href]) => href);

describe('route-scoped font preloads', () => {
  beforeEach(() => {
    preloadSpy.mockClear();
  });

  it('hints each file as a CORS woff2 font, matching how @font-face fetches it', () => {
    preloadFontFiles([DISPLAY_FONT_FILE, '/_next/static/media/second.woff2']);

    expect(preloadSpy.mock.calls).toEqual([
      [DISPLAY_FONT_FILE, { as: 'font', type: 'font/woff2', crossOrigin: '' }],
      ['/_next/static/media/second.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' }],
    ]);
  });

  it('points at the non-preload file name next/font emits, never the .p. variant', () => {
    expect(DISPLAY_FONT_FILE).toMatch(/^\/_next\/static\/media\/[0-9a-f]{16}-s\.[a-z0-9_-]+\.woff2$/);
    expect(DISPLAY_FONT_FILE).not.toContain('-s.p.');
  });

  it('keeps the layout from preloading the display font on every route', () => {
    expect(fontCalls.get('Newsreader')).toMatchObject({ preload: false });
    // The body font paints on every route, so the layout keeps preloading it.
    expect(fontCalls.get('Atkinson_Hyperlegible_Next')).toMatchObject({ preload: true });
  });

  it('loads exactly two families — there is no separate monospace to fetch', () => {
    expect([...fontCalls.keys()].sort()).toEqual(['Atkinson_Hyperlegible_Next', 'Newsreader']);
  });

  it('hints the display font on the home page, whose hero name paints it', () => {
    Home();
    expect(preloadedHrefs()).toEqual([DISPLAY_FONT_FILE]);
  });

  it('hints only the display font on the nursing tracker', () => {
    NursingPage();
    expect(preloadedHrefs()).toEqual([DISPLAY_FONT_FILE]);
  });

  it.each([
    ['capstone', CapstonePage],
    ['credentials', CredentialsPage],
    ['internet', InternetPage],
  ])('hints the display font on /%s, which opens on a display-serif heading', (_route, Page) => {
    Page();
    expect(preloadedHrefs()).toEqual([DISPLAY_FONT_FILE]);
  });
});
