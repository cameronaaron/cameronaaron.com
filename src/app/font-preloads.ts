import { preload } from 'react-dom';

// Route-scoped font preloads. The root layout declares Bricolage and Geist Mono
// with `preload: false`, because next/font attaches a layout's preloads to
// every route under it: all six routes were spending 64KB of high-priority
// bandwidth on two fonts that only the home page paints above the fold
// (measured 2026-10-03 with FontFace.status after load, no scroll). Routes that
// do paint them first hint them here instead.
//
// These are the files next/font emits for `preload: false`. It names a
// preloadable file `<hash>-s.p.<hash>.woff2` and a non-preloadable one
// `<hash>-s.<hash>.woff2`, so a second, preloading declaration of the same
// font would fetch a second copy rather than warm the one the CSS uses.
// The names are content hashes. A font or next/font update changes them, and
// `scripts/checks/performance-budgets.mjs` then fails the build with the
// replacement names, because a preload pointing at a missing file is a wasted
// request.
export const DISPLAY_FONT_FILE = '/_next/static/media/017d9bea37084d9b-s.41rroleoq1br7.woff2';
export const MONO_FONT_FILE = '/_next/static/media/797e433ab948586e-s.0r6juujl39pe6.woff2';

// Each list names what that route paints in its first viewport. Keep these in
// step with ROUTES_PAINTING_ACCENT_FONTS in performance-budgets.mjs, which
// rejects an accent-font preload on any route it doesn't list.
export const HOME_FONT_PRELOADS = [DISPLAY_FONT_FILE, MONO_FONT_FILE] as const;
export const NURSING_FONT_PRELOADS = [DISPLAY_FONT_FILE] as const;

export function preloadFontFiles(hrefs: readonly string[]): void {
  for (const href of hrefs) {
    // Fonts are always fetched in CORS mode; a preload without crossOrigin
    // misses the cache entry the @font-face request looks for.
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: '' });
  }
}
