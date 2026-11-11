import { preload } from 'react-dom';

// Route-scoped font preloads. The root layout declares the display font
// (Newsreader, 58KB for the Latin subset) with `preload: false`, because
// next/font attaches a layout's preloads to every route under it: all six
// routes once spent 64KB of high-priority bandwidth on accent fonts that only
// the home page painted above the fold (measured 2026-10-03 with
// FontFace.status after load, no scroll). Routes that do paint the display
// font first hint it here instead.
//
// Newsreader ships three unicode-range files for `subsets: ['latin']`; the one
// named below is the Latin range (U+0000-00FF…), the only one English text
// triggers. Preloading either of the other two would fetch a file no glyph on
// the page asks for.
//
// These are the files next/font emits for `preload: false`. It names a
// preloadable file `<hash>-s.p.<hash>.woff2` and a non-preloadable one
// `<hash>-s.<hash>.woff2`, so a second, preloading declaration of the same
// font would fetch a second copy rather than warm the one the CSS uses.
// The names are content hashes. A font or next/font update changes them, and
// `scripts/checks/performance-budgets.mjs` then fails the build with the
// replacement names, because a preload pointing at a missing file is a wasted
// request.
export const DISPLAY_FONT_FILE = '/_next/static/media/75cb990346c55dc4-s.40bho2kviej2o.woff2';

// Each list names what that route paints in its first viewport. Keep these in
// step with ROUTES_PAINTING_ACCENT_FONTS in performance-budgets.mjs, which
// rejects an accent-font preload on any route it doesn't list.
export const HOME_FONT_PRELOADS = [DISPLAY_FONT_FILE] as const;
export const NURSING_FONT_PRELOADS = [DISPLAY_FONT_FILE] as const;
// Capstone, credentials and online-features each open on a display-serif h1.
export const SUBPAGE_FONT_PRELOADS = [DISPLAY_FONT_FILE] as const;

export function preloadFontFiles(hrefs: readonly string[]): void {
  for (const href of hrefs) {
    // Fonts are always fetched in CORS mode; a preload without crossOrigin
    // misses the cache entry the @font-face request looks for.
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: '' });
  }
}
