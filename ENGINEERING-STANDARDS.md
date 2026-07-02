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

## 2. Algorithms & data structures (contract sections 1–22)

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

Performance ≥ 0.90 on desktop (`lighthouserc.json`) and a clean 1.0 on mobile
(`lighthouserc.mobile.json`) — accessibility, best-practices, and SEO are all
pinned to a hard 1.0 on both. Enforced by `performance-regression-contract.test.ts`
(which asserts the exact thresholds in both configs, not just their presence)
and by `deploy:prod`, which runs the full Lighthouse gate before every deploy.
Mobile has held a clean 1.0 on every observed run, so it gets no tolerance.
**The floor may only move up — if runs are flaky, raise `numberOfRuns` first
and confirm with real data before ever lowering the threshold.**

Desktop's threshold and `numberOfRuns` both moved in 2026-07, each backed by
data rather than a guess:

1. Started at 1.0 / 3 runs. Runner CPU jitter made a literal 100 unreliable,
   so the threshold dropped to 0.95 — GitHub-hosted runners don't have
   consistent enough CPU timing to hit it reliably, and 0.95 still caught
   real regressions.
2. 0.95 then failed 3 of 5 consecutive pushes at 0.93-0.96. `numberOfRuns`
   raised 3→5, on the theory that LHCI's *median* comparison would absorb
   more of the variance without moving the bar.
3. It didn't: two more consecutive 5-run pushes both landed a median of
   0.93 — including one push that shipped a real, verified app fix (hero
   subtitle reveal timing) that measurably improved speed-index in isolation
   (0.59→0.98 in one sample). The bottleneck metric moved between pushes
   (speed-index one push, total-blocking-time the next) while the median
   held at 0.93 both times — a stable median with a moving bottleneck means
   0.93 is close to this runner environment's true central tendency, not
   noise more samples would average away. `numberOfRuns` stabilizes *how
   reliably you measure* the value; it doesn't move the value itself.
   Threshold dropped to 0.90 — real margin below both observed medians,
   while still well above what an actual regression would produce.
4. With the threshold now sitting on real margin below the observed median,
   the extra runs from step 2 were no longer buying anything — they made
   the *measurement* of 0.93 more stable, but the fix that mattered was
   recalibrating the *threshold*. Reverted `numberOfRuns` back to 3 to save
   the ~2 extra minutes of CI time per push.

`performance-regression-contract.test.ts` pins `numberOfRuns === 3` and
`minScore: 0.9`. If the median drifts down again: raise `numberOfRuns` for
better measurement *and* check Core Web Vitals for a real regression before
touching the threshold — don't repeat step 3's mistake of assuming more
samples alone will fix a stable-but-low median.

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
   listeners passive, no mousemove→setState, no date parsing in comparators.
   Modularity sweeps (every `.tsx` under `src/components` + `src/app`,
   present and future): no inline `.sort()`/`.reduce()`, no module-level data
   catalogs, no regex parsing, no `performanceTier` ternary config derivation —
   all of that lives in logic modules. Testability sweeps: every
   `logic.ts`/`*-logic.ts`/`engine.ts`/`builders.ts` must have a co-located
   companion test (`module-testability-contract.test.ts`), and the CI coverage
   gate holds all of `src/` at 100% lines/branches/functions/statements — a
   hard-to-test component cannot merge.
3. **Tests must pass before every commit** (`npm test`, 900+), plus
   `npm run type-check` and `npm run lint`.
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
   `pnpm run test:freshness`. **The lesson generalizes: any tool, action, or
   binary your build depends on that isn't `pnpm add`-ed needs its own
   freshness check — dependency drift hides in whichever ecosystem nothing is
   watching.**
5. **100% coverage proves a component is tested, not that it's used.** A
   2026-07 cleanup found `FAQ.tsx` — full content, a11y tests, smoke tests,
   100% coverage — never actually rendered on any page. Its only caller was
   its own test suite, which the coverage gate cannot distinguish from a real
   caller: both count as "covered." `dead-component-contract.test.ts` asks
   the question coverage doesn't — is this component's exported name used as
   a JSX tag in some *other* production file, not just its own test? Its
   sibling, `public-assets-freshness-contract.test.ts`, asks the same
   question about `public/`: is this file referenced anywhere, by any
   production source, config, or the well-known conventions that legitimately
   don't need one (documented per-entry in `PUBLIC_CONVENTION_EXEMPT`)? That
   cleanup also found four unreferenced images (350KB) sitting in `public/`
   for weeks with nothing watching. Both sweeps ship with an explicit,
   reasoned allowlist for deliberate exceptions (`ALLOWED_UNUSED_COMPONENTS`)
   rather than silently ignoring anything — an allowlist entry is a decision
   on record, not a loophole. Both run in the fast `test:modularization` CI
   job so this class of drift fails before the expensive build/Lighthouse
   jobs even start.
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
