import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * RSC boundary contract (ENGINEERING-STANDARDS §5).
 *
 * The home page was migrated to a React Server Components / islands shape
 * (2026-07): `page.tsx` is a Server Component that ships zero client JS of its
 * own; all client orchestration lives in the `PageChrome` island; and static
 * display sections render as Server Components that never hydrate. Education
 * alone leaving the client bundle removed ~18KB of JS AND its ~535 DOM nodes
 * from react-dom's hydration pass — the first proven crack in the hydration
 * floor that gates this app's load-time score.
 *
 * Re-adding `'use client'` to any of these silently re-inflates the bundle and
 * re-hydrates the subtree — invisible in review, expensive on a real phone. So
 * lock the boundary: `page.tsx` and every converted section stay Server
 * Components; `PageChrome` stays the client island. Adding a NEW server section
 * (the whole point — the other display sections should follow) means appending
 * to SERVER_COMPONENTS here, never removing from it.
 */
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const hasUseClient = (rel: string) => /^\s*['"]use client['"]/m.test(read(rel));

// Files that MUST stay Server Components (no 'use client'): the page shell and
// every display section converted off the hydration path. Grow this list as
// more sections migrate; never shrink it without a measured reason.
const SERVER_COMPONENTS = [
  'src/app/page.tsx',
  'src/components/Education.tsx',
  'src/components/Footer.tsx',
  'src/components/Certifications.tsx',
];

// The client island that holds the page's orchestration — this one MUST be a
// client component, or the overlays/interaction it owns would break.
const CLIENT_ISLAND = 'src/components/ui/PageChrome.tsx';

describe('rsc-boundary-contract — the page stays a Server Component shell', () => {
  it.each(SERVER_COMPONENTS)('%s is a Server Component (no "use client")', (rel) => {
    // Guard the guard (§6 item 8): the file must exist, or hasUseClient would
    // throw rather than the assertion catching a real regression.
    expect(() => read(rel), `${rel} must exist`).not.toThrow();
    expect(
      hasUseClient(rel),
      `${rel} must stay a Server Component — a 'use client' here re-hydrates its subtree and re-inflates the client bundle (§5, RSC migration).`,
    ).toBe(false);
  });

  it('PageChrome is the client orchestration island', () => {
    expect(hasUseClient(CLIENT_ISLAND), `${CLIENT_ISLAND} must be a client component`).toBe(true);
  });

  it('page.tsx renders the PageChrome island and does not itself import client-only hooks', () => {
    const page = read('src/app/page.tsx');
    expect(page).toContain('PageChrome');
    // A Server Component cannot use these — their presence means the RSC
    // boundary regressed (page.tsx became client again).
    for (const clientOnly of ['useState', 'useEffect', 'useScroll', 'usePerformanceProfile']) {
      expect(page.includes(clientOnly), `page.tsx must not use the client-only ${clientOnly}`).toBe(false);
    }
  });
});
