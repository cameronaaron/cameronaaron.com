# Engineering Standards — cameronaaron.com

This document is the permanent record of the performance and code-quality bar
for this codebase. **Every rule here is enforced by a contract test.** If a
rule matters and has no test, the first task is to write the test — a standard
that isn't executable is a suggestion.

> **Prime directive: when a contract test fails, fix the SOURCE, not the test.**
> The tests encode decisions that were made deliberately, usually after finding
> and fixing a real regression. Weakening a test to make code pass inverts the
> entire system.

Enforcing test files:

| Contract | File |
| --- | --- |
| Algorithms & data structures | `src/components/algorithm-and-datastructure-contract.test.tsx` |
| Runtime render behavior (Profiler-verified) | `src/components/render-behavior-contract.test.tsx` |
| Animation anti-patterns | `src/components/animation-regression-contract.test.tsx` |
| Mobile tap targets, safe areas | `src/components/mobile-regression-contract.test.tsx` |
| Logic extraction per component | `src/modularization-contract.test.ts` |
| Root files / path conventions | `src/repo-hygiene-contract.test.ts` |
| Lighthouse thresholds | `src/performance-regression-contract.test.ts` |
| bfcache blank-screen | `src/app/section-reveal-bfcache.test.ts` |

---

## 1. The complexity doctrine

"Everything O(1)" is not a coherent goal — sorting has an O(n log n) lower
bound, simulation must touch every particle, rendering n items produces n
elements. The actual standard, which **is** achievable and **is** enforced:

1. **Per-event work is O(1).** A mousemove, scroll tick, tap, or animation
   frame does constant work in React terms: zero re-renders, zero allocation,
   fixed draw-call counts.
2. **Per-render work is O(1) per changed thing.** Renders read precomputed
   fields and `Map.get()` lookups. No render path sorts, scans, filters, or
   parses.
3. **Linear and worse work runs exactly once.** Sorts, collection builds, and
   data derivation happen once (module scope, `useMemo` with `[]`, or build
   time) — never per render, never per comparison, never per event.
4. **Where linear-per-frame is inherent (particle engines), use the optimal
   structure** — spatial hash grid O(n·k) not brute force O(n²), typed arrays
   not object arrays, squared distances not sqrt.

When you cannot make something O(1), the required move is to state *why* (a
lower bound, an inherent property) in a comment, and make it run at the
minimal frequency possible.

---

## 2. Algorithms & data structures (contract sections 1–23)

### 2.1 Lookups: `Map` / `Set` / precomputed field — never a scan

```ts
// ✅ build once, O(1) per lookup
const navLabelMap = useMemo(() => buildNavLabelMap(navItems), []);
const label = navLabelMap.get(activeHref) ?? 'Home';

// ❌ O(n) scan per render
const label = navItems.find((i) => i.href === activeHref)?.name;
```

If a value is derivable from an item and consumed in a render path, **derive
it once and store it on the item** (decorate) rather than recomputing:

```ts
// ✅ sortPrerequisiteCourses attaches nonFinalized during the sort;
//    JSX reads `course.nonFinalized` — a boolean field
// ❌ JSX calling isNonFinalizedCourseStatus(course.status) per row per render
```

### 2.2 Dispatch tables over if-chains

Sequential `if/else if` branching on a known key is a linear scan of the
branches. Use a module-level `Record<Key, Fn>`:

```ts
const RELATIONSHIP_MATCHERS: Record<NonAllFilter, (rel: string) => boolean> = {
  manager: (rel) => rel.includes('manager'),
  mentor: (rel) => rel.includes('mentor') || rel.includes('professor'),
  colleague: (rel) => rel.includes('colleague'),
};
```

Early-return the identity case (`filter === 'all'` returns the same array
reference — zero allocation).

### 2.3 Single pass, never map-then-filter

`.map(f).filter(g)` allocates a full intermediate array and traverses twice.
Repo-wide contract bans it in production code. Use a `for` loop with
conditional `push`, or partition in one pass:

```ts
// ✅ one traversal splits featured/other
const featured: Project[] = [];
const other: Project[] = [];
for (const project of items) {
  (project.featured ? featured : other).push(project);
}
```

Two independent `.filter()` calls over the same array is the same smell — one
pass, two output arrays.

### 2.4 Early exit, never build-then-slice

When collecting up to N results, stop the moment you have N. Building the
full collection and calling `.slice(0, N)` does unbounded work for a bounded
answer:

```ts
// ✅ labeled break the instant the limit is hit
outer: for (const project of items) {
  for (const tag of project.tags) {
    if (seen.has(tag)) continue;
    seen.add(tag);
    signals.push(tag);
    if (signals.length >= limit) break outer;
  }
}
```

### 2.5 Decorate-sort-undecorate

A comparator runs O(n log n) times. Anything expensive (date parsing, token
scanning, string normalization) must be computed **once per item** before the
sort, compared as plain numbers inside it:

```ts
const decorated = items.map((item) => ({ item, key: getDateSortKey(getValue(item)) }));
decorated.sort((a, b) => b.key - a.key);
return decorated.map((entry) => entry.item);
```

The contract greps every production comparator for `getDateSortKey` and
`isNonFinalizedCourseStatus` calls — none may appear inside a `.sort()`.

### 2.6 Typed arrays and numeric IDs in per-frame code

Per-frame allocation is a GC pause waiting to happen.

- Spatial grid backing: `Int16Array` / `Uint8Array`, reset via `.fill(0)`
  (SIMD-accelerated), never per-cell writes.
- IDs derived per frame are integers (`a.id * 1000 + b.id`), never template
  literals — a string ID is an allocation per pair per frame.
- Compare squared distances; take `Math.sqrt` only after a pair has already
  passed the squared-radius check.
- Physics/hardware thresholds are **exported named constants**
  (`POINTER_ATTRACT_RADIUS_SQ`, `LOW_HARDWARE_CORES_THRESHOLD`), never inline
  magic numbers.

### 2.7 Canvas: batch by state, never per entity

Each `ctx.stroke()`/`ctx.fill()` is a driver round-trip. Group geometry by
paint state (opacity tier) and flush once per tier:

- BackgroundParticles: ≤2 strokes + exactly 3 fills per frame, regardless of
  particle count. Runtime-verified with a mocked context, not just grepped.
- Glow via pre-rendered radial-gradient sprites + `drawImage` — never
  `shadowBlur` (per-draw Gaussian blur) and never DOM `box-shadow`.
- DPR: cap at 2 (`Math.min(dpr, 2)`), fall back with `|| 1`, size with
  `Math.round(width * dpr)`, scale with `ctx.setTransform(dpr, ...)` — never
  `ctx.scale()` (multiplies cumulatively across resizes).

### 2.8 Zero-allocation frame loops (contract section 23)

A steady-state animation frame mutates persistent buffers and allocates
nothing. Both particle engines meet this contract:

- **Mutate in place, return the same array** — `stepParticles`, `stepBursts`,
  `advanceBackgroundParticle`, `applyMousePull`. Never `.map()` + object
  spread per frame (~300 short-lived objects/frame at 60 fps is pure GC
  pressure).
- **Compact in place** — expired entries slide left over dead slots and the
  tail is truncated (`bursts.length = write`), never a fresh filtered array.
- **Pool per-frame outputs** — `buildConnections(particles, dist, max, pool)`
  rewrites the fields of a caller-owned `Connection[]`; slots are allocated
  the first time they're needed and reused forever after.
- **Scratch buffers for per-frame derivations** — one `Uint8Array` for
  connection tiers (computed once per line, not once per tier pass), one
  reused object for `getParticlePulse(time, id, scratch)`.
- **Precompute paint state at module level** — `CONNECTION_TIER_STYLES` holds
  one `strokeStyle` string per tier; a template literal in the draw loop is an
  allocation per tier per frame.
- **Amortize event-path appends** — `appendBursts` trims via
  `copyWithin` + length truncation, replacing the old per-click
  `concat(...).slice(-max)` double allocation.

---

## 3. React render-path law

### 3.1 High-frequency events never touch React state

React state exists for values that change *what* is rendered. Values that
change at pointer/scroll rate and only feed animation go **around** React:

| Value | Channel |
| --- | --- |
| Pointer position → animation | `useMotionValue` + `.set()` in the handler |
| Spotlight/glow position | CSS custom property via `ref.style.setProperty` |
| Scroll progress | `useScroll` / motion values |
| Hover on/off (low frequency, changes rendering) | `useState` — this is fine |

The repo-wide contract greps every `mousemove` handler for `set[A-Z]…(`
state-setter calls. The render-behavior contract goes further and
Profiler-verifies: **a 50-event mousemove storm on SpotlightCard causes zero
child re-renders; InteractiveParticles animation frames cause zero commits.**

When state genuinely is required at event rate, bail out with the functional
updater: `setValue((prev) => unchanged ? prev : next)`.

### 3.2 Coalesce scroll/resize through rAF

One layout read per frame maximum. The pattern (Navigation):

```ts
let frameId = 0;
const scheduleUpdate = () => {
  if (frameId) return;                       // already scheduled this frame
  frameId = requestAnimationFrame(() => { frameId = 0; update(); });
};
window.addEventListener('scroll', scheduleUpdate, { passive: true });
```

Render-behavior contract: 20 scroll events → exactly one scheduled frame → at
most one commit on flush. Sub-threshold storms (BackToTop) commit **nothing**.

### 3.3 Every high-frequency listener is passive

`mousemove`, `scroll`, `touchmove`, `pointermove`, `wheel`, `resize`,
`mouseout`, `pageshow` — all registered with `{ passive: true }`, repo-wide,
enforced by sweep. A non-passive listener blocks compositor scrolling on
mobile.

### 3.4 Collection builds are memoized — no exceptions

Any `buildXxx()`/`sortXxx()` call in a client component body runs on every
render of that component. All of them are wrapped:

- `Testimonials` → `sortTestimonialsByDate`, `filterTestimonialsByRelationship`
- `Experience` → `sortExperiencesForTimeline`
- `Projects` → `buildProjectCollections`
- `Education` → `buildEducationCollections`
- `Certifications` → `buildCertificationCollections`
- `Contact` → `buildContactSocialLinks`
- `ExperienceCard` → `buildCompanyMonogram` (keyed on `experience.company`)

**When adding any new component that derives a collection: `useMemo` from day
one, and add a contract check.** Server components (no `'use client'`) are
exempt — they run once at build time in a static export.

### 3.5 Interaction cost is O(1) components, not O(n)

When one item in a list is "active" and activation is driven by hover/tap,
the item component must be `React.memo` and every callback prop must be
identity-stable (`useCallback`), so a selection change re-renders exactly the
gaining and losing items:

```tsx
// ExperienceCard.tsx
export default memo(ExperienceCard);

// Experience.tsx — stable identity; card receives its index back
const handleActivate = useCallback((index: number) => setActiveExperienceIndex(index), []);
```

An inline `onActivate={() => ...}` closure recreated per parent render
silently defeats `memo` — the contract greps for it.

Corollary: keep per-item state (hover, image error) **inside** the item
component (as ProjectCard does), so it never round-trips through the parent.

### 3.6 Rules of Hooks in JSX

Never call a hook inside a JSX expression (`style={{ y: useTransform(...) }}`).
Extract to a named const in the function body.

---

## 4. Mobile-first performance law

The mobile experience is not a degraded desktop experience — it is a
deliberately different rendering profile chosen per device capability.

### 4.1 The performance tier system is the single source of truth

Every effect decision flows through `usePerformanceProfile()`:

| Tier | Trigger | Gets |
| --- | --- | --- |
| `full` | fine pointer + capable hardware | everything: particles, cursor trail, Lenis, animated orbs, parallax |
| `balanced` | coarse pointer (phones/tablets) | static orbs, basic scroll reveals — NO particles, NO Lenis, NO cursor trail |
| `lite` | ≤4 cores / ≤4 GB / save-data | minimal motion |
| `reduced` | `prefers-reduced-motion` | near-static |

Never check `window.innerWidth` or invent an ad-hoc capability probe in a
component — consume the hook (`shouldRenderParticles`,
`shouldRenderAmbientEffects`, `shouldRenderHeavyEffects`,
`shouldRenderCursorTrail`, or `useInteractionMode().enableHoverMotion`).

### 4.2 Hydration safety (static export)

The HTML is built with `window === undefined`, so **all tier flags initialize
`useState(false)`** and sync in `useEffect` after hydration. A lazy
`useState(() => matchMedia(...).matches)` initializer reads the truth *before
hydration*, mismatches the server HTML, and throws React #418 on mobile —
which re-renders the entire root. A brief 'full'→'balanced' flash is the
accepted cost.

### 4.3 backdrop-filter is banned on touch devices

`backdrop-filter` forces the GPU to resample everything behind the element on
every frame — the single biggest scroll-jank source on mobile. `globals.css`
zeroes it globally inside `@media (hover: none), (pointer: coarse)`; the
translucent `bg-white/5`-style backgrounds carry the glass aesthetic alone.

- Adding a new frosted-glass element: just use the utility classes — the
  global rule handles mobile automatically.
- If a specific element genuinely needs frost on mobile, that is a deliberate
  exception: justify it, scope it, and expect to defend the frame cost.
- Same block keeps `background-attachment: scroll` (fixed attachment forces
  repaint-on-scroll on mobile).

### 4.4 Infinite animation budget on mobile: transform/opacity only, tiny surfaces

`repeat: Infinity` Framer Motion animations on large surfaces are why the
"orbs animate on `'full'` tier only" rule exists (`animateOrbs =
performanceTier === 'full'` — never `|| 'balanced'`). Small composited
indicators (`animate-ping` dots) are fine. Anything animating `box-shadow`,
`filter`, or layout properties on an infinite loop is banned everywhere.

### 4.5 Native scrolling is sacred on touch

- Lenis returns early when `(pointer: coarse)` matches — it fights iOS/Android
  momentum scrolling and loses.
- `touch-action: manipulation` on body (kills 300ms tap delay).
- `-webkit-tap-highlight-color: transparent` + `whileTap` feedback instead.
- Hover-only affordances must be gated: Tailwind v4's `hover:` variants are
  behind `@media (hover: hover)` automatically, but JS-driven hover
  (mouseenter handlers) must check `enableHoverMotion` — touch browsers
  emulate `mouseenter` on tap and never fire `mouseleave`, so ungated hover
  state **sticks**.

### 4.6 Mobile layout contract

- Tap targets ≥ 44px (`min-h-[44px]`) — enforced by mobile-regression contract.
- Safe areas honored: `env(safe-area-inset-*)` on body and bottom sheets
  (`pb-[env(safe-area-inset-bottom)]` on the mobile menu).
- Hero: image column `order-1 md:order-2` — photo above the name on mobile,
  above the fold.
- `-webkit-text-size-adjust: 100%` (no font inflation on rotate).
- Education grid tracks item count (`sm:grid-cols-2 xl:grid-cols-4` for 4 items).

### 4.7 Lighthouse floor

Accessibility, best-practices, and SEO are pinned to a hard 1.0 on **both**
desktop (`lighthouserc.json`) and mobile (`lighthouserc.mobile.json`).
Performance is 0.85 desktop / 0.95 mobile, `numberOfRuns: 3` on both — root-
caused, not guessed (see item 3 below): a real CI headless-rendering slowdown
that local runs don't reproduce, where the median absorbs a single unlucky
sample. Enforced by `performance-regression-contract.test.ts` (which asserts
the exact thresholds and run counts in both configs, not just their presence)
and by `deploy:prod`, which runs the full Lighthouse gate before every deploy.
A live `npx @lhci/cli autorun` against a clean local build (2026-07) measured
every category at a perfect 1.0/1.0/1.0/1.0 on both form factors — the 0.85
desktop floor exists purely to absorb CI's documented rendering variance, not
because the page itself falls short locally.
**The floor may only move down with owner sign-off backed by data — a flaky
gate means fix the page at the source first.**

History (2026-07, kept because the reasoning still applies):

1. Desktop started at 1.0 / 3 runs, dropped to 0.95 and then 0.90 while
   chasing a CI-runner median of 0.93 whose bottleneck alternated between
   speed-index and total-blocking-time. Along the way `numberOfRuns` went
   3→5→3 — the durable lesson: **more samples stabilize how reliably you
   measure a value; they never move the value itself.** A stable-but-low
   median is a page problem, not a sampling problem.
2. The speed-index side was then fixed at the source: `IntroCurtain`'s
   dismissal used to wait on React hydration before its 600ms hold even
   started, so on slow runner CPUs the full-screen curtain covered the
   viewport for seconds. It now fades out via a pure CSS animation baked into
   the server-rendered markup (`intro-curtain-exit` in `globals.css`), so
   visual completeness no longer depends on JS at all. Local desktop runs
   after the fix: 1.0 / 0.99 / 1.0 with SI 0.8-0.9s and TBT 0ms.
3. With the page fixed, the owner set both form factors to `minScore: 1` and
   `numberOfRuns: 1` (2026-07). If the gate flakes, treat it as a real
   signal: check which metric moved, fix the source, and only revisit the
   threshold/run-count with observed data — never as a reflex.
4. A code-splitting experiment (below-fold sections via `next/dynamic`) was
   measured and **rejected**: the extra chunk round-trip after hydration
   deepened the critical request graph (mobile simulated LCP 3.4s→3.8s, TTI
   3.6s→4.0s). The sections stay statically imported — see the comment in
   `src/app/page.tsx`.
5. A full audit of every open Lighthouse warning (2026-07) fixed three for
   real and root-caused the rest as not safely fixable from application code.

   **Fixed** — `dom-size`, `unused-javascript`, and `legacy-javascript` were
   bare `warn` pins (no ceiling, could regress silently forever). Three
   authoritative `npx @lhci/cli autorun` runs per form factor established a
   stable numeric baseline (desktop: dom-size 2689 elements, unused-js
   70–80ms/2 files, legacy-js 40ms/1 file; mobile: 2672 / 50ms/2 files /
   10ms/1 file), confirmed the LHR exposes a real `numericValue` for each
   (unlike the audits below), and each is now
   `["warn", {"maxNumericValue": …, "maxLength": …}]` with real headroom over
   the observed baseline in both `lighthouserc.json` and
   `lighthouserc.mobile.json`. Verified clean (all three drop out of LHCI's
   warning list entirely) on a fresh build, both form factors. A future
   regression that meaningfully worsens any of the three now fails the gate
   even though today's baseline stays non-blocking — real teeth, not just
   documentation.

   **Root-caused, not fixable from `src/`** — `legacy-javascript-insight`
   traces to Next.js's own `next/dist/build/polyfills/polyfill-module.js`:
   conditional guards like `Array.prototype.at||(Array.prototype.at=function
   (){…})` for `Array.at`/`flat`/`flatMap`/`Object.fromEntries`/
   `Object.hasOwn`/`String.trimEnd`, confirmed by grepping the exact polyfill
   source into the shipped chunk (`grep -rl` across `node_modules` matched
   only Next's own polyfill module — no third-party package). It's injected
   by Next's build pipeline itself, loaded via a normal (non-`nomodule`)
   async script, and not exposed through any `next.config.mjs` flag.

   `render-blocking-insight` / `render-blocking-resources` — three distinct
   fixes were attempted and measured, not one:
   1. *Critical-CSS extraction* (`beasties` postbuild, inlining an
      above-the-fold subset + preload+swap for the rest): desktop improved
      genuinely (speed-index 0.65→0.98, category 0.96→1.0), but mobile
      `cumulative-layout-shift` dropped from a perfect 1.0 to 0.75 — the
      deferred-stylesheet swap shifted an absolutely-positioned decorative
      hero glow div that beasties' static critical-CSS pass didn't detect as
      visible. CLS carries 25% of the category weight; render-blocking
      carries zero (Lighthouse v10+ scores performance from only
      FCP/LCP/TBT/CLS/Speed-Index — confirmed by reading the LHR's
      `auditRefs` weights directly). **Rejected.**
   2. *Full-file inlining* (no critical-path heuristic at all — replace both
      `<link rel="stylesheet">` tags with the complete, byte-identical CSS
      inline, provably CLS-safe since nothing is deferred or omitted):
      empirically measured against the homepage — 550KB raw / 70KB gzip vs
      the 470KB raw / 62KB gzip budget in `scripts/checks/performance-budgets.mjs`.
      The Tailwind utility stylesheet alone is 110KB raw. **Blows the
      static-asset budget.** Rejected without even needing a live LHCI run.
   3. *Preload without any inlining* (eliminate the audit by loading
      asynchronously with zero synchronous styling): reintroduces a flash of
      unstyled content on every page load — `font-display: swap` only covers
      the small font-face stylesheet, not the ~110KB Tailwind bundle that
      styles the entire page. Rejected on inspection; not worth measuring.

      `network-dependency-tree-insight` inherits the same root cause as
      render-blocking (the CSS request chain) and stays open for the same
      reason.

   All four (`legacy-javascript-insight`, `network-dependency-tree-insight`,
   `render-blocking-insight`, `render-blocking-resources`) stay bare `warn` —
   confirmed via the same three LHCI runs that none exposes a usable
   `numericValue` in the LHR, so no `maxNumericValue` ceiling is possible;
   they're pinned so a future preset change can't silently promote one to
   `error`. All are zero-weight and LHCI exits 0 on both form factors with
   these as the only remaining open items — verified fresh, not assumed. See
   `src/performance-regression-contract.test.ts`'s `expectStrictAssertions`
   for the exact per-audit assertions this history backs. Don't reattempt any
   of the three rejected CSS-delivery approaches without solving the
   underlying tension (avoiding FOUC requires *some* synchronous CSS; getting
   "which CSS" right for this hero section has broken twice).

**CI (`treosh/lighthouse-ci-action`) is the authoritative gate — local
`npm run test:performance:desktop`/`:mobile` can show extra noise the CI job
doesn't.** Those scripts invoke a floating `npx @lhci/cli@0.15.1`, which can
resolve a newer transitive Lighthouse core than whatever `treosh/lighthouse-ci-action`
bundles, expanding `lighthouse:recommended`'s default assertion set to include
newer "Insight" audits (`cls-culprits-insight`, `lcp-phases-insight`, etc.)
that don't compute a real score against a `wrangler pages dev` local preview
and fail as `NaN`. Also expect a **false-positive `bf-cache` failure** when
testing locally: `wrangler pages dev`'s own inspector/runtime bridge holds a
WebSocket open, and Chrome's back/forward-cache detector attributes that to
the page, not the dev server — `grep -rl "WebSocket" out/` on the actual build
output returns nothing, confirming the app itself does nothing to block
bfcache. If CI ever fails, trust CI's numbers over a local run showing this
noise; if CI *and* a real production Lighthouse run both show `bf-cache`
blocked, that's real and must be fixed at the source.

`forced-reflow-insight` is pinned to `warn` in both configs (2026-07): it is a
binary-scored diagnostic that flipped 0/1/0 across three otherwise-identical
local runs, attributes its ~35ms of reflow to `[unattributed]` (nothing
actionable), and does not feed the performance category — runs where it scored
0 still scored a perfect 100. It failed both CI form factors as an
assertion-only error from the `lighthouse:recommended` preset while every
category held 1.0. Same treatment as the other demoted insight audits; if a
future Lighthouse version starts attributing the reflow to a real script,
investigate that script before touching the config.

---

## 5. Architecture invariants

- **Logic extraction**: every non-trivial component ships a pure `logic.ts`
  (or `logic/` dir) with all sorting/math/config — enforced by the
  modularization contract. Pure functions get direct unit tests; components
  stay thin.
- **Static data in `src/data/`**, typed, with completeness tests.
- **IntroCurtain is a static import** — `dynamic(..., { ssr: false })` causes
  a flash of uncurtained page.
- **ExperienceCard has no root `whileInView`** — the parent stagger drives
  entry; a child `initial={{ opacity: 0 }}` races the parent and can stay
  blank forever.
- **Education `verificationLinks[0]` is always the institution's main site**
  (it renders as the institution-name link; index 1+ render as pills).
- **Root files/dirs are allow-listed** in `repo-hygiene-contract.test.ts` —
  update `EXPECTED_ROOT_FILES` in the same commit that adds a root file.

---

## 6. The regression ratchet — how standards stay upheld

1. **Every optimization lands with a contract test in the same commit.** A
   string-level check (the pattern exists / the anti-pattern doesn't) plus,
   where feasible, a runtime check (Profiler commit counts, mocked-context
   draw counts, call counts). String checks catch drive-by edits; runtime
   checks catch clever workarounds.
2. **Sweeps over pins.** Prefer repo-wide checks that walk every production
   source (`listProductionSources()`) — they catch *future* files, not just
   known hot spots. Current sweeps: no `map().filter()`, all high-frequency
   listeners passive, no mousemove→setState, no date parsing in comparators,
   every `repeat: Infinity` file references a motion gate
   (`prefersReducedMotion` / tier / `shouldAnimate*` — the 2026-07 audit found
   four components animating forever for reduced-motion users), every
   `public/` asset within the weight budget
   (`public-asset-weight-contract.test.ts`: per-image, per-file, and total
   caps — one oversized image is a silent mobile-LCP regression), every
   timer/listener/observer cleaned up (`lifecycle-hygiene-contract.test.ts` —
   found SmoothScroll's untracked zero-delay re-sync timers, which could call
   scrollTo on a destroyed Lenis after unmount), and the production
   security/caching headers pinned (`headers-integrity-contract.test.ts`:
   HSTS/COOP/nosniff on `/*`, sw.js never cached, hashed assets immutable,
   preload Link targets must exist in `public/`).
   Modularity sweeps (every `.tsx` under `src/components` + `src/app`,
   present and future): no inline `.sort()`/`.reduce()`, no module-level data
   catalogs, no regex parsing, no `performanceTier` ternary config derivation —
   all of that lives in logic modules. Testability sweeps: every
   `logic.ts`/`*-logic.ts`/`engine.ts`/`builders.ts` must have a co-located
   companion test (`module-testability-contract.test.ts`), and the CI coverage
   gate holds all of `src/` at 100% lines/branches/functions/statements — a
   hard-to-test component cannot merge.
3. **Every contract and test must pass before every commit** (owner mandate,
   2026-07) — not merely before push. `simple-git-hooks` runs the identical
   full gate at both `pre-commit` and `pre-push`: lockfile sync, type-check,
   zero-warning lint, and the entire `pnpm test` suite (900+ tests, all
   contracts, including the networked freshness checks — nothing is deferred
   to push time). A commit cannot be created with a red gate; `pre-push`
   re-verifies identically as a redundant safety net (catches drift from a
   `--no-verify` commit or a later rebase). `complexity-doctrine-contract.test.ts`
   asserts the hook wiring itself — including that pre-commit and pre-push
   stay byte-identical — so the gate cannot be silently narrowed or unwired.
   `pnpm run test:complexity` remains available as a fast, offline,
   manually-run subset (complexity doctrine, algorithm/data-structure,
   animation gates, modularization, dead logic exports, asset weight,
   config-integrity, docs-quality, lifecycle-hygiene, headers-integrity) for
   quick iteration — it is a convenience command now, not the commit gate.

   **Warnings are failures.** `pnpm run lint` runs eslint with
   `--max-warnings=0` and markdownlint over every root `*.md`
   (`docs-quality-contract.test.ts` — a 2026-07 audit found 138 accumulated
   markdown violations that warnings-only tooling never surfaced). And
   because every gate is itself just configuration,
   `config-integrity-contract.test.ts` pins the gates' own config: tsconfig
   strictness, the 100% coverage thresholds, `output: 'export'` +
   `reactStrictMode`, and one Node major across `.nvmrc` / `engines` / every
   CI workflow — a one-line config edit can no longer silently disarm a gate
   while everything stays green.
4. **Freshness covers every ecosystem you depend on, not just npm.**
   `dependency-freshness-contract.test.ts` keeps the pnpm dependency tree at
   latest-with-zero-CVEs, but that has zero visibility into
   `.github/workflows/*.yml` — GitHub Actions pins (`uses: owner/repo@vX`) are
   a separate ecosystem entirely. That blind spot is exactly how
   `actions/checkout`, `actions/setup-node`, and `pnpm/action-setup` drifted
   2–3 majors stale while `pnpm outdated` stayed green throughout, silently
   costing a "Node.js 20 is deprecated" annotation on every CI run.
   `github-actions-freshness-contract.test.ts` closes that hole: it parses
   every `uses:` line in every workflow file, queries the GitHub releases/tags
   API for each action's latest major, and fails naming the exact
   `file:line — pinned → latest`. Both freshness contracts run together under
   `pnpm run test:freshness`.

   When latest is genuinely unusable (2026-07: TypeScript 7.0 removed the
   `ts.ModuleKind` API that every released typescript-eslint — alphas
   included, all peering `typescript <6.1.0` — depends on, hard-crashing
   `npm run lint`), the pin goes in the contract's `PINNED_WITH_REASON` map
   with the blocking reason and revisit condition. Two mechanisms keep a pin
   from outliving its reason: (a) if the pinned package ever stops appearing
   in `pnpm outdated`, the test fails and demands the entry be deleted; and
   (b) a **compatibility probe** checks the blocking condition itself against
   the registry on every run — for the TypeScript pin it reads
   typescript-estree's published peer range and compares it to the latest
   TypeScript, so the pin announces its own removal the day upstream ships
   support, not whenever someone remembers to check.

   Same lesson, one more unwatched ecosystem (2026-07): `package.json`'s
   `packageManager` field is a one-entry ecosystem `pnpm outdated` never
   inspects — the pnpm pin sat at 11.9.0 while 11.11.0 shipped, invisible to
   every other freshness check. The contract now reads the field and compares
   it against the registry's latest pnpm. **The lesson generalizes: any tool, action, or
   binary your build depends on that isn't `pnpm add`-ed needs its own
   freshness check — dependency drift hides in whichever ecosystem nothing is
   watching.**

   The same file also closes a narrower but sharper hole (2026-07): `pnpm
   install --frozen-lockfile` — the exact command every CI job runs first —
   silently skips its own specifier-mismatch validation once the local
   `node_modules` already looks satisfied. A `pnpm update --latest` left
   `pnpm-lock.yaml` recording `postcss`'s specifier as `^8.5.16` instead of
   the `pnpm-workspace.yaml` override (`>=8.5.10`); every local
   `pnpm install --frozen-lockfile` check passed (false negative, warm
   `node_modules`), and it still broke every CI job on push, including both
   Lighthouse gates, before any of them could start. The test now runs that
   same command in a scratch directory seeded only with `package.json`,
   `pnpm-lock.yaml`, and `pnpm-workspace.yaml` — no pre-existing
   `node_modules` to short-circuit the check — which is the only way to
   reproduce CI's always-clean-checkout condition locally. **The lesson
   generalizes: if a tool's fast path depends on prior local state, a
   contract that runs it against that same state inherits the fast path's
   blind spot — verify from a clean slate, matching what CI actually does.**
5. **100% coverage proves a component is tested, not that it's used.** A
   2026-07 cleanup found `FAQ.tsx` — full content, a11y tests, smoke tests,
   100% coverage — never actually rendered on any page. Its only caller was
   its own test suite, which the coverage gate cannot distinguish from a real
   caller: both count as "covered." `dead-component-contract.test.ts` asks
   the question coverage doesn't — is this component's exported name used as
   a JSX tag in some *other* production file, not just its own test?
   `dead-logic-export-contract.test.ts` asks it one level down (2026-07,
   after `getActiveNavLabel` — the superseded O(n) nav lookup — sat exported
   with passing tests months after `buildNavLabelMap` replaced it): every
   exported logic-module *function* must be referenced by other production
   code or called within its own module; helpers exported purely for direct
   unit testing stay legitimate. Its
   sibling, `public-assets-freshness-contract.test.ts`, asks the same
   question about `public/`: is this file referenced anywhere, by any
   production source, config, or the well-known conventions that legitimately
   don't need one (documented per-entry in `PUBLIC_CONVENTION_EXEMPT`)? That
   cleanup also found four unreferenced images (350KB) sitting in `public/`
   for weeks with nothing watching. A third sibling, `dead-dependency-
   contract.test.ts` (2026-07), asks it one level further up the stack: does
   every `package.json` dependency have a real consumer anywhere in the
   repo? Found after a `beasties` postbuild experiment was reverted (critical-
   CSS inlining that regressed mobile CLS — §4.7) but the now-unused package
   was never removed from `devDependencies`. Auditing the full list the same
   day found four more with zero references — `playwright`, `autoprefixer`,
   `baseline-browser-mapping`, `@opennextjs/cloudflare` (leftover from an
   unused Workers/OpenNext deployment path this site never adopted) —
   verified dead by actually removing them and re-running the full build,
   test suite, lint, and `wrangler dev`, not just by absence of an import.
   Removing all five pruned 129 transitive packages from `pnpm-lock.yaml`.
   The detector requires a real `import`/`require` statement in source files
   (a code comment or test-assertion string *mentioning* a package by name
   doesn't count — the first draft of this contract false-passed with
   `beasties` reintroduced because its own investigation comment in
   `performance-regression-contract.test.ts` satisfied a bare substring
   match; fixed to require an actual import specifier). All three sweeps
   ship with an explicit, reasoned allowlist for deliberate exceptions
   (`ALLOWED_UNUSED_COMPONENTS`, `PUBLIC_CONVENTION_EXEMPT`,
   `KNOWN_INDIRECT_DEPENDENCIES`) rather than silently ignoring anything — an
   allowlist entry is a decision on record, not a loophole. All three run in
   the fast `test:complexity`/`test:modularization` gates so this class of
   drift fails before the expensive build/Lighthouse jobs even start — and,
   as of the pre-commit mandate in item 3 above, before the commit itself.
6. **Tests can't see what git doesn't track — sweep the working tree
   yourself occasionally.** That same cleanup found a `false/` directory at
   repo root (Lighthouse CLI debris from a local run whose output path
   resolved to the literal string `"false"`) and an empty
   `.github/modernize/` scaffold left by a one-off Copilot run — both
   correctly gitignored, so no test could ever have failed on them, but both
   sat on disk as clutter. `git status --short --ignored=matching` surfaces
   exactly this class of thing; run it periodically (this repo's `.gitignore`
   already anticipated the `false/` case specifically — line `false/` — so
   when it recurs, deleting the directory is the whole fix, no gitignore
   change needed).
7. **The checklist for any new component or feature:**
   - [ ] Pure logic extracted to `logic.ts` with unit tests
   - [ ] Collection builds/sorts in `useMemo`
   - [ ] List-item components `memo`'d if a parent selection re-renders them;
         callbacks `useCallback`-stable
   - [ ] High-frequency events → motion values / CSS vars, passive listeners,
         rAF-coalesced
   - [ ] Effects gated on the performance tier / `enableHoverMotion`
   - [ ] Works on coarse pointers: no stuck hover, ≥44px targets, no new
         ungated blur/filter/infinite animation
   - [ ] Hydration-safe: no browser APIs in initial state
   - [ ] New invariant → new contract test, same commit
   - [ ] `npm test && npm run type-check && npm run lint` green
8. **When a contract fails, fix the source.** If the *requirement* genuinely
   changed (e.g., a 5th education item changes the grid), update source, test,
   and the documentation together — that is a requirements change, not a
   test weakening.
9. **Commits are small, single-topic, and self-explanatory.** One logical
   change per commit — an optimization plus its ratchet contract plus its
   docs is *one* topic (rule 1); an unrelated dependency bump is another.
   Subject line: imperative, ≤72 chars, says *what*; body says *why* and
   names anything non-obvious (measurements, the bug class prevented, the
   revisit condition for a pin). Anyone reading `git log --oneline` should be
   able to follow the work without opening a single diff. Never mix refactors
   with behavior changes in one commit, and never commit with a red gate
   (rule 3).
