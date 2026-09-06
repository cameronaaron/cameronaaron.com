# CLAUDE.md — Cameron Aaron's Portfolio Site

> **Read `ENGINEERING-STANDARDS.md` before any performance, algorithm,
> data-structure, or mobile work.** It is the authoritative rulebook. It opens
> with **§0, the first-principles doctrine** — reason from ground truth
> (measurement, physics, bytes on the wire) not convention; treat "impossible"
> as an unmeasured claim; apply the SpaceX loop *in order* (question the
> requirement → delete → simplify → accelerate → automate); pursue the
> theoretical-best algorithm/structure, and ship a novel approach **only** when
> a measurement shows it beats the incumbent — deleting and *recording* the ones
> that don't. **§0.5 is not optional reading before touching any perf number:**
> validate the ruler before trusting it. A stray `next dev` on port 3000 made
> local Lighthouse audit the DEV build twice, producing false data that got a
> genuinely-good optimization reverted; `serve-out-warmed.mjs` now *refuses* to
> measure an occupied port or a non-production response, and a contract pins
> both guards. If a local number disagrees sharply with PageSpeed Insights,
> audit the instrument before theorizing about the site. §1–§9 are the
> conclusions that method produced: the complexity
> doctrine (per-event/per-render work is O(1); linear work runs exactly once),
> the full algorithm/data-structure law, the React render-path law, the
> mobile-first law, the regression ratchet, and the shipped-artifact law
> (§9 — verify every claim against `/out` and the wire, never against the
> source that was supposed to produce it; §9.4's watched-levers registry is
> where every measured rejection or upstream block records its reopen
> condition and watcher, so parked optimizations resurface instead of
> fossilizing into lore). Every rule there is enforced by
> a contract test — when one fails, fix the source, not the test.

## Commands

```bash
npm run dev          # dev server → http://localhost:3000
npm run build        # production static export to /out
npm test             # Vitest (all tests must pass before committing)
npm run type-check   # tsc --noEmit
npm run lint         # ESLint (--max-warnings=0) + markdownlint — warnings are failures
npm run test:mutation  # Stryker mutation testing, full repo — manual sweep tool (see ENGINEERING-STANDARDS.md §6.13)
```

Mutation testing itself is **no longer manual-only**: `pnpm run test:mutation:changed`
(scoped to whichever changed files match the logic-module convention —
`*-logic.ts`/`*-engine.ts`/`*-builders.ts` — the qualified, directory-prefixed
form §8.1 requires repo-wide since 2026-07 — not every changed `.ts(x)`
file — see ENGINEERING-STANDARDS.md §6 item 13 for why) runs inside the
pre-commit/pre-push gate below. `pnpm run test:mutation` (the unscoped,
full-repo command above, which does cover component files too) stays a
manual tool for periodic whole-codebase sweeps.

## Commits

Small, single-topic commits — one logical change each, readable from
`git log --oneline` without opening diffs. Subject: imperative, ≤72 chars,
says *what*; body says *why*. An optimization + its contract test + its docs
are **one** commit (the ratchet rule); unrelated changes are separate commits.
Every commit passes `npm test`, `npm run type-check`, and `npm run lint`.
See ENGINEERING-STANDARDS.md §6, ratchet item 12.

Hook gate (simple-git-hooks): **pre-commit runs the full gate, and pre-push
runs that same gate as a strict prefix plus more** — lockfile sync, a
gitleaks staged-diff scan, type-check, zero-warning lint, the entire test
suite (every contract, including networked freshness checks), and mutation
testing scoped to whichever changed files are logic modules (fails the
commit if a changed logic module's mutation score drops below the threshold
in `stryker.config.mjs`). A red gate blocks the commit itself. Pre-push runs
the same gate **plus a full-history gitleaks scan, a production build, and
`scripts/checks/performance-budgets.mjs`** (the build+budgets step was added
2026-07-23 after the RSC migration's HTML growth sat unflagged for five days
— pushes auto-deploy, so the artifact-level budgets must gate the push, not
just the manual `deploy:prod` path; the gitleaks steps were added 2026-08
after real PII — academic transcripts with student ID numbers, a personal
phone number — was found in git history predating this gate, requiring a
`git filter-repo` rewrite plus a GitHub Support ticket to purge cached PR
diffs before the repo could go public. `scripts/checks/gitleaks-scan.mjs`
wraps the `gitleaks` CLI — `security:leaks:staged` for the fast pre-commit
pass, `security:leaks:history` for the full-history pre-push pass — pinned by
`standards-enforcement-contract.test.ts`). CI runs a third, independent
gitleaks pass via `gitleaks/gitleaks-action` on every push and PR — the same
defense-in-depth rationale as the local/CI split everywhere else in this
gate. GitHub-hosted CI is **enabled** (re-enabled 2026-08 when
the repo went public — Actions minutes are free for public repos, so the
2026-07 cost concern that disabled it no longer applies; `.github/workflows/ci.yml`
runs on every push to `master` and every pull request, in addition to the
local hooks). Push after every commit (or at least before ending a session)
anyway so work is backed up and CI gets a chance to run as a second,
independent check.
`pnpm run test:complexity` is a fast, offline, manually-run subset for quick
iteration — it is not the commit gate.

## Session-end ritual (ENGINEERING-STANDARDS.md §6 item 21)

Before ending a session that touched code or made a real decision, two
checks — same commit discipline as the ratchet rule, not a follow-up:

1. **Every new component or feature ships with its test in the same
   commit.** No "add tests later." (§6 item 10's checklist; already
   backstopped by `dead-logic-export-contract` and
   `module-testability-contract`, which fail on an untested logic module
   regardless of anyone remembering to check.)
2. **Non-obvious wisdom gets written down, not just enacted.** A measurement
   that contradicted the initial guess, a rejected approach and why it lost,
   a framework behavior that silently diverged from its docs, a decision
   with a reopen condition — if a future session hitting the same wall would
   want to have read it first, it belongs in `ENGINEERING-STANDARDS.md` (a
   reusable pattern/law) or here in `CLAUDE.md` (a project fact). A parked
   optimization or measured rejection specifically goes in §9.4's
   watched-levers registry, with its reopen condition and watcher, not loose
   prose. Routine work doesn't need a new paragraph — restating an
   already-covered rule is itself a §0 violation (a claim with no new ground
   truth behind it).
3. **A manually-found defect becomes a repo-wide sweep for its class, same
   commit** (§6 item 22) — fix + pin for the instance is not enough; the
   commit gate, not a future human audit, must find the next instance.
   Prove the new sweep can fail (inject a violation, watch it fire, revert)
   before trusting it.

## Stack

- **Next.js 16** App Router, `output: 'export'` (static), deployed on **Cloudflare Pages**
- **React 19**, **TypeScript 6**, **Tailwind CSS v4**, **Framer Motion 12**
- **Lenis** smooth scroll (desktop only — disabled on touch devices)
- **Vitest 4** + **Testing Library** — 900+ tests, all must pass

## Architecture

### Performance tier system

Every animation and effect decision is gated on `usePerformanceProfile()`:

| Tier | Trigger | What works |
| ------ | --------- | ------------ |
| `full` | Desktop fine-pointer, high-spec | All effects: particles, cursor trail, Lenis, ambient animation, parallax |
| `balanced` | Touch / coarse pointer (mobile) | Static ambient orbs, basic scroll animations, NO particles, NO Lenis, NO cursor trail |
| `lite` | Low hardware (≤4 cores / ≤4 GB) or save-data | Minimal motion only |
| `reduced` | `prefers-reduced-motion` | Near-static |

**Key properties returned by `usePerformanceProfile`:**

- `shouldRenderParticles` — `true` only on `'full'`
- `shouldRenderAmbientEffects` — `true` on `'full'` and `'balanced'`
- `shouldRenderHeavyEffects` / `shouldRenderCursorTrail` — `true` only on `'full'`

### Modularization contract

Every non-trivial component ships with a companion `<component>-logic.ts` containing all pure functions — sorting, math, animation config, etc. This is **enforced by contract tests** in `src/modularization-contract.test.ts`. Never inline logic that belongs in the extracted module.

Pattern: `Component.tsx` imports from `./hero-logic` (or `./card-logic`, `./featured-logic`, etc.) — the qualified, directory-prefixed name, never a bare `./logic`/`./engine`/`./builders` (ENGINEERING-STANDARDS.md §8.1: a bare name is ambiguous the instant it's seen outside its own folder — a search result, an open editor tab, a stack trace).

### Component layout

```text
src/
  app/          # Next.js App Router pages + layout
  components/
    ui/          # Reusable primitives (Button, SpotlightCard, SmoothScroll…)
    hero/        # Hero section + sub-components
    experience/  # ExperienceCard + card-logic + experience-logic
    projects/    # ProjectCard, FeaturedProject + projects-logic/card-logic/featured-logic
    contact/     # SocialLink, SocialPlatformIcon + contact-logic
    …            # One directory per section, qualified *-logic.ts extracted alongside
  data/          # Static data files (experience.ts, profile.ts, projects.ts…)
  hooks/         # usePerformanceProfile, useInteractionMode, use3DTilt…
```

## Test structure

```text
src/repo-hygiene-contract.test.ts      # root-file whitelist, path conventions
src/complexity-doctrine-contract.test.ts     # O(1) doctrine sweeps (incl. frame-alloc, effect-deps, nested-scan ASTs) + production-dependency ledger + gate wiring
src/modularization-contract.test.ts    # logic extraction enforced per component
src/performance-regression-contract.test.ts  # Lighthouse score thresholds
src/public-asset-weight-contract.test.ts     # weight budgets + modern image formats (avif required on the render path)
src/dead-logic-export-contract.test.ts       # every exported logic fn has a production caller
src/dead-dependency-contract.test.ts         # every package.json dep has a real import/require somewhere
src/config-integrity-contract.test.ts        # pins the gates' own config (strict, 100%, export, Node major)
src/docs-quality-contract.test.ts            # zero markdownlint violations, lint wiring
src/docs-cross-reference-contract.test.ts    # every §N/§6-item/constraint #N ref resolves
src/naming-and-organization-contract.test.ts # filename casing per directory, no lazy exported names
src/lifecycle-hygiene-contract.test.ts       # timers/listeners/observers all cleaned up
src/test-quality-contract.test.tsx           # no always-true assertions; motion-mock fidelity; local-mock registry
src/external-links-contract.test.ts          # every external URL in src/data is ledger-verified live, not dead
src/headers-integrity-contract.test.ts       # security+caching headers pinned, preload targets exist
src/components/animation-regression-contract.test.ts  # animation anti-patterns
src/components/mobile-regression-contract.test.tsx    # mobile tap targets, safe areas
src/app/section-reveal-bfcache.test.ts  # bfcache blank-screen regression
src/app/rsc-boundary-contract.test.ts   # page.tsx + converted sections stay Server Components
src/hooks/use-performance-profile.test.tsx  # tier derivation, reactive updates
src/components/ui/ui-coverage-hardening.test.tsx  # AmbientBackground, SmoothScroll…
src/data/data-complete.test.ts         # data completeness + LACCD/CHEM 051/Dean's Honor assertions
src/components/education-ordering.test.tsx  # education card order + pulse indicator contract
src/components/section-ordering-contract.test.tsx  # experience/projects render newest-first
src/ssr-hydration-contract.test.ts     # no browser-API useState lazy initializers (React #418)
src/coverage-provider-contract.test.ts # istanbul strict gate + V8 second-opinion provider pinned
src/standards-enforcement-contract.test.ts  # docs cite real enforcers; contracts documented; §9.4 registry complete; artifact gate on pre-push
```

Run a focused subset: `npx vitest run src/components/animation-regression-contract.test.ts`

## Critical constraints

### 1. IntroCurtain must be a static import

```ts
// ✅ correct
import IntroCurtain from '@/components/ui/IntroCurtain';

// ❌ wrong — causes a flash where the page renders without the curtain, then it appears
const IntroCurtain = dynamic(() => import('@/components/ui/IntroCurtain'), { ssr: false });
```

### 2. Never add root-level files without updating the hygiene contract

`src/repo-hygiene-contract.test.ts` has an explicit allow-list (`EXPECTED_ROOT_FILES`). Adding a root file without updating that list causes CI to fail.

### 3. ExperienceCard must not have its own `whileInView` on the root

The parent `Experience.tsx` drives entry animation via a variant stagger. If `ExperienceCard`'s `SpotlightCard` also has `initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}`, both start at `opacity: 0` and the card appears blank until the race resolves — usually never in headless environments. Let the parent stagger handle entry; the card's `whileHover` and `animate` (for active state) are fine.

### 4. AmbientBackground animated orbs: `'full'` tier only

```ts
// ✅ correct
const animateOrbs = performanceTier === 'full';

// ❌ wrong — mobile gets 4 Framer Motion orbs with repeat:Infinity → lag
const animateOrbs = performanceTier === 'full' || performanceTier === 'balanced';
```

### 5. Lenis disabled on touch devices

iOS and Android have native momentum scrolling. Lenis with `touchMultiplier: 2` fights it and creates visible jank. `SmoothScroll.tsx` returns early when `window.matchMedia('(pointer: coarse)').matches` is `true`.

### 6. Hooks must not be called inside JSX

```tsx
// ❌ wrong — breaks Rules of Hooks
style={{ y: useTransform(scrollYProgress, [0, 1], [100, -50]) }}

// ✅ correct — extract to a named const in the function body
const backgroundY = useTransform(scrollYProgress, [0, 1], [100, -50]);
// ...
style={{ y: backgroundY }}
```

### 7. Education grid is 4-column (xl) / 2-column (sm) — not 3-column

`Education.tsx` uses `sm:grid-cols-2 xl:grid-cols-4` because there are now **4** education items (LACCD, Elmbridge M.Ed., Elmbridge Certificate, Connecticut College). If the count changes, update the grid class accordingly. Contract tests assert the sorted order: LACCD first (`Sep 2025 - Dec 2026`), then Elmbridge M.Ed. (`May 2023 - Jun 2026`).

### 8. In-progress prerequisite courses show a pulsing cyan dot

`Education.tsx` calls `isNonFinalizedCourseStatus(course.status)` to conditionally render an `.animate-ping` span in the status cell of the desktop prereq table. Contract tests in `education-ordering.test.tsx` assert that in-progress rows have this dot and completed rows do not. The same `animate-ping` pattern is used in `Certifications.tsx` for in-progress certification cards.

### 9. Education `verificationLinks[0]` is the institution link — not a pill

`Education.tsx` renders `verificationLinks[0].url` as the clickable institution name and shows `verificationLinks.slice(1)` as pill links. This means:

- `verificationLinks[0]` **must always be the institution's main website** (e.g. `laccd.edu`, `conncoll.edu`)
- Credential/verification links go at index 1+
- Violating this causes the institution name to link to the wrong place and that same link to appear twice (once as the institution name, once as a pill)

### 10. `usePerformanceProfile` initial state must be `false` — not a lazy browser-API reader

```ts
// ✅ correct — initial state matches SSR (window/navigator undefined at build time)
const [isCoarsePointer, setIsCoarsePointer] = useState(false);
const [saveDataEnabled, setSaveDataEnabled] = useState(false);
const [lowHardware, setLowHardware] = useState(false);
// Real values set in useEffect after hydration completes

// ❌ wrong — causes React #418 hydration error on mobile
const [isCoarsePointer, setIsCoarsePointer] = useState(() => window.matchMedia('(pointer: coarse)').matches);
```

The site is a static export. HTML is built with `window === undefined`, so all tier flags default to `false` → `performanceTier = 'full'`. On mobile, a lazy `useState` initializer reads `matchMedia` immediately during the first client render — before hydration — returning `true`, making `performanceTier = 'balanced'`. The HTML has e.g. 7 ambient orbs; the client wants to render 4. React throws #418 and re-renders the entire root from scratch.

Fix: `useState(false)` always. `useEffect` syncs the real values after hydration. There's a brief flash from 'full' to 'balanced' on mobile but no hydration error.

### 11. Hero mobile layout: image must come before text

The image column uses `order-1 md:order-2` and the text column uses `order-2 md:order-1` so that on mobile the profile photo appears above the name/title, above the fold.

### 12. backdrop-filter is disabled globally on touch devices

`globals.css` zeroes `backdrop-filter` inside `@media (hover: none), (pointer: coarse)` — it's the biggest scroll-jank source on mobile GPUs. Use `backdrop-blur-*` utilities freely; the global rule handles mobile. Never remove that block; a mobile exception must be deliberate and scoped.

### 13. List items driven by a parent "active" selection must be memoized

`ExperienceCard` is `export default memo(ExperienceCard)` and receives a `useCallback`-stable `onActivate` (it passes its own `index` back). An inline `onActivate={() => ...}` closure defeats the memo and makes every hover/tap re-render all cards. Apply the same pattern to any new selectable list. Per-item state (hover, image error) stays inside the item component.

### 14. Collection builds in client components are always memoized

Every `buildXxx`/`sortXxx` call in a `'use client'` component body is wrapped in `useMemo` (Testimonials, Experience, Projects, Education, Certifications, Contact, ExperienceCard). New components follow suit from day one; the contract test greps for bare calls. Server components are exempt (they run once at build).

### 15. No transformed descendants inside `bg-clip-text` elements

A motion element whose transform updates continuously (e.g. the section-title velocity skew) never settles at exact identity, so Chrome promotes it to its own compositing layer — and `bg-clip-text` on an ancestor cannot paint the gradient into that layer. The text is `text-transparent`, so it renders **invisible**. This shipped once as fully transparent section titles (fixed 2026-07). Rule: apply persistent transforms on an ancestor **wrapping** the gradient-clipped element, never on a descendant inside it. Transient transforms that clean up to `none` are fine.

### 16. Hydration-only hero content must reserve its layout slot

`LocalTimeStatus` (the live "· 2:34 PM in LA" clock in the hero availability
pill) renders only on the client — the server can't bake in a wall-clock time.
It used to return `null` during SSR and the first client paint, then inject the
time text after hydration. That injection wrapped the pill to a second line and
pushed the name, tagline, and CTA row (the mobile **LCP** element) down — a
measured **~0.09 CLS**, the whole mobile CLS budget. Fix (2026-07): always
render the slot, showing a fixed-width `12:30 PM in LA` placeholder at
`visibility:hidden` until the real clock mounts, so the pill wraps identically
in SSR and after hydration (measured CLS ~0.001). Rule: any hero/above-the-fold
element whose content only exists after hydration must reserve its final
dimensions in the SSR output — never grow into place. Pinned by
`command-and-status.test.tsx` (SSR-markup reserves the slot) and the ratcheted
`cumulative-layout-shift ≤ 0.05` LHCI assertion.

### 17. Below-the-fold sections use `content-visibility` (`.cv-section`), not code-splitting

`SectionReveal` adds `.cv-section` (`content-visibility: auto` +
`contain-intrinsic-size: auto 1200px`, in globals.css) to every section except
the hero (index 0). This lets the browser skip layout/paint of the seven
off-screen sections during load — the initial styleLayout pass dropped from
~2.26s to ~1.66s (simulated 4x-CPU). It is **DOM-preserving** (SEO-safe) and
does **not** touch the request graph, which is why it works where code-splitting
does not: `dynamic()`-splitting sections was measured (2026-07) to *hurt*
Lighthouse, and a re-test confirmed **Next/Turbopack force-modulepreloads every
reachable chunk into the initial wave** — so no import-level deferral can pull
JS out of the *download* graph (LCP). Keep `.cv-section` off the hero (it holds
the LCP and must always paint).

**LazyMotion is the exception, and it's shipped (2026-07):** the site renders
via `m` under a `LazyMotion` provider (`MotionProvider`) that loads the DOM
feature pack (`domMax`) as an async chunk. Force-preload means the feature
bytes still *download* early (no LCP win — this is why an earlier LazyMotion
attempt was reverted when judged on LCP with contaminated measurements), but it
does NOT force the feature code to *evaluate* on the hydration-critical path:
that parse/compile/execute is deferred until `LazyMotion` resolves its dynamic
import after mount. Measured against clean `/out`: framer's bootup dropped
~1.4s → ~0.8s and total scriptEvaluation ~940ms → ~760ms (simulated 4x-CPU),
which is a TBT/main-thread win, not an LCP one. `strict` mode makes any stray
`motion.*` throw, so new components must use `m.*`.

## Data

Site content lives in `src/data/`:

| File | Content |
| ------ | --------- |
| `profile.ts` | Name, title, tagline, stats, social links |
| `experience.ts` | Work history (sorted newest-first per company) |
| `projects.ts` | Portfolio projects |
| `certifications.ts` | Certs with verification URLs |
| `education.ts` | Degrees + prerequisite coursework (4 items; LACCD sorts first as most recent); `honorsAndAffiliations` is `HonorItem[]` (`{ label: string; url?: string }`) not `string[]` |
| `testimonials.ts` | LinkedIn recommendations |
| `site.ts` | `SITE_URL` + `getPageUrl(path)` — the **only** place `https://cameronaaron.com` may be hardcoded; every other file imports from here (enforced by a repo-wide sweep in `modularization-contract.test.ts`) |
| `metadata.ts` | Root `<head>` metadata — `buildRootMetadata()` / `buildRootViewport()`, plus the `SEO_KEYWORDS` catalog, consumed by `src/app/layout.tsx`. Sub-pages (`capstone`, `credentials`, `internet`) each have their own co-located `./metadata.ts` with a `build*Metadata(pageUrl)` function |

Every external URL referenced from `src/data` is tracked in a generated ledger — `scripts/checks/external-links-ledger.json` (do not hand-edit; refresh with `pnpm run check:links` after adding or changing any external URL). `src/external-links-contract.test.ts` fails the commit if the ledger shows a dead link, is missing an entry, has an orphaned entry, or has drifted stale (45+ days unverified).

## Quick reference patterns

**Client components with Framer Motion:** every animated component needs `'use client'` and `viewport={{ once: true }}` (omitting it re-triggers the animation on every scroll into view):

```tsx
'use client';
import { motion } from 'framer-motion';

export default function Section() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
```

**Staggered lists:** index-based delay, not a fixed duration: `transition={{ delay: i * 0.1 }}`.

**Image handling:** `.avif` only for render-path images (measured 16–55% smaller than webp at equal quality; enforced by the asset-weight contract), referenced with a leading slash (`/images/profile-hero.avif`), via Next's `<Image>` with explicit `width`/`height`. Hero image gets `priority`; everything else lazy-loads by default.

**Path alias:** `@/*` maps to `src/*` for all internal imports.

**Adding a new section:** create `src/data/newsection.ts` → create
`src/components/NewSection.tsx` → import in `src/app/page.tsx` → add a nav
entry in `Navigation.tsx`'s `navItems` if it needs one. **Default to a Server
Component (no `'use client'`)** unless the section genuinely needs hooks/event
handlers — `page.tsx` is itself a Server Component (ENGINEERING-STANDARDS §5,
RSC islands, 2026-07), so a server section costs nothing to add and never
hydrates; a `'use client'` section is the exception, made deliberately, not the
default. If it needs one small interactive slice (a filter, a selection), keep
the surrounding display content server and extract only that slice as its own
client island, following `Education.tsx`'s conversion as the template.

## SEO architecture

`src/components/StructuredData.tsx` auto-generates Schema.org JSON-LD from data files — editing a data file updates structured data with no manual schema edits:

| Schema type | Data source | Impact |
| --- | --- | --- |
| Person, ProfilePage | `profile.ts` | Google Knowledge Panel |
| FAQPage | `faqs.ts` | Expandable FAQ snippets in search |
| Review (×4) | `testimonials.ts` | 5-star rating display |
| ItemList (Projects) | `projects.ts` | Software app carousel |
| ItemList (WorkExperience) | `experience.ts` | Job history cards |

Root `<head>` metadata (OpenGraph `type: "profile"`, the `SEO_KEYWORDS` catalog, Twitter `summary_large_image` cards) lives in `src/data/metadata.ts`, not `layout.tsx` — moved there per the module-level-data-catalog sweep (ENGINEERING-STANDARDS.md §6 item 7). `src/app/sitemap.ts` and `src/app/robots.ts` both need `export const dynamic = 'force-static'` for the static export.

## Accessibility & security headers

WCAG 2.1 AA: keyboard navigation, screen-reader compatibility, skip-to-content link, proper heading hierarchy, visible focus states, `prefers-reduced-motion` support — enforced by `wcag-contract.test.tsx` and `a11y-regressions.test.tsx`.

All security/caching headers live in `public/_headers` (there is no `middleware.ts` — this is a static export with no server runtime), pinned by `src/headers-integrity-contract.test.ts`: HSTS with preload, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, COOP/COEP, a restrictive `Permissions-Policy`. No `Content-Security-Policy` header is currently set — don't assume one exists. Static assets cache for 1 year immutable; HTML uses `must-revalidate`.

## Common pitfalls

- Missing `'use client'` — Framer Motion components crash without it.
- Forgetting `viewport={{ once: true }}` — animations re-trigger on every scroll.
- Image path without a leading slash — must be `/images/x.avif`, not `x.avif`.
- Gradient text missing `text-transparent` — the gradient won't show without it (and never nest a persistently-transformed element inside a `bg-clip-text` ancestor — constraint #15).
- Static export can't use Next.js features needing a Node.js runtime (API routes, ISR, etc.).
- Missing ARIA labels — every section needs `aria-label` or `aria-labelledby`.

## Algorithm and data-structure standards

These patterns are enforced by `src/components/algorithm-and-datastructure-contract.test.tsx`. Fix the **source**, not the test, when a check fails.

### Single-pass over map+filter

Never `.map(transform).filter(alive)` — it allocates a full intermediate array. Use a `for` loop with conditional `push()`; in per-frame code, go further and compact in place with zero allocation (ENGINEERING-STANDARDS §2.8):

```ts
// ✅ single-pass, zero-allocation — stepBursts (per-frame code)
let write = 0;
for (const burst of bursts) {
  // ...mutate burst in place
  if (alive(burst)) {
    bursts[write] = burst;
    write += 1;
  }
}
bursts.length = write; // truncate the dead tail
return bursts;

// ✅ single-pass — acceptable for run-once code
const result: T[] = [];
for (const item of items) {
  const next = transform(item);
  if (alive(next)) result.push(next);
}
return result;
```

### Early-exit over build-then-slice

When collecting up to `maxN` items, break as soon as the limit is hit rather than building the full collection and calling `.slice()`:

```ts
// ✅ labeled break — buildConnections (count tracks pooled slots in use)
outer: for (let i = 0; i < particles.length; i++) {
  for (let j = i + 1; j < particles.length; j++) {
    if (count >= maxConnections) break outer;
    // ...write into the pooled slot
  }
}
```

### Map over Array.find for label lookups

Build a `Map` once with `useMemo`; use `map.get(key)` (O(1)) instead of `array.find(…)` (O(n)) on every render:

```ts
// ✅ Navigation.tsx
const navLabelMap = useMemo(() => buildNavLabelMap(navItems), []);
const activeNavLabel = navLabelMap.get(activeHref) ?? 'Home';

// ❌ wrong — O(n) scan on every render
const activeNavLabel = getActiveNavLabel(navItems, activeHref);
```

### Dispatch tables over if-chains

Replace sequential `if/else if` branches with a module-level `Record<Key, Fn>` dispatch table. The key is looked up once (O(1)); the branch logic lives in the value function:

```ts
// ✅ testimonials/testimonials-logic.ts
const RELATIONSHIP_MATCHERS: Record<NonAllFilter, (rel: string) => boolean> = {
  manager: (rel) => rel.includes('manager'),
  mentor:  (rel) => rel.includes('mentor') || rel.includes('professor'),
  colleague: (rel) => rel.includes('colleague'),
};
export function filterTestimonialsByRelationship(items, filter) {
  if (filter === 'all') return items; // early-return avoids new-array allocation
  return items.filter((t) => RELATIONSHIP_MATCHERS[filter](t.relationship.toLowerCase()));
}
```

### Bypass React state for high-frequency pointer/scroll events

Don't drive a `useState` from `mousemove`-rate events when the value only feeds animation — every state update re-renders the whole subtree even though most consumers just want smooth motion. Write straight into a Framer Motion `useMotionValue` from the event handler instead; `useTransform`/`useSpring` consumers update without React ever re-rendering:

```ts
// ✅ Hero.tsx / use3DTilt.ts / ProfileImage.tsx
const rawPointerX = useMotionValue(0);
useEffect(() => {
  const handlePointerMove = (event: MouseEvent) => rawPointerX.set(event.clientX);
  window.addEventListener('mousemove', handlePointerMove, { passive: true });
  return () => window.removeEventListener('mousemove', handlePointerMove);
}, [rawPointerX]);

// ❌ wrong — re-renders the whole tree on every mousemove just to feed a motion value
const [x, setX] = useState(0);
// ...setX(e.clientX) on mousemove, then useEffect(() => rawPointerX.set(x), [x])
```

When you genuinely need the value in React state (e.g. to conditionally render), use the functional updater form and return `prev` unchanged to skip a re-render:

```ts
// ✅ pattern for cases where state is actually required
setValue((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
```

### Named constants for physics and hardware thresholds

Never inline magic numbers in logic. Export named constants so they are self-documenting and testable:

```ts
// ✅ usePerformanceProfile.ts
export const LOW_HARDWARE_CORES_THRESHOLD = 4;
export const LOW_HARDWARE_MEMORY_GB_THRESHOLD = 4;
export const DEFAULT_HARDWARE_CONCURRENCY = 8;
export const DEFAULT_DEVICE_MEMORY_GB = 8;

// ✅ interactive-particles-engine.ts
export const POINTER_ATTRACT_RADIUS = 22;
export const POINTER_ATTRACT_RADIUS_SQ = POINTER_ATTRACT_RADIUS * POINTER_ATTRACT_RADIUS;
export const ATTRACTION_STRENGTH_FULL = 0.012;
export const ATTRACTION_STRENGTH_BALANCED = 0.008;
```

## Deployment

**Pushing to `master` on GitHub auto-deploys the live site** — Cloudflare Pages
has its own native git integration watching this repo, separate from GitHub
Actions CI (disabled) and separate from the manual command below. No deploy
step is needed after a normal push; it goes live within Cloudflare's usual
build time (a minute or two). Confirmed 2026-07 by checking live response
headers: static assets return `cf-cache-status: HIT` with headers matching
`public/_headers` exactly, meaning Cloudflare Pages serves the site directly.
`wrangler.toml`'s `main = "src/index.js"` Worker is **not** in the live
request path for the main domain's pages/assets (it may back some other
route, e.g. the `workshop.cameronaaron.com` redirect, but changes to it are
not visible on cameronaaron.com without a separate `wrangler deploy`).

```bash
npm run deploy:prod   # manual path: builds → runs Lighthouse CI → wrangler pages deploy
```

Use `deploy:prod` only to force a manual deploy or test that specific path —
not as part of normal day-to-day pushes, which already auto-deploy.

Static site lives in `/out` after `npm run build`. Cloudflare Pages serves it directly. There is no server-side rendering after the build step.

Lighthouse thresholds: accessibility/best-practices/SEO stay at **1.0** on both form factors; the performance category is **0.85 desktop / 0.45 mobile**, with `numberOfRuns: 3` in both configs (enforced by `lighthouserc.json`, `lighthouserc.mobile.json`, and `src/performance-regression-contract.test.ts`). The asymmetric performance floor is root-caused, not guessed (2026-07): local Lighthouse desktop runs score `speed-index` at 700–950ms (~1.0), but CI's shared runners render the identical build's Speed Index at 2100–2400ms — a headless-Chrome rendering-speed limit, not an app regression. Desktop's scoring curve punishes that value far harder than mobile's (the same ~2130ms scores 0.56 on desktop vs 0.99 on mobile), which is why desktop needs the lower floor. Mobile's own floor was recalibrated 2026-08-09 from a stale 0.80 (see `performance-regression-contract.test.ts`'s inline history) after CI's month-long outage meant it was never validated against real runner capacity — three fresh CI runs measured 0.53–0.59, ruled out as an app regression via a local framer-motion v12-vs-v13 A/B test. `numberOfRuns: 3` has LHCI take the median run instead of a single sample. See `ENGINEERING-STANDARDS.md` §4.7 for prior history (including a measured-and-rejected code-splitting experiment) and for a known local-vs-CI Lighthouse false positive (`bf-cache`) — trust CI's numbers over a local `npm run test:performance:*` run.

**Mobile LCP is a Lantern simulation artifact, not a real regression (2026-07).**
Median mobile perf sits at ~0.89, gated almost entirely by a *simulated* LCP of
~3.76s (score ~0.55) while every other metric is ~1.0 (CLS 0.001, TBT <40ms, FCP
1.36s, SI 2.5s). Under **applied** throttling (`--throttling-method=devtools`,
real 4x-CPU + slow-4G) the same build's LCP is **1.9s (score 0.98) / perf 0.95**,
and the raw observed LCP is ~0.1–0.4s. The gap is structural to Lantern: its LCP
estimate blends an optimistic value (≈FCP, CSS-blocked only) with a pessimistic
one that sums the download+execute of **all async JS in the initial wave** — here
react-dom (~220KB) + framer-motion (~325KB across two chunks). Because
Next/Turbopack force-modulepreloads every chunk into that first wave (verified
via both an overlay-deferral test and the LazyMotion/`m` migration, both of
which left the pre-LCP *bytes* and the LCP score unchanged), **no import-level
deferral, code-split, or LazyMotion split can move the LCP number** — only
cutting total initial JS (i.e. removing framer-motion, a product decision)
would.

**Correction (2026-07):** the "~0.89 median mobile" premise above was a
measurement artifact — a stray `next dev` on port 3000 meant local Lighthouse
audited the DEV build, not `/out` (the §4.7 item 8 pitfall, recurred). Real PSI
on a Moto G Power scores **~52**, gated by TBT ~4.6s, not LCP — the load cost is
hydration (framer + react-dom bundle *evaluation* over a 3,266-element DOM), a
different problem than the LCP artifact this section describes. LazyMotion,
reverted here on LCP grounds, was later **re-shipped**: it doesn't move LCP
(bytes still preload) but defers framer feature *evaluation* off the critical
path, cutting scriptEvaluation ~20% — a TBT win. See the §8-adjacent perf notes
and MotionProvider. Do not
re-attempt JS deferral for mobile LCP; it has been measured to not work in this
setup. The curtain, fonts, and initial layout were each individually ruled out
as the gate.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
