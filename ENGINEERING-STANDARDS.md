# Engineering Standards — cameronaaron.com

This document is the permanent record of the performance and code-quality bar
for this codebase. **Every rule here is enforced by a contract test.** If a
rule matters and has no test, the first task is to write the test — a standard
that isn't executable is a suggestion.

> **Prime directive: when a contract test fails, fix the SOURCE, not the test.**
> The tests encode decisions that were made deliberately, usually after finding
> and fixing a real regression. Weakening a test to make code pass inverts the
> entire system.

**This codebase is held to the standard of safety-critical, mission-critical
software** — not because a portfolio site is life-safety equipment, but
because that discipline is the concrete, executable version of "obsessive
engineering quality." In practice that means:

- **A defect, once found, gets a permanent test in the same commit that fixes
  it.** The ratchet in §6 only ever tightens; a bug that recurs after being
  fixed once is a process failure, not bad luck.
- **Nothing ships on "should work."** Every claim in this document is backed
  by a measurement, a reproduction, or a contract test — see §4.7's Lighthouse
  history and §6 item 13's mutation-testing sweep for what that looks like
  when actually done, not just asserted.
- **Iteration speed and verification rigor are not in tension.** The fast
  offline subset (`test:complexity`) exists so day-to-day iteration stays
  quick; the full pre-commit/pre-push gate exists so *nothing* ships without
  every contract passing. Fast and rigorous are the same design goal, not a
  tradeoff — the pattern real aerospace/mission-critical software teams use
  is extensive automated verification paired with fast iteration loops, never
  rigor traded for speed or speed traded for rigor.
- **"What does this do on the worst device, on the worst network, for the
  user who turns motion off" is the first question, not an edge case
  asked afterward** (§4 in full). A feature that only works in the happy path
  on a fast machine with a mouse is not finished.
- **Latency is a feature, not a byproduct.** A response that lags the input
  driving it reads as software; one that keeps up reads as a physical object.
  This isn't aspirational framing — it's the concrete reason §1's O(1)
  per-event rule, §3.1's "high-frequency events never touch React state,"
  and §3.3's passive-listener sweep exist: every one of them exists
  specifically to keep the gap between a user's input and the pixels
  changing as close to a single frame as this stack allows. §6 item 17 is
  the same discipline applied to *measuring* time instead of *reacting* to
  input — a UI can be fast and still report itself wrong if the measurement
  itself doesn't respect the render pipeline.

Enforcing test files:

| Contract | File |
| --- | --- |
| Algorithms & data structures | `src/components/algorithm-and-datastructure-contract.test.tsx` |
| Runtime render behavior (Profiler-verified) | `src/components/render-behavior-contract.test.tsx` |
| Animation anti-patterns | `src/components/animation-regression-contract.test.ts` |
| Mobile tap targets, safe areas | `src/components/mobile-regression-contract.test.tsx` |
| Logic extraction per component | `src/modularization-contract.test.ts` |
| Root files / path conventions | `src/repo-hygiene-contract.test.ts` |
| Lighthouse thresholds | `src/performance-regression-contract.test.ts` |
| Real-browser interaction latency (INP, long tasks) | `src/interaction-latency-contract.test.ts` (fast wiring) + `scripts/checks/measure-interaction-latency.mjs` (real measurement, deploy-time) |
| bfcache blank-screen | `src/app/section-reveal-bfcache.test.ts` |
| Internal doc cross-references resolve | `src/docs-cross-reference-contract.test.ts` |
| Filename casing + no lazy exported identifiers | `src/naming-and-organization-contract.test.ts` |
| RSC server/client boundary (page shell + converted sections stay server) | `src/app/rsc-boundary-contract.test.ts` |

---

## 0. The first-principles doctrine — how every other rule is derived

Everything below §0 is a *conclusion*. This section is the *method* that
produced them and the method every future change must use. The rules in §1–§9
are not sacred because they are written down; they are correct because they were
derived from ground truth, and the moment a better derivation appears, backed by
measurement, the rule changes and the ratchet locks the new floor.

**Reason from the physics, never from the convention.** The default engineering
move is analogy: "this is how portfolio sites / React apps / everyone does it."
Analogy copies other people's constraints along with their solution. First
principles instead asks: what is *actually* true here — the frame budget, the
bytes on the wire, the CPU cycles under 4× throttle, the specific line the
profiler blames — and what is the best thing physics permits given only that?
Boil every problem down to its irreducible truths and reason up from there. A
"best practice" is a cached answer to someone else's question; verify it still
holds for *our* question or discard it.

### 0.1 "Impossible" is a measurement you haven't taken yet

Treat the word *impossible* as a bug report against your own understanding.
Almost every "can't be done" is really one of three things wearing a disguise:

1. **Unmeasured** — nobody has actually profiled it; the wall is assumed.
2. **Un-questioned requirement** — the thing that's expensive shouldn't exist
   (see 0.2 step 1).
3. **Expensive, not impossible** — it costs cycles/bytes/effort, and the real
   decision is whether the win is worth the price, stated honestly.

The only genuine walls are physical limits — the speed of light, a device's
real core count, the size of a payload that *must* ship — and you must *prove*
you've hit one, with a number, before you accept it. Everything else is
negotiable. Aim at the theoretical optimum (zero allocation per frame, one frame
of input latency, the smallest byte count that renders the content) and let
measurement tell you how close you got — do not start from "good enough" and
stop there. Ambition sets the target; §6's ratchet and every contract test keep
the ambition honest.

### 0.2 The algorithm (apply strictly in order)

Adapted from the SpaceX design loop. The ordering is the whole point — most
engineering waste is optimizing, and even automating, a thing that should have
been deleted two steps earlier.

1. **Question the requirement.** Every requirement carries the name of the
   person who set it, never a department or a convention — so it can be
   challenged. "The hero must have an intro curtain," "sections must animate in,"
   "the CI perf floor must read 1.00" are all requirements to interrogate, not
   givens. Requirements from smart, senior sources included: they are the *most*
   dangerous, because they get questioned least. Make the requirement less dumb
   before writing a line to satisfy it.
2. **Delete the part or the process.** The best part is no part; the best code
   is no code; the best request is no request. Delete aggressively — if you are
   not later forced to add back at least ~10% of what you removed, you did not
   delete enough. A deleted component can't have a bug, a render cost, a byte
   weight, or a test. Only what survives deletion earns the right to exist.
3. **Simplify / optimize — but only what survived step 2.** Optimizing a thing
   that shouldn't exist is the most common and most invisible waste in software.
   This is where §1–§3 live (O(1) per event, Map over scan, zero-alloc frame
   loops). They come *third*, never first.
4. **Accelerate the loop.** Shorten the distance between an idea and a measured
   verdict — the fast offline `test:complexity` subset, a scriptable Lighthouse
   run, a one-file spike. A fast idea→measurement loop is what makes aggressive
   novelty affordable instead of reckless.
5. **Automate — last.** Only automate a process that has already been
   questioned, deleted down to its core, and simplified. Automating waste just
   produces waste faster. This is why contract tests (§6) are written *after* a
   rule is proven correct, not before.

### 0.3 Novelty is mandatory — and it earns its place by measurement

Being novel and being disciplined are the same practice here, not opposites.
The mandate is to reach for the best algorithm, structure, or approach that
exists — or that *could* exist and hasn't been built yet — not the familiar one.
Cutting-edge is the default target. But this codebase's other prime directive is
that **nothing ships on "should work"** (see the preamble). So novelty is bound
to one rule:

> A novel approach ships **only** when a measurement shows it beats the
> incumbent on the metric that matters. A novel approach that does not beat the
> baseline is **deleted**, and the attempt is **recorded** so no one burns the
> same hours re-deriving the same dead end.

That record — the *measured-and-rejected ledger* — is a first-class artifact,
not an apology. §4.7 already carries one (the code-splitting experiment that
*hurt* mobile LCP and was reversed; the local-vs-CI `bf-cache` false positive).
CLAUDE.md constraint #17 carries another (Next/Turbopack force-preloads every
chunk, so no import-level deferral can pull JS out of Lantern's LCP *download*
graph). A rejected experiment with a number attached is *progress*: it
permanently narrows the search space. Recording it is mandatory; hiding it, or
never trying because "it probably won't work," is the actual failure.

But the ledger is not a *gravestone* — a rejection is only final for the metric
and the measurement it was judged against. LazyMotion is the cautionary example
(0.5): it was rejected here on LCP grounds — correctly, LCP never moved — and
then, weeks later, found to be *the* win on a different metric (TBT/main-thread)
once a measurement bug was fixed (see 0.4). A rejected experiment should carry
not just its number but *which metric and which measurement* rejected it, so a
future engineer can tell "physically impossible" from "didn't help *that* number
under *that* setup." Re-open the ledger when either changes.

### 0.4 Worked example — this doctrine in one sitting (2026-07)

The mobile-LCP work is the loop in miniature, and the template for how to attack
any "we're stuck at X" number:

- **Questioned the requirement** ("mobile Lighthouse must read 1.00"): measured
  real applied-throttling LCP at 1.9s / perf 0.95 versus Lantern's *simulated*
  3.76s, and proved the gap is a simulator artifact, not the site.
- **Found ground truth before touching code:** isolated the gate by elimination
  — ruled out the curtain, fonts, and layout individually — and traced Lantern's
  LCP to the sum of *all* first-wave JS bytes.
- **Shipped what beat the baseline, with tests:** the CLS reserved-slot fix
  (0.093 → 0.001, both form factors) and `content-visibility` on below-fold
  sections (styleLayout 2.26s → 1.66s), each with a contract test and the CLS
  ratchet tightened 0.1 → 0.05.
- **Deleted what didn't, with evidence:** the image-as-LCP attempt was built,
  measured to *not* move the metric, and reverted into the ledger. The
  LazyMotion migration was *also* reverted here — but only against LCP; see the
  sequel below.
- **Named the real wall honestly (and then it moved):** the LCP ceiling was
  stated as "cut total initial JS." What that framing missed — because the
  measurement was contaminated — is that the load score's real gate was never
  LCP at all. A stray `next dev` on port 3000 (the §4.7 item 8 pitfall,
  recurred) meant local Lighthouse had audited the *dev* build the whole time;
  real PSI on a Moto G Power scored **~52**, gated by **TBT ~4.6s** — hydration
  cost (framer + react-dom bundle *evaluation* over a 3,266-element DOM), a
  different problem than the LCP artifact. Re-questioned on the right metric
  with clean data: the ~60 decorative infinite framer animations moved to CSS
  (compositor); the `initial={false}` no-op entrance wrappers became plain
  elements; and **LazyMotion — the same migration reverted two bullets up —
  was re-shipped**, because deferring framer feature *evaluation* off the
  hydration path cut scriptEvaluation ~20% (a TBT win it never had to be for
  LCP). The lesson that outranks all the others here: **an honestly-named wall
  is only as honest as the measurement behind it — when the number won't move,
  suspect the ruler before the wall.**

### 0.5 Validate the ruler before you trust the number (mandatory)

§0 rests entirely on measurement. That makes a *wrong* measurement worse than no
measurement: no data leaves you knowing you're ignorant, bad data leaves you
confidently wrong and spending real effort in the wrong direction. This section
exists because that happened here, twice, and cost more than every genuine
regression in this file combined.

**The incident (2026-07-19, recurred 2026-07-20).** A stray `next dev` was left
listening on port 3000. Every local Lighthouse run therefore audited the **dev**
bundle — unminified, devtools attached — instead of `/out`. The consequences
were not academic:

- A production build that really measures ~0.88 locally reported ~0.57, so
  "the site is catastrophically slow locally" was investigated as real.
- Conversely, an earlier contaminated round reported ~0.89 mobile and became the
  documented premise that mobile was *fine* — while real PSI on a Moto G Power
  was **52**. The whole "mobile LCP is just a Lantern artifact" narrative was
  built on it.
- A LazyMotion migration was built, "measured," judged useless, and **reverted**
  — then re-measured cleanly weeks later and found to be the single biggest
  TBT win available (§0.4). Good work was thrown away because of the ruler.
- §4.7 item 8 documented the pitfall after the *first* incident, in detail,
  with the exact `pgrep -fl "next dev"` command. It recurred anyway.

**The rule, and why it is a gate and not a paragraph.** That last bullet is the
whole point: a documented warning is a suggestion, and suggestions lose to
whatever the machine is actually doing at 2am. So:

1. **A measurement harness must prove its subject before reporting a number.**
   `scripts/checks/serve-out-warmed.mjs` now refuses to start if the port is
   already occupied (printing the offending process), and refuses to print
   `WARM_READY` unless the bytes it just fetched are provably the production
   export — dev-only markers absent (`next-devtools`, `_next_dist_compiled`,
   `_next_dist_client`) *and* a content-hashed `_next/static` chunk present.
   Both paths exit non-zero with the fix command. Verified by starting a real
   `next dev` on the port and confirming the refusal fires.
2. **A number that disagrees sharply with a trusted external signal is a
   measurement bug until proven otherwise.** Local said 0.89, PSI said 52. The
   correct first move was to reconcile the instruments, not to theorize about
   Lantern. When local and field disagree by more than a grade, stop optimizing
   and go audit the setup.
3. **State the subject with every number you record.** "0.88" is meaningless;
   "0.88, clean `/out` via warmed wrangler on a free port, 4x CPU, headless" is
   a fact someone can reproduce or falsify. Every measurement written into this
   file or a commit message carries its conditions.
4. **This generalizes past Lighthouse.** Any harness that can silently point at
   the wrong target — a warm `node_modules` hiding a lockfile drift (§6 item 4),
   a Stryker cache reporting a stale survivor (§6 item 13), a test asserting
   against a mock of the thing it claims to test (§6 item 8) — belongs to this
   same family. Before trusting *any* measurement: what exactly did this
   measure, and how would I know if it measured something else?

The lesson §0 encodes: chase the theoretical best relentlessly, measure every
step, ship what wins, delete what loses, and write down both — so the next
person starts from the frontier, not from zero. And before any of that: make
sure the instrument is pointed at the thing you think it is.

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
5. **O(1) is necessary but not sufficient — it says nothing about the
   constant.** A per-event handler can be algorithmically O(1) and still take
   40ms if the constant factor is large (a heavy re-render, an unbatched
   layout read, an expensive animation start). Items 1–4 bound the *shape* of
   the work; this item bounds its *duration* in real milliseconds, measured
   in a real browser, not estimated from the algorithm on paper.

   **The honest target, and why it's phrased this way (2026-07):** the goal
   for this site is for every interaction to feel instant — the kind of
   response latency where a UI stops reading as software and starts reading
   as a physical object. The literal framing "sub-5ms response at a locked
   120Hz" was considered and rejected as a *written standard*, because
   neither half is something a web page can honestly claim: a browser cannot
   force a display's refresh rate (most monitors people will actually view
   this site on are 60Hz; only some phones/tablets/newer laptops run
   90–144Hz — the correct behavior is matching whatever the display already
   does, never fighting it or dropping frames), and even a perfect page has a
   floor of one full frame of scan-out (8.3ms at 120Hz, 16.6ms at 60Hz) plus
   input-queue and compositor-hop latency between a real click and real
   photons — a floor this document's own prime directive ("nothing ships on
   'should work'") won't let stand unmeasured. Aerospace/Neuralink-grade
   real-time systems hit sub-5ms because there is no browser process, no
   garbage collector, and no OS-level input queue between their input and
   their output; that is a different engineering domain, not a bar this
   stack can honestly claim to clear.

   The real, measured, industry-standard bar for "this interaction feels
   instant" is **INP (Interaction to Next Paint)**, the Core Web Vital that
   replaced FID specifically for measuring click/tap/keypress → next visual
   update. This site's floor:
   - **Every representative interaction: median INP < 100ms** — the low
     half of Core Web Vitals' "good" range (<200ms), where interactions
     read as instant rather than merely acceptable.
   - **Zero `PerformanceObserver({type:'longtask'})` entries during any
     interaction** — not a threshold this repo chose: the Long Tasks API
     itself defines "long" as >50ms of continuous main-thread blocking, so
     any entry at all is already a violation by the spec's own definition.

   **Why this can't be a Vitest/jsdom test, and how it's actually enforced:**
   jsdom has no compositor, no real browser task queue, and (confirmed by
   audit) no `PerformanceObserver` — it structurally cannot produce a
   genuine long task or a real Event-Timing-API interaction. This is
   measured against a real, static-export production build with real
   Chromium (Playwright) and Google's own `web-vitals` library (the actual
   INP algorithm — interaction grouping, worst-of-session selection,
   presentation-time measurement — not worth hand-rolling) via
   `scripts/checks/measure-interaction-latency.mjs`
   (`pnpm run test:interaction-latency`), following the identical
   server-lifecycle pattern this repo's Lighthouse gate already established
   (`wrangler pages dev out`). Same posture as Lighthouse and the external-
   links ledger checker: slow and real-browser, so it lives in the
   deploy-time tier (`deploy:pages:prod`), never the pre-commit/pre-push
   hook. The fast, every-commit half
   (`src/interaction-latency-contract.test.ts`) only asserts the *wiring* —
   the documented budgets, a non-empty representative-interaction list each
   naming a real file, and that both the npm script and the deploy pipeline
   actually invoke the real measurement — the same relationship
   `performance-regression-contract.test.ts` has to Lighthouse.

   Real-browser interaction timing is genuinely noisy run to run (confirmed
   by hand: the same interaction reported 80ms, 96ms, and 128ms across three
   otherwise-identical runs) — the measurement script takes the median of 3
   runs per interaction, the same fix this repo already applies to
   Lighthouse (`numberOfRuns: 3`, §4.7): more samples stabilize how reliably
   a value is measured, they don't move the value itself. A reading that
   never gets reported at all is treated as a failure, not a silent pass —
   per item 8 below, a test that cannot fail is worse than no test; if
   web-vitals stops reporting, that is itself a regression worth knowing
   about, not "nothing to check here." Three interaction types were tried
   and reproducibly never produced a reading (0/3) — two that steal focus
   into a modal on open (CommandPalette, KeyboardShortcuts) and one revealed
   by an immediately-preceding scroll (BackToTop) — and were left out of the
   representative set rather than shipped as false-negative passes on
   missing data; documented inline at the script's source as a known gap
   worth its own investigation, not silently dropped.

When you cannot make something O(1), the required move is to state *why* (a
lower bound, an inherent property) in a comment, and make it run at the
minimal frequency possible.

**First real run against the three representative interactions (2026-07-19)**
found genuine, fixable causes — not measurement noise — behind all three
failures:

- **Mobile menu toggle** (`Navigation.tsx`): one ~50-54ms long task. Root
  cause: `mobileMenuOpen` lives in `Navigation`, so toggling it re-rendered
  the entire component tree — including the 8 desktop nav links, each
  wrapping a `Magnetic` (two `useSpring` hooks), that have nothing to do
  with the mobile panel. Fixed by extracting memoized `DesktopNavLink` /
  `MobileNavLink` components (same pattern as `ExperienceCard`, item 13
  above). **Fully resolved** — consistently 80-88ms, zero long tasks, across
  every run since, including under heavy unrelated system load.
- **Testimonials relationship filter**: INP unreliable (0-1 of 3 runs even
  reporting a value) before any budget question. Root cause: the card `key`
  included `relationshipFilter`
  (`` `${relationshipFilter}-${testimonial.name}-${testimonial.date}` ``), so
  a testimonial that stays visible across a filter change (e.g. shown under
  both "All" and "Managers") was torn down and fully remounted on every
  click — re-running `whileInView`/`IntersectionObserver` setup for every
  *surviving* card, not just the newly-shown ones. This also meant
  `AnimatePresence`'s `layout` prop on each card was animating nothing real:
  no card ever persisted across a key that always changed, so the FLIP
  animation had zero surviving elements to reposition. Fixed the key
  (dropped `relationshipFilter` from it — correctness fix, not just a perf
  one: a card that stays visible should not replay its entrance animation)
  and removed the now-dead `layout` prop; memoized `TestimonialCard`.
- **Skills sort-view toggle**: `layout` on all 11 skill-bar items forced a
  synchronous FLIP position measurement on every reorder; `SkillBar` and the
  sibling `SkillWeb` canvas component were both unmemoized, so every
  unrelated re-render (including the sort toggle) reconciled all of them for
  no visual benefit. Fixed by removing `layout` from the skill-bar items —
  a real, deliberate trade-off (see below) — and memoizing both components.

**Testimonials and Skills are measurably improved but not deterministically
under the 100ms budget** — landing in the 90-110ms range depending on system
load, versus the pre-fix 104-128ms (Testimonials often didn't even report a
value at all). Investigated further before stopping: Skills' remaining cost
is the DOM node reordering a genuine resort inherently requires (11 nodes
changing position is real layout-affecting work with or without Framer
Motion's `layout` prop); Testimonials' worst case is the specific
representative interaction clicking "Managers" as the first non-active
filter from "All" — a ~14-of-18-card simultaneous exit, a legitimately heavy
one-time visual change, not a steady-state cost. A `mode="sync"` experiment
on `AnimatePresence` (replacing `popLayout`) was tried and measured: no
clear improvement, and it carries an unverified visual trade-off (exiting
cards would stay in grid flow during their exit animation instead of being
removed from layout immediately), so it was reverted rather than kept on a
noise-level result. **Decision (2026-07-19, owner sign-off): ship the real
fixes, document the remaining gap, don't chase it further without a new,
specific idea** — the same posture as the render-blocking-insight history in
§4.7 item 5. Further closing this gap means a real UX trade-off (drop the
Skills reorder animation entirely, or skip exit animations when a filter
click would hide many cards at once) that wasn't made unilaterally.

Also found and fixed while investigating: repeated manual invocations of
`measure-interaction-latency.mjs` left orphaned `wrangler pages dev`
processes bound to port 3411 accumulating across runs, degrading later
measurements' accuracy by contending for CPU — traced to piping the
script's output through another process (`| tail`) rather than a bug in its
own `process.kill(-server.pid)` cleanup, which was independently verified to
work correctly in isolation. Not fixed at the script level (the cleanup
logic itself is correct); noted here so a future investigation doesn't
re-diagnose the same false lead.

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

### 2.5b K-nearest via a bounded max-heap (contract: interactive engine)

Finding the K particles nearest the cursor each frame is "K smallest of N".
The optimal streaming structure is a **max-heap of capacity K** keyed on squared
distance (`interactive-particles/interactive-particles-engine.ts`: `createKnnHeap` / `knnOffer` /
`collectNearestParticles`): the root is the worst of the kept set, so a
candidate is admitted in O(log K) only when it beats the root and rejected in
O(1) otherwise — O(N log K) per frame, versus O(N log N) for a full sort or
O(N·K) for insertion into a sorted window. Backed by a `Float32Array` (squared
distances) and `Int16Array` (indices) allocated once and reused every frame
(§2.6/§2.8): the cursor-constellation draw pass allocates nothing. Compare
squared distances; the ≤K survivors are the only ones that ever need a sqrt.

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

### 2.9 sqrt of squares, never the hypot builtin (contract section 24)

`Math.sqrt(dx * dx + dy * dy)`, never `Math.hypot(dx, dy)`. The hypot
builtin buys overflow safety for magnitudes around 1e150 by taking a
correctly-rounded slow path that costs several times a plain sqrt in V8 —
and no coordinate, velocity, or force in this codebase can approach the
range that safety defends. Found live in two frame-hot loops (2026-07-23):
the verlet ribbon's constraint solver (segments ×
`RIBBON_CONSTRAINT_ITERATIONS` × 60fps) and the skill-web velocity clamp.
Both rewritten, and the clamps got the further §2 treatment while there:
when the root only exists to compute a clamp scale, guard on the *squared*
comparison first (`speedSq > MAX_NODE_SPEED_SQ`) so the common
within-limit path pays zero roots — the settled steady state of a
force-directed layout then runs root-free. Contract section 24 sweeps every
production source for the builtin; a future call site that genuinely needs
hypot's overflow behavior goes in `HYPOT_ALLOWED` with the magnitude
analysis that justifies it (§6 item 18).

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

### 3.7 Continuous work runs only while visible (mandatory, 2026-07-19)

Any component that does continuous or scheduled work — a `requestAnimationFrame`
loop, a physics/canvas simulation, a game timer, a countdown — **must gate that
work on actually being scrolled into view** (`useInView` from framer-motion:
real IntersectionObserver, and the shared test mock already returns `true` so
existing tests are unaffected; override with `mockReturnValue(false)` to test
the off-screen branch). Off-screen work is not "cheap because it sleeps" — five
idle-but-armed simulations still each pay listener registration, first-frame
layout reads, and wake-on-mousemove churn during the exact window the page is
trying to hydrate.

Measured origin of the rule: before gating, every below-fold widget started at
mount, and the predator-prey game's survival timer was accruing catches before
a visitor ever reached Projects. Gating them (plus item 3.8 below) took the
honestly-throttled mobile TBT from 690ms to 27ms.

The gate must **pause, not reset**: the effect's cleanup cancels the frame/timer
and the state lives outside the effect, so scrolling away and back resumes.

**The always-mounted exception, and how it slipped through (2026-07-20).** The
rule above is satisfied for free by below-fold widgets because §3.8 `useInView`-
unmounts them. But a component that is *always mounted* — the hero particle
canvases (`BackgroundParticles`, `InteractiveParticles`, index 0, never
unmounted) — has no unmount to hang the gate on, so both ran their
`requestAnimationFrame` draw loop **forever**: every frame cleared, advanced,
and re-rasterised even after the hero scrolled off, even in a background tab.
Root-caused from a CPU-throttled trace where `RasterTask` dominated the desktop
main thread while `FunctionCall` (JS) was idle — i.e. the cost was *painting*,
not React. Fixed with `gateLoopOnVisibility` (`hero/visibility-gate.ts`): an
`IntersectionObserver` combined with the Page Visibility API drives the loop's
start/stop, and because particle state lives in the effect closure, pause/resume
is seamless — a viewer sees nothing change. Verified: rAF callbacks drop when
the hero scrolls off and resume on scroll back. Enforced repo-wide by
`animation-regression-contract.test.ts` — **any** `.tsx` that renders a
`<canvas>` and calls `requestAnimationFrame` must reference a visibility gate
(`gateLoopOnVisibility`/`useInView`) or sit in `ALLOWED_UNGATED_CANVAS_LOOPS`
with a concrete reason (only two qualify: `CursorComet` self-sleeps on idle,
`GlyphDissolveName` is a finite one-shot). The lesson generalizes: "gate
continuous work on visibility" and "unmount below-fold widgets" are two
different mechanisms — an always-mounted animator needs the *former*, and the
absence of an unmount is exactly what hides the missing gate.

### 3.8 Below-fold non-content widgets are code-split (mandatory, 2026-07-19)

A widget that is (a) below the fold, (b) decorative or interactive-only —
nothing in it belongs in the prerendered HTML for crawlers — and (c) already
visibility-gated per 3.7, **must be `next/dynamic`-imported with `ssr: false`**
so its code stays out of the initial bundle entirely (games, canvas
simulations, physics bands). Measured: +0.03 mobile performance, −82ms TTI,
desktop flat to the millisecond (§4.7 item 8's table).

The two hard boundaries, each learned from a measured failure:

- **Never split content.** Whole-section splitting was measured and rejected
  (§4.7 item 4: the extra chunk round-trip deepened the critical graph,
  LCP/TTI regressed on both form factors). A wrapper whose *children* are
  content (`MagneticField` around the contact links) counts as content —
  splitting it would drop real markup from the static export.
- **Never split anything above the fold** — `IntroCurtain` stays a static
  import (CLAUDE.md critical constraint #1), and hero-visible decorations
  render via the `isProfileReady` gate, not lazy chunks.

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

   **Reconsidered and re-measured (2026-07):** a narrower hypothesis — dynamic
   `import()` for a single decorative widget (`SkillWeb`, the force-directed
   canvas background in `Skills.tsx`, `ssr: false`) instead of an entire
   section — was actually tested this time, not just proposed. Three-run
   median `npx @lhci/cli autorun` before/after on both form factors:

   | Metric | Desktop before | Desktop after | Mobile before | Mobile after |
   | --- | --- | --- | --- | --- |
   | Performance | 0.99 | 0.99 | 1.00 | 1.00 |
   | FCP | 370ms | 370ms | 370ms | 371ms |
   | LCP | 759ms | 761ms | 766ms | 767ms |
   | TBT | 0ms | 0ms | 0ms | 0ms |
   | Speed Index | 1052ms | 1032ms | 828ms | 826ms |
   | TTI | 763ms | 763ms | 768ms | 769ms |

   No metric moved outside run-to-run noise in either direction. **Reverted**
   (`SkillWeb` stays a static import) — not because splitting regressed
   anything this time, but because it didn't measurably help either: the page
   was already sub-second and 0.99-1.0 across the board before touching it,
   so there was no headroom left for a code-split to recover. Splitting adds
   real cost regardless of the measurement (an extra chunk boundary, a
   loading-state to reason about, one more thing that can fail to load) —
   that cost needs a measured benefit to justify it, and here there wasn't
   one. The lesson isn't "narrow splits don't work"; it's "measure the
   *headroom* before reaching for a fix — a page with nothing slow to fix has
   nothing for code-splitting to win back." Revisit only if a future
   regression actually creates that headroom, and measure again rather than
   assuming this result still holds.
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

   **Root-caused as not fixable from `src/` — fixed anyway via `pnpm patch`
   (2026-07-18).** `legacy-javascript-insight` traces to Next.js's own
   `next/dist/build/polyfills/polyfill-module.js`: conditional guards like
   `Array.prototype.at||(Array.prototype.at=function(){…})` for
   `Array.at`/`flat`/`flatMap`/`Object.fromEntries`/`Object.hasOwn`/
   `String.trimStart`/`trimEnd`, confirmed by grepping the exact polyfill
   source into the shipped chunk (`grep -rl` across `node_modules` matched
   only Next's own polyfill module — no third-party package). It's injected
   by Next's build pipeline itself unconditionally — loaded via a normal
   (non-`nomodule`) async script regardless of the project's browserslist
   target — and not exposed through any `next.config.mjs` flag. This is the
   same defect as [vercel/next.js#86785](https://github.com/vercel/next.js/issues/86785):
   no official fix or opt-out exists upstream as of Next 16.2.10.

   "Not fixable from `src/`" turned out to mean exactly that and no more —
   application code can't reach into Next's build pipeline, but `node_modules`
   itself can be patched. `pnpm patch next@16.2.10` empties
   `dist/build/polyfills/polyfill-module.js` to zero bytes
   (`patches/next@16.2.10.patch`, `pnpm-workspace.yaml`'s
   `patchedDependencies`). Verified safe before applying: (1) every API that
   file shims — `Array.at`/`flat`/`flatMap`, `Object.fromEntries`/`hasOwn`,
   `String.trimStart`/`trimEnd`, `Symbol.prototype.description` — is natively
   supported by this repo's browserslist floor (Chrome/Edge 111+, Firefox
   113+, Safari 16.4+); (2) `grep -rn "canParse" src/` found zero call sites,
   so the one shimmed API *not* covered by that floor (`URL.canParse`, which
   needs Firefox 115+/Safari 17+) is never called by application code; (3)
   Next's own internal use of `URL.canParse`
   (`shared/lib/normalized-asset-prefix.js`) only runs when `assetPrefix` is
   configured — this project doesn't set one, so the call site is dead in our
   build regardless. Measured before/after with a live `lighthouse` run
   against a `wrangler pages dev` build of `/out`:
   `legacy-javascript-insight` went from "Est savings of 14 KiB" (score 0) to
   zero waste (score 1); no other audit moved outside run-to-run noise.

   **Fragility this trades in:** `pnpm patch` pins to an exact version
   (`next@16.2.10`). `package.json` still ranges on `^16.2.10`, so a future
   `pnpm install`/`pnpm up` that resolves a newer `next` will silently stop
   applying the patch — no error, just the polyfill quietly coming back.
   Two independent guards catch this: `performance-regression-contract.test.ts`
   asserts `pnpm-workspace.yaml`'s pinned patch version matches the lockfile's
   *resolved* `next` version (fails fast on every `npm test`, before any
   build); `performance-budgets.mjs`'s `LEGACY_POLYFILL_FINGERPRINT` check
   greps the actual built `/out` chunks reachable by a non-`nomodule` script
   tag for the polyfill's literal source (fails on `test:performance:contracts`,
   post-build). After any `next` version bump: re-run
   `pnpm patch next@<new-version>`, re-apply the same one-line edit, and
   `pnpm patch-commit`.

   **Extended to `polyfill-nomodule.js` (2026-07-23), same patch file.** Next
   also emits a 112KB legacy-polyfill bundle behind a `noModule` script tag.
   Modern browsers never fetch `noModule` scripts, and the only browsers that
   do (pre-ES-module: Chrome <61, Safari <10.1, Firefox <60) cannot parse
   this site's ES2017+ classic-script chunks anyway — the polyfills defend a
   runtime that already can't start there, and those visitors get the same
   server-rendered static HTML either way. So this deletion buys deploy
   weight (the emitted chunk went 112,594 bytes → 0, verified in `/out`), not
   modern-visitor latency — recorded honestly per §0. Pinned by the same
   contract test, which additionally asserts the *installed*
   `polyfill-nomodule.js` is zero bytes so a silently-unapplied patch fails
   fast.

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
   4. *Runtime-exact critical CSS with proof* (2026-07-19,
      `scripts/generate/inline-critical-css.mjs` — kept in-repo as a working
      tool with this verdict attached): built to remove the guessing that
      killed attempt 1 — render the real built page in real Chromium at both
      form factors, collect exactly the rules matching elements in/near the
      initial viewport (recursing Tailwind v4's `@layer` blocks; naive
      walking keeps whole layers and "extracts" the entire 142KB sheet), and
      VERIFY by re-rendering with the deferred sheet blocked and requiring
      per-element computed-style identity above the fold, under virtualized
      clocks and seeded `Math.random` (infinite rAF decorations never land
      on the same frame twice otherwise; transforms compare by form,
      `none` vs `matrix`, as the one documented tolerance). The verification
      machinery WORKED — it mechanically proved FOUC/CLS-safety and caught
      two real pre-existing bugs along the way (a scrollbar-appearance
      micro-CLS on every page load, fixed with `scrollbar-gutter: stable` in
      `globals.css`; a missing `aria-hidden` on the hero pulse ring). The
      economics did not: the homepage's genuine above-fold set is 89KB raw /
      ~11KB gzip, and adding that to the DOCUMENT — the first, unavoidably
      blocking fetch — measured FCP +150ms, LCP +150ms, mobile 0.90 → 0.85
      under the honest gate. The above-fold of this page simply uses too
      much CSS for inlining to pay. **Rejected on measurement; the
      document-size tax exceeded the round-trip saving.** Do not re-attempt
      without first shrinking what the hero actually consumes.

      `network-dependency-tree-insight` inherits the same root cause as
      render-blocking (the CSS request chain) and stays open for the same
      reason.

   All open ones (`legacy-javascript-insight`, `network-dependency-tree-insight`,
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
6. **React Compiler (`reactCompiler: true`) was actually enabled, measured, and
   reverted (2026-07) — not just discussed.** Next.js 16's Turbopack supports
   it natively (config key moved out of `experimental` in this version; no
   Babel fallback needed — confirmed zero warnings on build). Full test suite
   passed unchanged (1359/1360; the one failure was the dead-dependency
   contract needing an allowlist entry, since `babel-plugin-react-compiler`
   is loaded by Next.js internally and never appears as a literal import).
   Visual verification via a headless-Chromium pass (hero, skills, contact,
   certifications, education) found zero console/page errors and no rendering
   regressions — confirmed the compiler was genuinely active by finding
   `useMemoCache` (its runtime helper) in 3 built chunks.

   **Reverted anyway.** Three-run median Lighthouse, both form factors,
   isolated from an unrelated pre-existing HTML-budget drift by rebuilding
   with/without the flag back-to-back:

   | Metric | Desktop before | Desktop after | Mobile before | Mobile after |
   | --- | --- | --- | --- | --- |
   | LCP | 759ms | 802ms | 766ms | 786ms |
   | TTI | 763ms | 804ms | 768ms | 786ms |
   | TBT | 0ms | 0ms | 0ms | 0ms |
   | Total JS (gzip) | 320,593 B | 339,821 B | — | — |

   LCP and TTI got measurably worse on *both* form factors (+20–43ms) and
   total JS gzip grew 6%, crossing `performance-budgets.mjs`'s threshold.
   TBT stayed at *zero* before and after — there was no re-render-driven
   blocking time for auto-memoization to reclaim. This isn't a compiler bug;
   it's architectural fit. React Compiler's value is auto-memoizing code that
   *isn't* already hand-memoized — this repo's own §3.4/§3.5 mandates already
   hand-memoize every collection build and every selection-driven list item,
   enforced by a contract sweep. Layering the compiler on top of code that's
   already fully memoized adds its runtime cache-management bytes to every
   component with nothing left to reclaim. **Revisit only if a future
   refactor introduces genuinely unmemoized re-render-heavy code the manual
   discipline hasn't caught** — and re-run this same measurement, don't
   assume the verdict transfers.
7. **Two budget ceilings recalibrated with real data (2026-07-18) after
   organic content growth, not a bug, tripped them** — same pattern as item
   5's `dom-size`/`unused-javascript`/`legacy-javascript` recalibration and
   the top-of-section HTML-budget history: measure the real baseline, give
   real headroom, document why, don't just raise the number.

   *Total HTML weight* (`performance-budgets.mjs`): the new `/nursing` route
   added an 8th static HTML output file. Fresh measurement: 1,249,562B raw /
   223,892B gzip across all 8 pages — raw was already 96% of the 1,300,000
   ceiling with no headroom left for the *next* page, and gzip had already
   crossed the old 220,000 ceiling. `totalHtmlBytes` → 1,450,000,
   `totalHtmlGzipBytes` → 260,000 (~16% headroom over the new baseline).
   Per-page budgets (`homeHtmlBytes`, `singleHtmlBytes`) were untouched —
   home HTML (534,925B raw / 63,721B gzip) sits comfortably under its
   existing ceiling; this was a total-across-pages problem, not a per-page
   one, so it wasn't fixable by shrinking any single page.

   *`dom-size`* (`lighthouserc.json`/`.mobile.json`,
   `performance-regression-contract.test.ts`): 3 fresh authoritative LHCI
   runs per form factor measured 3273/3273/3273 (desktop) and
   3249/3249/3249 (mobile) elements — stable, not a fluke, and both above
   the old 3200 ceiling. Root-caused before touching the number: walked the
   built homepage HTML section-by-section (`<section id="…">` boundaries)
   and counted tags per section — `projects` (716 tags, 20 portfolio
   entries), `testimonials` (603 tags, 18 entries), and `education` (535
   tags, the full LACCD prerequisite course table) account for the bulk of
   it. All three render every item unconditionally with no pagination or
   "show more" truncation — genuine content on a portfolio site, not
   accidental markup bloat, and confirmed unrelated to any change in the
   diff that surfaced this (no homepage-rendering component was touched).
   `domSizeMaxElements` → 3900 for both form factors (~19% headroom over the
   new baseline, matching the ~19% the original 3200 carried over 2689) —
   kept as one shared ceiling rather than two separately-tightened values,
   mirroring how the original 3200 was shared despite desktop/mobile having
   different baselines (2689 vs 2672): DOM element count is a property of
   the markup, not render timing, so it doesn't vary by form factor the way
   speed-index does.

   **Promoted from `warn` to `error` (2026-07-20).** Everything above treated
   `dom-size` as a soft, informational ceiling. But this static-export React
   app's whole load-time story is hydration cost — react-dom + framer
   evaluating over the DOM — which scales *directly* with element count, making
   DOM size the one metric that is both the proven vertical-scaling gate and a
   thing byte budgets can't see ("added a section" adds elements, not
   necessarily many bytes). So it is now a hard `error` on both form factors:
   content growth is blocked at the cause, with a clear "crossed the DOM
   budget" message, instead of indirectly whenever the downstream
   `categories:performance` error eventually notices. Safe to gate hard because
   the value is exceptionally stable — LHCI (Lighthouse 12.6.1, the version
   `@lhci/cli@0.15.1` bundles) measured 3273/3273/3273 with *zero* run-to-run
   variance — and 3900 keeps its ~19% headroom, so it never false-fires on
   noise. Verified end-to-end: a full desktop `autorun` with the error-level
   assertion exits 0 at the 3273 baseline. Pinned by
   `performance-regression-contract.test.ts` (asserts the `error` level and the
   ceiling). Note the LH12/LH13 audit rename: `@lhci/cli`'s bundled LH 12.6.1
   still emits `dom-size` (what the gate asserts); a bare `npx lighthouse`
   (LH 13.4) emits `dom-size-insight` instead — don't "fix" the config to the
   insight name until the pinned LHCI version actually ships it.

   **Not attempted:** trimming `projects`/`testimonials`/`education` down to
   a paginated "show more" view would give a genuine, non-cosmetic dom-size
   win (unlike raising the ceiling, it would actually shrink the initial DOM
   Lighthouse measures) — but for a static export, an initially-collapsed
   list is *absent from the pre-rendered HTML* until client JS expands it,
   which is a real content-visibility trade-off for crawlers that don't
   execute JS, not just a technical tweak. That's a product decision about
   how the portfolio presents itself, not a performance-budget fix, and
   wasn't made unilaterally.
8. **The mobile gate got honest device throttling (2026-07-19, owner
   sign-off) — the single most consequential calibration fix in this file's
   history.** Both configs had `cpuSlowdownMultiplier: 1` and desktop-grade
   network throttling (rttMs 40 / 10240 Kbps), undocumented — the "mobile"
   gate emulated a mobile *screen* on a desktop-class CPU and network. That
   is why the gate reported 0.99 mobile while PageSpeed Insights measured
   **61** on the identical deployed build (LCP 3.5s, TBT 1,210ms, Moto G
   Power emulation). The gate wasn't noisy; it was answering a different
   question than "how does this page perform on a phone."

   Mobile now runs Lighthouse's standard mobile simulation — 4x CPU
   slowdown, slow-4G network (rttMs 150 / 1638.4 Kbps) — the same profile
   PageSpeed uses. Desktop was already honest (the standard desktop preset)
   and is unchanged.

   Recalibration was done against a **warmed** local server after two real
   pitfalls were root-caused, both worth knowing about:
   - *Cold-start inflation:* LHCI boots its `startServerCommand` fresh per
     session, and `wrangler pages dev`'s first requests (worker compile,
     lazy asset reads) run several times slower than steady-state.
     Lighthouse's lantern simulation scales observed request latencies
     under throttling, so cold-start noise inflated LCP 3–6s across
     otherwise-identical runs. `scripts/checks/serve-out-warmed.mjs`
     (now both configs' `startServerCommand`, pinned by the contract test)
     pre-fetches every page twice before printing its ready marker.
   - *The stray-dev-server pitfall:* a leftover `next dev` process was
     bound to port 3000, so an entire calibration round measured the DEV
     build (unminified chunks, next-devtools, no source maps) instead of
     `/out` — LHCI happily audited whatever answered the port. Symptoms
     that give it away instantly next time: `unminified-javascript`
     flagging 16 files on a supposedly-production build, `valid-source-maps`
     failing, chunk names like `next_dist_client_….js`. Check
     `pgrep -fl "next dev"` before trusting any local Lighthouse number.

   Measured baseline against the real production build, warmed server —
   perfectly stable across 3 runs (score 0.87/0.87/0.87, spread of 2ms on
   LCP): FCP 1360ms, LCP 3776ms, TBT 27.5ms, CLS 0.087, SI 2367ms, TTI
   4039ms. New mobile assertions from that baseline with real headroom:
   floor 0.80 (was 0.95 — a number the old dishonest simulation had made
   meaningless), FCP ≤1700, LCP ≤4500, TBT ≤300, SI ≤3000, TTI ≤5000,
   unused-javascript ≤500ms/4 files (ms estimates scale with the 4x CPU
   multiplier), legacy-javascript ≤60ms/1 file (measured 0/0 since the
   polyfill patch). Under simulated throttling the newer "insight" audits
   fire and produce NaN against a local wrangler preview, and wrangler's
   inspector WebSocket still trips `bf-cache` — 13 such audits are pinned
   to `warn` in the mobile config only (visible, non-blocking; the exact
   list is asserted by `performance-regression-contract.test.ts`).

   The honest gate also reopens §4.7 item 4's code-splitting question: that
   experiment was rejected when the page scored 0.99–1.0 with "no headroom
   left for a code-split to win back." Under honest throttling there IS
   headroom (0.87, LCP- and hydration-bound: TTI 4.0s is dominated by
   script evaluation at 4x CPU) — item 4's own revisit condition is met,
   so re-measuring splitting is now justified. Measure, don't assume, in
   either direction.

   **Re-measured same day; verdict reversed for widgets (not sections).**
   Dynamic-imported (`ssr: false`) the three project games, `SkillWeb`, and
   `RibbonBand` — all decorative or interactive-only, all already
   `useInView`-gated, none carrying indexable content (`MagneticField` was
   deliberately left static: it *wraps* the contact links, which must stay
   in the prerendered HTML). Three-run medians, warmed server:

   | Metric | Mobile before | Mobile after | Desktop before | Desktop after |
   | --- | --- | --- | --- | --- |
   | Performance | 0.87 | **0.90** | 0.99 | 0.99 |
   | TTI | 4039ms | 3957ms | 763ms | 763ms |
   | Speed Index | 2367ms | 2338ms | 764ms | 764ms |
   | LCP | 3776ms | 3763ms | 761ms | 761ms |
   | TBT | 27.5ms | 33ms | 0ms | 0ms |

   Mobile gained a real +0.03 with −82ms TTI; desktop is flat to the
   millisecond — the regression that killed the original experiment (an
   extra chunk round-trip deepening the critical graph) doesn't occur when
   the split code is *below-fold, visibility-gated decoration* rather than
   whole content sections. Item 4's core lesson stands refined, not
   contradicted: **splitting content sections was and remains wrong here;
   splitting non-content widgets wins once a slow-CPU simulation makes
   script-evaluation cost visible.** A false CLS scare during verification
   (0.1 vs the 0.087 baseline) turned out to be display rounding — the
   actual value was 0.0927, and the shifting elements were the hero
   typewriter spans, pre-existing and unrelated. Check raw `numericValue`,
   not rounded output, before reverting anything on a CLS delta.

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

- **Logic extraction**: every non-trivial component ships a pure
  `<component>-logic.ts` (the qualified form §8.1 requires — never a bare
  `logic.ts`) with all sorting/math/config — enforced by the modularization
  contract. Pure functions get direct unit tests; components
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
- **RSC islands: `page.tsx` is a Server Component; client orchestration lives
  in `PageChrome`; display sections stay Server Components where possible
  (2026-07).** Cracked the hydration floor that gates this app's load-time
  score — every prior optimization (LazyMotion, animations→CSS, no-op-wrapper
  removal, particle gating) worked *inside* that floor; this is the first one
  that lowers it. Root cause: `page.tsx` used to be `'use client'` (for
  `useScroll`/`usePerformanceProfile`/the first-interaction gate), which forces
  *every* child — all 9 sections, ~3,290 DOM elements — into the client tree
  regardless of whether they need it. Measured proof of the floor: `/capstone`
  (near-zero client components) hydrates in 0.3s of main-thread work versus the
  homepage's 3.8s.

  The split: `page.tsx` renders the tree directly with no hooks of its own;
  `PageChrome` (`src/components/ui/PageChrome.tsx`) is the one client island
  holding everything global-and-overlay (IntroCurtain, AmbientBackground, the
  floating docks, cursor effects, the interaction gate, the mobile scroll-
  progress bar) — none of it wraps page content, so it renders as a sibling of
  `<main>`. Components that took `performanceTier` as a prop from the old
  client page (`VelocityMarquee`, `RibbonBand`, `SectionHandoff`) now self-read
  it via `usePerformanceProfile()` so a server page can render them
  unconditionally — each stays its own client island, unchanged in bundle
  terms, just no longer forcing its *parent* to be client. `next/dynamic`
  `{ssr:false}` is disallowed inside a Server Component, so `RibbonBand`'s
  lazy import moved into a one-line `RibbonBandLazy` client wrapper — §3.8's
  code-split is preserved, just relocated.

  **Education converted first** (zero interactive state — display cards, a
  prerequisite table, honor pills) as the prototype, per §0's "test the
  cleanest case, measure, then decide whether to scale it" method. Its
  `useMemo`'d collection build became a bare call (a Server Component runs
  once at build — memoizing a value that's computed exactly once is pure
  overhead, not a violation of §3.4's "always memoize in client components"
  rule) and the `whileInView` entrance fades were dropped (below the fold,
  `content-visibility` already skips their off-screen paint, and a server
  component can't run client-only framer hooks anyway). `Footer` converted the
  same way — static content, zero interactivity, its entrance motion dropped.

  **Measured, not assumed:** grepped the built client chunks before/after for
  Education's own symbols (`buildEducationCollections`, `formatGradeDisplay`,
  `education-card-`) — all present before, **all absent after**: the code left
  the client bundle entirely, not just "ran once instead of per-render." Total
  client JS: 1,137,147 → 1,119,145 bytes (−18KB) from converting ONE section.
  Runtime-verified headless: zero hydration errors (`#418`/`#423`/`#425` class),
  zero console/page errors, full scroll-through, every section (including the
  client islands: CommandPalette, KeyboardShortcuts) renders correctly.

  **The `next.config.mjs` `reactRemoveProperties` gotcha, found investigating a
  false alarm during this migration:** production builds strip `data-testid`
  attributes, so a Playwright script asserting on `[data-testid=...]` against
  `/out` will find zero matches whether or not the content is really there —
  confirmed a false "content missing" reading by diffing a stashed pre-change
  build (identical zero count) and by grepping the HTML body directly for real
  content strings (present). **Lesson: verify content presence in a production
  build by real content strings or element structure, never by `data-testid`
  — that attribute does not exist in what ships.**

  **The floor is not eliminated, only lowered — react-dom itself (~220KB) and
  every remaining client island still hydrate.**

  **Certifications converted next (same day), with one refinement to the
  recipe.** It had one piece of apparent client state — a live-clock `now`
  used only to bucket each credential into verified/expiring/expired — that
  turned out to be a hydration-workaround artifact, not a real interactivity
  requirement: `now` existed as a `useState` anchored at the Unix epoch
  (`PRE_HYDRATION_STATUS_ANCHOR`, deleted) specifically so the first client
  render wouldn't mismatch the static HTML, then corrected itself via
  `useEffect` a frame later. A Server Component doesn't have that problem at
  all — `new Date()` runs once, at BUILD time, and *is* the static HTML, so
  there's no second render to mismatch against. This is strictly more honest
  than the anchor trick, not a compromise: a visitor now sees status computed
  as of the last deploy (this site auto-deploys on push) instead of a screen
  that briefly, incorrectly claimed every credential was "verified" before the
  real clock caught up. `HeartbeatMonitor` (genuine hover-driven interactivity)
  stayed its own client island, unchanged. Two logic exports
  (`getVerifiedCheckmarkTransition`, `getInProgressAnimationOffset`) went
  dead alongside the dropped `whileInView` entrance animations and were
  deleted, not left as unused code — caught immediately by
  `dead-logic-export-contract`. Measured: client JS 1,119,145 → 1,108,741
  bytes (−10.4KB; −28.4KB cumulative with Education), Certifications' own
  symbols (`buildCertificationCollections`, `cert-row-`) confirmed absent
  from the built client chunks. Runtime-verified: zero console/page errors,
  HeartbeatMonitor and every credential still render correctly.

  **Testimonials, Experience, Skills, Contact, and Projects were assessed and
  are correctly staying client — this is a recorded verdict, not a TODO.**
  Reading each component in full (not guessing from its section name) found
  two genuinely different shapes from Education/Certifications, and forcing
  either into a server split would trade a real behavior for a bundle-size
  guess:

  - **Testimonials and Experience have `useState` woven through *most* of
    their rendered tree**, not isolated to one small widget. Testimonials'
    `relationshipFilter`/`spotlightIndex` drive the spotlight card AND which
    testimonials render in the grid; Experience's `activeExperienceIndex`
    drives the nav-button active styling, the timeline dot animation, AND
    `ExperienceCard`'s `isActive` prop, across the entire timeline. There is
    no clean "display bulk" left over once the interactive slice is
    extracted — the interactive slice *is* most of the section. Skills is the
    same shape for its "Core Competencies" column (`technicalView` re-sorts
    it), though its other two columns (Domain Expertise, Certification
    Highlights) are pure display — extracting just those would require
    restructuring the shared `staggerChildren` animation wrapper that
    currently spans all three columns, a real design change, not a free
    refactor.
  - **Contact and Projects have no `useState` at all**, but both anchor
    `useScroll({ target: sectionRef, offset: [...] })` on the outer
    `<section>` itself to drive a scroll-linked decoration (Contact's
    per-social-link reveal progress; Projects' chapter-progress bar and
    rotating rings). Moving that ref to a child island — the only way to make
    the section root a Server Component — changes what "0%/100% scrolled"
    means for the effect, a measurable behavior change to a feature this
    site's own §7 engagement doctrine explicitly values. Untested speculation
    about whether the new trigger points look the same is exactly what §0.5
    exists to rule out.

  Converting any of these five would mean either accepting an unverified
  behavior change or doing the restructuring work with no measured client-JS
  win to justify it (their interactive slice is too large a fraction of the
  section for extraction to meaningfully shrink the bundle the way Education's
  535-element, zero-interactivity conversion did). **The mandate going
  forward is therefore precise, not "convert everything":** a section is a
  server-conversion candidate only when its interactive state is genuinely
  isolable into a small island *without* moving a scroll-anchor ref or
  restructuring a shared animation wrapper — check by reading the component in
  full, the same way this section did, not by its name. `rsc-boundary-
  contract.test.ts` locks in what's already converted (`page.tsx`,
  `Education.tsx`, `Footer.tsx`, `Certifications.tsx` must stay Server
  Components; `PageChrome` must stay the client island) so a future edit
  can't silently re-add `'use client'` and re-inflate the bundle — grow that
  list only when a future section is actually re-assessed and found isolable,
  never by assumption.

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
   zero-warning lint, the entire `pnpm test` suite (900+ tests, all
   contracts, including the networked freshness checks), and mutation testing
   scoped to whichever changed files are logic modules (see item 13) —
   nothing is deferred to push time. A commit cannot be created with a red
   gate; `pre-push` re-verifies identically as a redundant safety net (catches
   drift from a `--no-verify` commit or a later rebase).
   `complexity-doctrine-contract.test.ts` asserts the hook wiring itself —
   including that pre-commit and pre-push stay byte-identical — so the gate
   cannot be silently narrowed or unwired. `pnpm run test:complexity` remains
   available as a fast, offline, manually-run subset (complexity doctrine,
   algorithm/data-structure, animation gates, modularization, dead logic
   exports, asset weight, config-integrity, docs-quality, lifecycle-hygiene,
   headers-integrity) for quick iteration — it is a convenience command now,
   not the commit gate.

   **GitHub-hosted CI is enabled** (re-enabled 2026-08 when the repo went
   public — GitHub Actions minutes are free for public repos on standard
   runners, so the 2026-07 cost concern that disabled it no longer applies).
   `.github/workflows/ci.yml` runs on every push to `master` and every pull
   request, as a second, independent pass behind the pre-commit/pre-push gate
   above. Mutation testing stayed wired into the local gate ("runs on every
   commit," not just an occasional manual sweep) even after CI came back —
   catching a regression at commit time is still cheaper than catching it in
   CI a push later.

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

   It recurred (2026-07) via the exact remedy the freshness contract itself
   prints: `pnpm outdated` flagged `postcss` (8.5.16 → 8.5.17), running the
   suggested `pnpm update --latest postcss` rewrote the lockfile's recorded
   specifier for it to `^8.5.17` — but for an *overridden* package, pnpm's
   own fresh resolution always writes the override string
   (`pnpm-workspace.yaml`'s `>=8.5.10`) as the canonical specifier, never a
   caret range from `package.json`, regardless of what `package.json` says.
   `pnpm update --latest <pkg>` doesn't know that and writes the caret range
   anyway, producing the identical drift with zero visible symptoms locally
   (warm `node_modules` install still "succeeds"). Caught immediately by
   this same clean-slate check. Fix verified by reproducing the scratch-dir
   install by hand: regenerate from a truly clean directory and diff the
   result against the repo's lockfile rather than trusting a local `pnpm
   install` (which reported "Already up to date" throughout, never
   re-touching the stale specifier on a warm checkout). **Second-order
   lesson: `pnpm update --latest <pkg>` is not a safe blind reflex for a
   package with a `pnpm-workspace.yaml` override — verify the lockfile's
   recorded specifier still matches the override afterward, the same way
   this contract already does.**
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
7. **A contract sweep is only as good as its pattern — audit the pattern
   itself occasionally, not just its results.** The `no module-level data
   catalogs in components` sweep existed for a long time and passed
   cleanly — but its regex only matched bare `const xxx = [` (array
   literals, no `export`). It never had a chance at `export const metadata:
   Metadata = {...}`, and `src/app/layout.tsx` carried a 190-line inline
   SEO/OpenGraph/robots object — ~90 keywords, zero completeness tests —
   for months while the sweep it should have tripped stayed green. The same
   gap let `SectionRail.tsx` and `KeyboardShortcuts.tsx` keep their content
   catalogs (`RAIL_SECTIONS`, `SHORTCUTS`) inline right next to a companion
   `*-logic.ts` that held only the *functions* operating on that data — the
   data itself never made the trip. Fixed 2026-07: the pattern now matches
   `(?:export\s+)?const \w+... = [\[{]` (object literals and exported
   consts too), all four page metadata blocks moved into
   `src/data/metadata.ts` (root) and per-page `./metadata.ts` files, both
   catalogs moved into their existing logic modules. The same audit found
   the site's own domain hardcoded independently in 9 files (14
   occurrences) — `src/data/site.ts` (`SITE_URL`, `getPageUrl`) is now the
   single source of truth, enforced by a repo-wide sweep of its own.
   **The lesson generalizes: when a sweep's *pattern* — not just its
   coverage — has a blind spot, everything matching that blind spot
   accumulates invisibly. Periodically ask a sweep "what would this miss?"
   the same way you'd ask it "what does this catch?"**

   A sharper case of the same lesson (2026-07): the `no-restricted-syntax`
   ESLint rule banning `map().filter()` is a single AST selector matching one
   fixed expression shape (`a.map(f).filter(g)`). Splitting the identical
   two-array allocation across statements —
   `const mapped = items.map(f); const result = mapped.filter(g);` — passes
   it cleanly while doing the exact same work. A regex or single-selector AST
   rule can only ever match a fixed shape; it has no concept of "this
   variable's value came from that other line." Closed by
   `scripts/eslint-rules/no-split-map-filter.mjs`, a real custom ESLint rule
   using the scope manager (not a name-string guess) to walk a `.filter()`
   call's receiver back to its declaration and check whether *that* was a
   `.map()`/`.flatMap()` result — the same class of fix as the coverage gap
   above, but for evasion-by-restructuring instead of evasion-by-syntax the
   pattern never anticipated. Tested with ESLint's own `RuleTester`
   (`src/eslint-rules-contract.test.ts`) per rule 8 below — a lint rule is
   test infrastructure too.
8. **A test that cannot fail is worse than no test — and test
   *infrastructure* needs tests of its own.** A 2026-07 audit found 45+
   assertions that could never fail: `expect(document.body).toBeTruthy()`
   (always exists in jsdom), `expect(container).toBeTruthy()` (RTL's render
   container is always an element), and `.toBeTruthy()` on MotionValue
   wrappers (an object is truthy whatever its numeric payload — even 0
   passes). Worse, the shared framer-motion mock silently froze
   `useTransform` at creation time, which made real motion-math assertions
   *unwritable* — and because nothing tested the mock, nothing could catch
   it. Both fixed structurally: the mock's math now lives in
   `src/test-utils/motion-mock.ts` (a first-class, unit-tested module —
   lazy computed values, clamped piecewise-linear interpolation, live style
   resolution), and `test-quality-contract.test.tsx` (a) bans always-true
   assertion receivers repo-wide, (b) re-verifies the assembled mock's
   fidelity end-to-end through the real `framer-motion` import on every
   run, and (c) pins every file-local `vi.mock('framer-motion')` to a
   reasoned registry — a local mock silently opts its file out of shared-
   mock fidelity, so it's a decision on record, not a default. Related
   hygiene: when production code loses a path (ProfileImage's per-mousemove
   `getElementById` became a ref), delete or rewrite the test that mocked
   that path — a test faithfully exercising removed behavior is another
   test not doing what it claims. **The lesson generalizes: audit
   assertions for "could this ever fail?", and treat shared mocks as
   production code — modular, unit-tested, and contract-guarded.**
9. **Content data needs the same freshness discipline as dependencies — a
   dead link is drift too.** A reader reported the Delta Epsilon Tau honor
   society link went to a dead page (its own domain had lapsed). Auditing
   every external URL referenced from `src/data` found three more dead:
   Connecticut College's Ammerman Center sub-page (removed in a site
   restructure — one of its two occurrences silently survived an earlier
   bulk edit; only re-running the checker caught it, not trusting the
   edit's own "all occurrences replaced" claim), CIHE's old accreditor
   domain (rebranded to NECHE), and a defunct 2020 COVID-response project's
   site (fixed to a Wayback Machine capture). Same shape as the
   dependency/GitHub-Actions freshness holes: an ecosystem (this site's own
   outbound links) that nothing was watching. Fixed with the same pattern
   used everywhere else in this file — a checked-in ledger
   (`scripts/checks/external-links-ledger.json` — lives beside its
   generator, not in `src/data/`, since that directory's hygiene contract
   requires hand-written camelCase `.ts` source, not a generated JSON
   artifact) plus a fast, offline contract
   (`external-links-contract.test.ts`) that fails on any dead/missing/
   orphaned/stale entry — but with one deliberate difference: unlike
   `pnpm outdated`/`pnpm audit` (reliable, fast, high-uptime APIs), ~90
   third-party sites (LinkedIn, ResearchGate, small institutional pages)
   are neither reliable nor fast enough to hit on every commit, and would
   make the gate flaky. So the network check
   (`scripts/checks/check-external-links.mjs`, `pnpm run check:links`) runs
   on a ledger cadence a human (or a scheduled job) triggers, not inline
   with every commit — the pre-commit gate only ever reads the checked-in
   result. Bot-blocking platforms get a documented `BOT_BLOCKING_HOSTS`
   classification (`blocked`, not `dead`) so a 403 from LinkedIn doesn't
   fail the build for a link that's actually fine. **The lesson
   generalizes: not every freshness check belongs in the fast path — when
   the thing being verified is inherently less reliable than your own
   CI, verify on a cadence into a ledger, and gate fast on the ledger.**
10. **The checklist for any new component or feature:**
    - [ ] Pure logic extracted to `<component>-logic.ts` (qualified — §8.1) with unit tests
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
11. **When a contract fails, fix the source.** If the *requirement* genuinely
    changed (e.g., a 5th education item changes the grid), update source, test,
    and the documentation together — that is a requirements change, not a
    test weakening.
12. **Commits are small, single-topic, and self-explanatory.** One logical
    change per commit — an optimization plus its ratchet contract plus its
    docs is *one* topic (rule 1); an unrelated dependency bump is another.
    Subject line: imperative, ≤72 chars, says *what*; body says *why* and
    names anything non-obvious (measurements, the bug class prevented, the
    revisit condition for a pin). Anyone reading `git log --oneline` should be
    able to follow the work without opening a single diff. Never mix refactors
    with behavior changes in one commit, and never commit with a red gate
    (rule 3).
13. **100% coverage proves a line executed, not that a test would fail if the
    behavior it pins broke — mutation testing (Stryker, `pnpm run
    test:mutation`) checks the second claim directly.** It mutates production
    logic (flips a sign, an operator, a boundary, a string literal) and
    re-runs the tests; a mutant that survives means some test executes that
    line without actually asserting its effect. First real run (2026-07) on
    `command-palette-logic.ts` found 38 of 248 mutants survived (84.68%)
    despite 100% coverage, and every one of substance was a genuine gap, not
    noise: `keywords: item.name.toLowerCase()` mutated to `.toUpperCase()`
    survived because the one test exercising keyword-only matching also
    happened to match on the label, silently masking that case-insensitive
    keyword search was untested end-to-end; a `-Infinity` fallback (the "no
    keyword match" sentinel in `scoreCommand`) flipped to `+Infinity` survived
    because no test pinned an exact score, only relative comparisons that a
    constant sign flip doesn't change; and an LRU cache's `detach()` losing its
    tail-pointer update survived because the existing tests only ever walked
    the list forward from `head` — never checked `cache.tail` or the `.prev`
    chain that only a *second* eviction would expose. Also surfaced several
    true equivalent mutants (e.g. an early-return whose fallthrough path
    provably produces the identical result) — verify column-precise, not just
    by line, before trusting a "Survived" verdict enough to act on it. Scope
    excludes `src/data/**` (declarative content catalogs, not logic — mutating
    a string literal in a company name has no meaningful signal) and every
    `*.test.ts(x)` file (only production code is mutated). The unscoped
    `pnpm run test:mutation` (this whole file's `mutate` glob, every
    production source at once) stays a manual, occasional-sweep command — a
    full run is far slower than the ~20s test suite, so it's still never run
    unscoped in a hook. **But mutation testing itself is no longer
    manual-only** (2026-07, see the mandate below): `pnpm run
    test:mutation:changed` — Stryker scoped via `--mutate` to only the
    *logic-module* files (`logic.ts`/`*-logic.ts`/`engine.ts`/`builders.ts`,
    the exact same convention `dead-logic-export-contract.test.ts` keys off)
    a commit/push actually touches — runs inside pre-commit AND pre-push, and
    fails the commit if a changed logic module's mutation score drops below
    `stryker.config.mjs`'s `break` threshold (90). Deliberately NOT every
    changed `.ts(x)` file: an early attempt scoped to all production files
    and run against two real components
    (`GlyphDissolveName.tsx`/`ReactionTimeGame.tsx`, both from the same
    2026-07 session) scored 48% and 68% — nowhere near 90% — not from being
    undertested, but because JSX rendering code is full of low-information
    mutations (`{' '}` → `{''}`, a className ternary's unreachable-in-practice
    branch) that no amount of reasonable component testing chases. Every
    100%-mutation-score file logged in this item is already a logic/engine/
    builders file, never a component, for exactly this reason — the
    modularization contract already keeps exhaustively-testable logic out of
    components on purpose, so the mutation gate should be scoped to match
    where that logic actually lives, not to every file that happens to
    change. `pnpm run test:mutation` (the full, unscoped, manual sweep) still
    covers component files too, for whoever wants to look at them by hand.

    **Known tooling caveat:** at least one mutant has been confirmed to report
    "Survived" from Stryker's own harness while the identical mutation, applied
    directly to the source and run through a plain `vitest run` of the
    affected test file, actually fails — reproduced under both `perTest` and
    `off` coverage-analysis modes, so it isn't a coverage-attribution problem,
    more likely a Stryker↔Vitest module-caching interaction. Treat "Survived"
    as a strong lead, not a verdict: before spending real effort writing a new
    test for one, reproduce it by hand (apply the exact mutation to a copy of
    the source, run the affected test file directly) to confirm it's real
    before trusting the count.

    Reproduced September 2026 with Stryker 10 / Vitest 5: the hero navigation
    mutation `key === 'ArrowLeft'` → `key !== 'ArrowLeft'` was reported as
    surviving, but applying that exact mutation directly caused three tests
    in `hero-logic.test.ts` to fail. The scoped harness score (20.97%) is
    therefore not a reliable verdict on this change; changing coverage mode
    and restarting workers did not resolve the discrepancy. The source was
    restored and the full suite passed. Do not lower the mutation threshold.

    **2026-07 sweep across the logic-heavy files** pushed five files from
    partial scores to at-or-near 100%, using the hand-verification protocol
    above for every ignore: `skill-web-logic.ts` (32 real gaps closed with
    exact-value physics tests plus 10 hand-verified equivalents — mostly
    "out-of-bounds Float32Array access is a silent no-op in JS" and
    "distSq/dist is clamped *to* the exact constant it's compared against, so
    equality is a no-op" idioms) → 100%; `structured-data/structured-data-
    builders.ts` (35 real gaps closed — the survivors were
    `'@type'`/`name`/`inLanguage` Schema.org literals silently going untested
    at exact-string precision, a real SEO risk, not cosmetic noise, plus 1
    confirmed-equivalent `.trim()` and 9 confirmed Stryker-harness false
    positives) → 0 real survivors; `hero/interactive-particles/interactive-
    particles-engine.ts` (35 real gaps, 6 equivalents) → 100%;
    `hero/background-particles/background-particles-engine.ts` (all 47
    survivors were real — this file is a genuine per-frame simulation, not
    decorative config — closed with 22 new tests and 4 equivalents; the
    exercise also caught a real latent bug: an asymmetric bounds-check where
    an out-of-range spatial-grid column index aliases into a *valid but
    wrong* neighboring cell, unlike the row index's always-safe out-of-bounds
    case, now pinned by a dedicated regression test) → 100%; and
    `certifications/certifications-logic.ts` (new
    file this session — 4 gaps: the reactive-status icon color/path catalogs
    untested at exact value, a `\s+`→`\s` regex narrowing, a dead-branch mask
    in `buildVerificationHref`, and an in-progress sort-order check that
    happened to pass on real data where both fixture rows tied on the same
    date) → 100%. One file, `ambient-background-logic.ts` (49 survivors, all
    Framer Motion keyframe/easing/duration literals in a decorative ambient-
    orb config with zero behavioral consequence), was excluded from Stryker's
    `mutate` scope entirely after the same hand-verification — it is a data
    catalog like `src/data/**`, not logic. Two lessons reinforced: (1) a
    survivor's "cosmetic-looking" string literal is only safe to ignore if it
    truly has no observable effect — a Schema.org `@type` string is not
    cosmetic even though it looks like one; (2) chasing survivors surfaces
    real bugs, not just test gaps, often enough that the exercise pays for
    itself independent of the mutation score.

    **The mandate, stated plainly (2026-07):** every new logic file ships
    with a Stryker pass in the same session that introduces it — not as a
    someday cleanup, as part of writing the tests in the first place — pushed
    to 100%, or to the smallest set of hand-verified equivalent mutants the
    file's actual logic allows. `stryker.config.mjs`'s thresholds moved from
    90/70 to **100/90** to match what every swept file has actually achieved,
    not what felt safely attainable when the tool was first wired in. This is
    NOT the same as making the process itself a blocking 100%-or-fail CI
    gate: mutation testing's own literature (and this file's own accumulating
    equivalent-mutant log) shows that a genuine 100% raw score is usually the
    wrong target for an entire codebase — some mutants are provably
    equivalent (see the three below), and a gate that can never truthfully
    reach zero survivors either stays permanently red or pressures deleting
    real code / writing meaningless tests just to silence it. The realistic,
    honest version of "mandate 100%" is: 100% *or a documented reason* — never
    a silent, unexplained survivor — and that bar is enforced by review
    discipline (this file, commit messages, the hand-verification protocol),
    not by a CI number, because the tool is too slow to gate on (see the
    manual-only rationale above) and equivalence is closer to code review's
    variety of engineering judgment than the scoring gate can automate.

    **2026-07 sweep, round two** (prompted directly by "mandate 100% on all
    mutation testing" — audited, not blindly adopted as a literal blocking
    rule, for the reasons above): three files built earlier in the same
    session — `predator-prey-logic.ts`, `reaction-time-game-logic.ts`, and
    `glyph-dissolve-logic.ts` — had never been run through Stryker at all.
    First pass: 95.26% combined, 23 survivors. Every one was real:
    `applySeek`'s existing exact-value tests all held `entity.x` at 0 and
    `dy` at 0, which cannot distinguish `targetX - entity.x` from `targetX +
    entity.x`, nor the dx/dy terms of the distance and desired-velocity
    formulas, from their arithmetic-operator mutants — added a 3-4-5-triangle
    diagonal case with a nonzero entity position to isolate exactly those
    terms. `computeScatterTarget`'s fixed-stream test used an angle of
    exactly π/2, where `cos(angle)` is 0 — added an angle=0 case to isolate
    the x-term's sign. `computeGlyphParticlePosition`'s only exact hovering
    assertion used elapsed=0 (where `/1000` and `*1000` both give 0) and its
    only nonzero-elapsed test used a loose `not.toBeCloseTo` that a
    differently-wrong-but-still-nonzero offset also satisfies — added an
    exact-value case at a nonzero elapsed time, recomputing the expected
    offset via the already-pinned `computeSwirlOffset` rather than a second
    hand-derived formula. `nudgeTarget` only had an ArrowRight (x-axis) test,
    missing a y-sign flip entirely — added an ArrowDown case.
    `createInitialEntities`'s spawn-band tests used loose
    `toBeGreaterThanOrEqual`/`toBeLessThanOrEqual` bounds, which a `*` → `/`
    mutant can still satisfy by chance — replaced with an exact-value test
    that independently re-derives the expected sequence from the same seeded
    PRNG. Two `sampleGlyphPositions` loop bounds (`py < image.height`, `px <
    image.width`) had never been tested against an out-of-bounds row/column
    that would only be reached by a `<` → `<=` mutant — added stub images
    with bright pixels one row/column past the declared bounds. And two
    `PAUSED_CAPTION`/`SIMULATION_ARIA_LABEL` string literals were only ever
    asserted by re-importing the SAME constant on both sides of the
    comparison (`expect(...).toBe(PAUSED_CAPTION)`) — a mutant that empties
    the constant empties both sides at once, so it can never be caught that
    way; fixed by asserting against a hardcoded literal instead. Second pass:
    98.76%, with exactly three survivors, all confirmed genuine equivalents
    on re-verification (the incremental cache initially still reported the
    fill-style string as "Survived" after it was fixed — cleared per the
    known-caveat protocol above, confirming that caveat is not theoretical):
    `elapsedMs <= 0` → `< 0` in `clampProgress` (once this line is reached,
    `durationMs` is already known to be positive from the check above it, so
    `0 / durationMs` is always exactly 0 regardless of which branch runs —
    provably identical output for every input); `steerMagnitude > maxForce`
    → `>=` in `applySeek` (at exact equality, `scale = maxForce /
    steerMagnitude` is exactly 1, making the "clamp" a no-op whether or not
    the branch executes); and `previousBestMs !== null` → `true` in
    `isNewBestReaction` (the mutant falls through to `reactionTimeMs < null`,
    which JS coerces to `reactionTimeMs < 0` — always false, since a
    click-minus-go duration can never be negative — identical to the original
    short-circuit). All three documented inline at their source, not just
    here. Final: predator-prey-logic.ts and glyph-dissolve-logic.ts at
    99.1-99.3% (one equivalent each), reaction-time-game-logic.ts at 99.04%
    (one equivalent) — effectively 100% real coverage, the same standard as
    every other swept file.

    **This is a standing practice, not a one-time cleanup.** Every mutation
    survivor chased — whether it turns into a new test or a documented
    equivalent — is a real lesson about a blind spot in how this codebase
    writes tests, and every one gets logged here (or inline at its source,
    linked from here) when it's found, the same way every bug fixed anywhere
    in this codebase gets a permanent regression test in the same commit
    (item 1). The pre-commit gate now runs this on every commit that touches
    a logic module (see the mandate two paragraphs up) — each new survivor it
    surfaces goes through the same hand-verification protocol as everything
    above: fix a real gap with an exact-value test, or write down PROVABLY why
    it's equivalent, in the same commit. A survivor that gets silently
    ignored, or an equivalent claim that isn't provable the way the three
    above are, is exactly the "whitelisted because it's hard" failure item 18
    exists to stop — mutation-testing exemptions are held to that same bar,
    not a special case of it.

    **2026-07 sweep, round three:** ran the remaining ~35 never-swept logic
    modules through Stryker in one pass. 34 of 35 landed at 100% on the first
    try — this codebase's exact-value-testing habit generalizes, it isn't
    specific to the handful of files chased by hand so far. The one
    exception, `dna-snp-game-logic.ts` (never swept before — the "Spot the
    SNP" mini-game), had 11 survivors, all real except one: `Math.floor(
    random() * N)` mutated to `random() / N` in three places survived because
    every existing `generateRound` test asserted loose bounds/membership a
    division can still satisfy for many seeds — closed the same way as
    `createInitialEntities` above, independently re-deriving the expected
    sequence from the same seeded PRNG. `BASE_COLOR_CLASSES`'s four Tailwind
    literals were only ever asserted by re-importing the same constant on
    both sides of the comparison — the exact PAUSED_CAPTION/
    SIMULATION_ARIA_LABEL mistake from round two, same fix (hardcoded
    literals). And `getTileClassName('reveal-snp', …)` /
    `getTileClassName('guessed-incorrect', false)` were never called at
    all — `getTileVisualState`'s own tests only checked that the STATE NAME
    came back, never that the class-name/animation derived from it was
    correct, so the `'reveal-snp'` class value and two of the three
    animated-states Set members went completely unexercised. The one true
    equivalent — `new Array(length)` vs `new Array()`, since the following
    loop assigns every index 0..length-1 sequentially and a plain array grows
    to fit each write identically to a pre-sized one — documented inline at
    its source. Final: 98.92%, one equivalent.

    **2026-07, nursing-tracker feature:** six new logic modules
    (`matching-logic.ts`, `gpa-logic.ts`, `window-logic.ts`,
    `readiness-logic.ts`, `dashboard-logic.ts`, `program-card-logic.ts` under
    `src/app/nursing/`) swept in the same session they were introduced, per
    the mandate. First pass: 78.79%, 83 survivors, almost all real: every
    style dispatch table (`FULFILLMENT_STYLES`, `WINDOW_STATUS_STYLES`,
    `READINESS_BAND_STYLES`, `getChemistryBadge`) had only a `showPulse`/
    `.label` spot-check, never an exact `{label, className}` assertion per
    entry — same class of gap as `BASE_COLOR_CLASSES` in round three, fixed
    the same way. `getActiveWindow`'s original single-pass, three-way branch
    (return-early / update-upcoming / update-closed all interleaved in one
    loop) was rewritten into three sequential single-purpose passes (find
    active, then find soonest upcoming, then the first remaining entry is
    closed) specifically because the entangled version was both hard to
    reason about and hard to kill mutants in — same lesson as `applySeek`
    above: untangling control flow shrinks the mutation surface for free.
    `pickBestCourse` got the same treatment (one loop tracking a single
    running-max `bestGradePoints`, replacing a mid-loop "does this beat best
    or is there no best yet" decision). `getProgramProgressCount`'s test used
    a symmetric 2-completed/2-other mix, so `state === 'completed'` and its
    `!==` mutant produced the same count by coincidence — fixed with an
    asymmetric 3/1 split. Two off-by-one boundary gaps (`now < opens`/`now >
    closes` in `getWindowStatus`) had never been tested at the exact instant
    — added now-equals-opens and now-equals-closes cases confirming both
    boundaries are inclusive. Second pass: 99.65%, one survivor, confirmed
    equivalent: `course.gradePoints !== undefined` in `matching-logic.ts`'s
    `pickBestCourse` — required for TypeScript to narrow `gradePoints` to
    `number` before the following assignment, but at runtime provably
    redundant, since JS's `>` returns `false` whenever either operand is
    `undefined`, so the following `course.gradePoints > bestGradePoints`
    comparison already excludes an ungraded course on its own. Documented
    inline at its source. Final: matching-logic.ts 98.57% (one equivalent);
    the other five files at 100%.
14. **A rendered-text assertion is only as strong as its regex — a wildcard
    is a mutant's escape hatch.** `expect(screen.getAllByText(/expires in 3
    months.*renew soon/i))` passes as long as *something* sits between the
    two anchors; it can't tell "renew soon" from "renew never" if the mutant
    also mangles what's in between, and it can't tell one exact number from
    another the way `toBe`/`toEqual` on an exact string can. Found in this
    repo's own `reactive-status.test.tsx` (2026-07) and fixed to an exact
    string. Prefer, in order: an exact string passed to `getByText` (RTL
    normalizes whitespace but still requires the full text to match); a
    precise regex with real anchors and no `.*`/`.+` spanning meaningful
    content (a bounded negative lookahead like `/expires in 1 month(?!s)/` is
    fine — it's testing an exact boundary, not waving through arbitrary
    content); or splitting one loose assertion into two exact ones. Enforced
    by `test-quality-contract.test.tsx`'s wildcard-regex sweep for every
    `getByText`/`getAllByText`/`queryByText`/`queryAllByText`/`findByText`/
    `findAllByText` call in `src/**/*.test.ts(x)`. Scope is deliberately
    narrow: static-source-text sweeps (contract tests scanning `.ts`/`.tsx`
    source for a coding convention, e.g.
    `animation-regression-contract.test.ts`) are a different category — they
    assert on code shape, not rendered output the user sees, and already
    carry their own review history — so `.*` there is out of scope for this
    rule.
15. **A structural sweep written as a regex inherits every evasion a fixed
    text shape has — the fix is to walk the real AST, not to write a cleverer
    regex.** A 2026-07 audit (prompted directly by "regex checks are easily
    cheated") re-examined every text-pattern sweep in
    `algorithm-and-datastructure-contract.test.tsx` and confirmed the concern
    against three concrete, previously-invisible gaps, all in the fast-offline
    `pnpm run test:complexity` subset that doesn't run lint:
    - The repo-wide `map().filter()` sweep matched only the direct chain
      (`a.map(f).filter(g)`) — the split-across-a-variable evasion that rule
      7's `no-split-map-filter.mjs` already closes *at lint time* was still
      wide open in this Vitest-native, lint-independent copy.
    - The mousemove→setState sweep extracted a handler's body with a
      brace-counting regex (`` const ${name} = \([^)]*\)[^{]*\{([\s\S]*?)\n    };
      ``) keyed to one exact literal shape — a handler wrapped in
      `useCallback`/`useMemo` (this repo's *own* established pattern, e.g.
      `PredatorPreyChase`'s `handlePointerMove`) didn't match, and a
      non-match silently `continue`d rather than failing. The sweep had
      never actually checked this codebase's real handler shape.
    - The decorate-sort-undecorate sweep's regex stopped scanning a
      comparator's body at the first `{` or `;` and only matched an inline
      arrow — a multi-statement comparator, or one extracted to a named
      function and passed by reference (`arr.sort(cmp)`), both evaded it
      while still re-parsing the date key per comparison.

    The same audit found two more instances of the identical class outside
    that file. `dead-logic-export-contract.test.ts` collected candidate
    exports with `/^export function (\w+)/` — a logic module exporting via
    `export const name = (...) => {}` instead of a function declaration (a
    purely stylistic refactor) silently escaped the dead-export sweep
    forever; confirmed by adding a synthetic dead arrow export and watching
    the old pattern miss it entirely. And `route-deployment-regression.test.ts`
    isolated the worker's HTML-response Cache-Control branch with
    `/isHtmlLikePath\(resolvedPath\)[\s\S]*?\}\s*\n/` — a lazy scan for the
    *first* `}` after the call site, which only lands on the branch's real
    closing brace because today's branch body happens to contain no nested
    block of its own. Proven exploitable with a synthetic branch containing
    one inner `if`: the old regex stopped at the inner block's brace and
    reported `no-store` absent (false pass) even though a `no-store` line
    sat right after it, still inside the real branch.

    All five were rewritten to parse each file with the real TypeScript
    compiler (`ts.createSourceFile` + a `forEachDescendant` walk) and match
    on actual AST shape and binding structure — including the split-variable
    map/filter form, `useCallback`/`useMemo`-wrapped and function-declaration
    handlers (with one level of call-outs to same-file helpers followed), and
    by-name-resolved sort comparators — the same scope-aware rigor rule 7
    already established for the ESLint layer, now also covering the
    lint-independent fast path. Verified against synthetic offending files
    for all three shapes before removal, confirming each new check actually
    fails where its regex predecessor silently passed. **The lesson
    generalizes: any contract that scans source *text* for a coding shape
    (not rendered user-facing output — see rule 14's carve-out) is only as
    strong as that shape's literal-ness. A regex is fine for a genuinely
    fixed literal (an import path, a exact string constant); for anything
    with dataflow — "this variable came from that call," "this handler is
    the callback registered on that listener," "this comparator eventually
    references that function" — reach for the real parser, because a fixed
    pattern has no way to represent "any of these equivalent shapes."**
16. **A style prop threaded through a wrapper only reaches what the wrapper
    itself paints — not a differently-positioned descendant.** Shipped 2026-07:
    the Hero name went fully invisible. `GlyphDissolveName` wraps
    `TypewriterEffect` and received a `className` prop carrying the
    `bg-clip-text text-transparent` gradient — but it applied that className
    to its OWN outer `<span>` wrapper and never passed it to
    `<TypewriterEffect>` at all. `TypewriterEffect`'s actual visible-text span
    is `position: absolute` (its own stacking/positioning context, needed for
    the zero-CLS typing effect) — a `background-clip: text` gradient set on
    an ancestor never reaches glyphs painted by a differently-positioned
    descendant, and the inherited `text-transparent` had no gradient to
    replace it with. This is the SAME root cause as constraint #15's
    persistently-transformed-descendant rule (a CLAUDE.md rule that predates
    this bug) wearing a different disguise — descendant positioning/stacking
    context breaking an ancestor's paint, not descendant transforms breaking
    it — which is exactly why the same class of bug slipped through the
    existing check. `TypewriterEffect.tsx` even carries an inline comment
    stating this requirement, but a comment isn't enforced; a future caller
    can make the identical mistake without ever reading it (fixed here by
    reproducing this exact miss). **The lesson generalizes: any component
    that forwards a caller-supplied style prop must verify that prop actually
    lands on the element that renders the affected content — never assume a
    wrapper's className "flows down" to a child's own differently-positioned
    markup.** Closed two ways: the immediate fix (route `className` through
    to `<TypewriterEffect>` directly), and a repo-wide sweep
    (`a11y-regressions.test.tsx`) that flags any file forwarding its own
    `className` prop onto some OTHER JSX element while never forwarding it to
    a `<TypewriterEffect>` it also renders — the same "prove it, don't just
    fix the one instance" pattern as every sweep above.
17. **A user-perceived-timing measurement must be stamped from the frame that
    actually renders the change, not the instant the code that schedules it
    runs.** Shipped 2026-07: "Catch the Lapse" (the reaction-time game)
    systematically over-reported every reaction time, making genuinely fast
    players read as merely average and average players read as slow.
    `goTimestamp` was captured with `performance.now()` inside the
    `setTimeout` callback that ALSO flipped the round to its "go" state —
    before React re-rendered and the browser actually painted the color
    change the player reacts to. React's commit and the browser's paint both
    take real time (a frame or more, worse under load from this page's other
    animations), so every measured reaction was inflated by that render+paint
    latency before the player could have possibly reacted at all. Fixed by
    splitting the concerns: the timer only flips the phase; a separate effect
    keyed on that phase change waits for the NEXT `requestAnimationFrame` and
    uses THAT frame's own timestamp — the frame the browser is about to
    paint — as the stimulus-onset time. **The lesson generalizes: whenever
    code needs to know "when did the user first SEE this," schedule-time and
    paint-time are different instants, and only paint-time is real from the
    user's perspective — align the measurement with a
    `requestAnimationFrame` callback (or, more strongly, one *after* the
    triggering state update has committed), never with the moment a
    `setTimeout`/event handler happens to run.** This is the same discipline
    ENGINEERING-STANDARDS already applies to *drawing* (frame budgets, batch
    draw calls) turned toward *measurement*: what the user experiences is
    bounded by the render pipeline, not by when your JS scheduled the change.
    Re-derived the reaction-time category thresholds at the same time from
    named, cited constants (lab-measured mean simple reaction time plus a
    documented browser-measurement-overhead allowance) instead of the
    original bare numbers — see `reaction-time-game-logic.ts`.

    **The same defect exists on the RESPONSE side, and it was still there
    (2026-07-26).** The fix above aligned the *stimulus* timestamp with paint.
    The *click* timestamp was still `performance.now()` read inside the
    handler — which is when the handler got SCHEDULED, not when the browser
    created the event. Between those two sits the input queue, and on a busy
    main thread it is not noise: measured on this page under 4x CPU throttling
    with real trusted clicks, the gap ran **5.2–18.3ms**, every millisecond of
    it added to the player's reported reaction time. Reading `event.timeStamp`
    instead (same time origin as `performance.now()` for trusted events, so
    directly comparable to the rAF-derived stimulus stamp) removes it: residual
    inflation against an independent clock went from that 5–18ms band to
    **−0.3ms**. A fallback guards a non-positive or future `timeStamp`, because
    jsdom reports 0 and trusting it would report a reaction of
    minus-the-whole-session.

    **The generalised rule, now stated for both ends:** a user-perceived
    duration is bounded by the render pipeline at the stimulus end and by the
    input pipeline at the response end. Measure the stimulus from the frame
    that *paints* it, and the response from the moment the browser *created*
    the event — never from whenever your JS happened to run at either end.
    Diagnosing this needs real trusted input under throttling; a synthetic
    `element.click()` bypasses the input queue entirely and reported a
    flattering 0.2ms error for code that was really losing up to 18ms.
18. **An exemption from a gate needs a reason as specific as the gate itself
    — a blanket excuse, or no enforced reason at all, is the gate quietly
    turning itself off.** Every "allow-list" pattern in this codebase
    (`ALLOWED_COMPLEXITY_EXCEPTIONS`, `ALLOWED_LIFECYCLE_EXCEPTIONS`,
    `ALLOWED_UNUSED_LOGIC_EXPORTS`, `PINNED_WITH_REASON`,
    `PUBLIC_CONVENTION_EXEMPT`) is a `Record<name, reason>`, with its OWN
    test asserting `reason.length > 10` — a real sentence, not a placeholder.
    `PUBLIC_CONVENTION_EXEMPT` already had a genuinely specific reason on its
    one entry but was missing the enforcing test itself — added the same day
    for consistency, since a good reason with nothing checking it stays good
    only until someone adds a bad one. `ALLOWED_UNUSED_COMPONENTS`
    (`dead-component-contract.test.ts`) was the sharper case (2026-07 audit,
    prompted directly by "prevent us from marking sections as test-ignored or
    whitelisted just because it's hard, opposed to there being an actual
    valid reason"): a bare `Set<string>` holding four component names — Card,
    FadeInWhenVisible, ParallaxSection, ScrollReveal — under ONE shared
    comment ("generic reusable primitives... kept as scaffolding for future
    sections") and no test enforcing that comment meant anything per-entry.
    Investigated instead of taken on faith: none of the four had a test of
    their own (their only usage was a single shared `ui-smoke.test.tsx` smoke
    test, which is how they cleared the 100% coverage gate while having ZERO
    production callers — precisely the FAQ.tsx failure mode item 5 above
    describes); none respected `prefersReducedMotion`/`performanceTier` at
    all, despite every other animated component in this codebase being
    required to (§3, §4); and every one duplicated a pattern already
    established and actually in use elsewhere (`SpotlightCard` for cards;
    inline `useScroll`/`useTransform` for parallax/reveal, used in 12+ real
    components, each with its own tier-appropriate gating these four
    entirely lacked). "Might want this again someday" was the whole
    justification, and it wasn't backed by an actual plan — a portfolio
    site's section list doesn't grow the way a component library's consumer
    surface does. All four deleted rather than exempted; the exemption list
    itself converted to the same `Record<name, reason>` + reason-length-test
    shape as its siblings, so the NEXT genuine exemption is held to the same
    bar the other four lists already enforce, and an empty list stays
    empty until something earns its way in with a real, specific reason.
    **The lesson generalizes: "this is hard to test," "I don't feel like
    fixing this," and "it might be useful later" are not reasons — they're
    the absence of one wearing a reason's clothes. A valid reason names a
    concrete, checkable fact** (this mutant is provably unreachable for X
    reason; this pin is blocked by Y external constraint with a stated
    revisit condition; this component is deliberately pre-built for a
    specific, named upcoming section) **— if you can't write that sentence,
    the exemption doesn't belong in the list, the underlying thing belongs
    fixed or deleted.** Applies with equal force to `eslint-disable`
    comments, `@ts-expect-error`, `.skip()`/`.todo()` test markers, and
    Stryker `mutate` exclusions (`ambient-background-logic.ts`'s exclusion
    passes this bar — hand-verified per-mutant, not assumed) — every one of
    these is a gate choosing not to run, and every one needs the same
    individually-checkable reason a `Record` entry does, not just a
    comment that sounds like one.
19. **A document that references its own sections needs those references
    checked — a pointer is drift too.** This file and CLAUDE.md are dense with
    internal pointers (`§4.7`, `§6 item 13`, `CLAUDE.md constraint #17`), and §0
    leans on several by name to tie the first-principles doctrine to the
    concrete rules and ledger entries that enforce it. markdownlint
    (`docs-quality-contract`) checks formatting, not whether a pointer resolves,
    so a section renumber or a deleted constraint would silently turn every
    reference to it into a lie with a green gate — the same
    ecosystem-nobody-watches blind spot as items 4 and 9, one level in, aimed at
    the docs themselves. `docs-cross-reference-contract.test.ts` parses the real
    heading / list structure of both files and fails, naming the exact
    `file:line — ref → reason`, on any `§N.M`, `§6 item N`, or `constraint #N`
    that doesn't resolve. It is a forward guard (everything resolves today, so it
    passes now and only bites a future edit) with the guard-the-guard floors
    item 8 demands — if the parser ever finds zero headings or zero references,
    that itself fails rather than passing vacuously. Bare `#N` tokens that are
    *not* constraints (`React #418`, `next.js#86785`) are deliberately excluded.
    **The lesson generalizes once more: the moment a document's own structure
    becomes load-bearing — cross-referenced, not just read top to bottom — that
    structure is another ecosystem, and an unwatched ecosystem drifts.**
20. **Naming and file organization are enforced the same way everything else in
    this file is — a sweep, not a style guide (§8).** A 2026-07 audit walking
    every filename in `src/` before writing the enforcement found the tree
    already clean except one real mismatch: `floating-badge-icon.tsx` exported
    `FloatingBadgeIcon` under a kebab-case name — fixed in the same commit as
    the sweep, every import site updated, so `naming-and-organization-
    contract.test.ts` (real TypeScript compiler, not a regex — same rewrite
    discipline as item 15) ships already-green rather than red-then-exempted.
    Proven with teeth before trusting it: an injected `bad_Name.tsx`, a
    filename/default-export mismatch, and two lazy exported identifiers
    (`data`, `helper`) each failed with a precise `file:line`-equivalent
    message, then were reverted. Same lesson as item 19, one level up: a
    directory tree and an identifier's name are both structure a reader
    depends on, and depended-on structure needs a contract the moment it stops
    being obviously true by inspection.

    **Revised the same day (§8's own text now documents this):** the first
    draft still allowed a bare `logic.ts`/`engine.ts`/`builders.ts` as valid,
    because that was already the established convention — exactly the
    "convention, not ground truth" mistake §0 exists to catch, caught here by
    someone pointing directly at the repo rather than by the audit that had
    just been run. Eleven directories held a bare `logic.ts`; two held a bare
    `engine.ts`; one held a bare `builders.ts` — all indistinguishable from
    each other outside their own folder, and `src/components/projects/` held
    the bare form sitting *right next to* the already-qualified
    `card-logic.ts` and `featured-logic.ts`. All fourteen renamed to the
    qualified form in the same pass, every import site and every contract
    that recognized a logic module by name (`dead-logic-export-contract`,
    `module-testability-contract`, `naming-and-organization-contract` itself)
    updated together. **The lesson generalizes past filenames: a rule this
    file writes down is not exempt from §0 just because writing it down felt
    like the finish line — the standard itself gets checked against ground
    truth, same as the code it governs, and gets corrected the same day if it
    doesn't hold up.**

21. **A session that produces non-obvious wisdom writes it down before it
    ends — same commit discipline as item 1, pointed at knowledge instead of
    code.** "Non-obvious" means a measurement that contradicted the initial
    guess, a rejected approach and *why* it lost, a framework/tool behavior
    that silently diverged from its docs (§9.1's whole reason for existing),
    or a decision with a reopen condition (§9.4). It does not mean routine
    work — a straightforward bug fix or a config bump doesn't need a new
    paragraph of doctrine, and padding this file with restatements of
    already-covered rules is itself a violation of §0 (a claim without new
    ground truth behind it). The bar: would a future session, hitting the
    same wall, want to have read this first? If yes, it goes in
    `ENGINEERING-STANDARDS.md` (a pattern, a law, a technique — reusable
    beyond this one change) or `CLAUDE.md` (a project fact — a new file, a
    new command, a new constraint on an existing one). If the wisdom is a
    parked optimization or a measured rejection specifically, it goes in
    §9.4's registry, not loose prose, so it carries a reopen condition and a
    watcher instead of fossilizing into an anecdote nobody re-checks.
    **Every new component or feature still ships with its test in the same
    commit — no exception, no follow-up commit "adding tests later."** That
    half of this rule already had teeth (item 10's checklist, and the
    generic sweeps — `dead-logic-export-contract`,
    `module-testability-contract` — that fail on an untested logic module
    regardless of anyone remembering a checklist); this item's contribution
    is closing the other half, where the compounding value isn't code
    coverage but institutional memory, and nothing before §9.4 was watching
    for it going missing.

22. **Audits become sweeps — a manual finding is a defect *class* entering
    the catalog, never a one-off fix.** Origin (2026-07-23): the Math.hypot
    finding (§2.9) was made by a human reading engine files on request. The
    fix and even its ratchet (contract section 24) only closed *that*
    pattern — the deeper defect was that the zero-alloc/optimal-primitive
    law was enforced by per-engine *pins*, so a brand-new frame loop could
    ship any not-yet-pinned slow pattern and nothing would fire until the
    next human audit. Item 2 ("sweeps over pins") already named the
    principle; this item makes it a closed loop: **whenever a manual audit,
    review, or debugging session finds a performance/correctness defect,
    the same commit must add a repo-wide sweep for the defect's class** —
    scoped tightly enough to ship green (proven with an injected violation
    per item 8, then reverted), with the standard exemption mechanism — so
    the next instance of the class is found by the commit gate, not by
    someone remembering to ask. The catalog locations: complexity-doctrine
    contract (repo-wide algorithmic anti-patterns — the frame-stepping
    allocation/scan sweep this incident produced, O(n·m) nested-scan and
    `.filter().length` bans, AST sweeps for depless effect hooks and
    per-call RegExp compilation, and the production-dependency ledger that
    fails the gate on any runtime lib whose job and considered-alternative
    aren't on record),
    algorithm-and-datastructure contract (engine-specific and
    primitive-level), animation-regression contract (motion/mobile),
    lifecycle-hygiene contract (resource cleanup). A finding that genuinely
    can't be swept mechanically (a judgment call, a measurement) goes to
    §9.4's registry with its trigger and watcher instead — the one place a
    non-mechanical decision is allowed to live.

## 7. The engagement doctrine

This site is not a static résumé — it's meant to feel like stepping into the
owner's actual world: emergency medicine, genomics research, security
research, neuroscience, software engineering, all at once. A page that just
displays facts fails that goal even if every fact is correct. The design bar
(set 2026-07): **every interaction should give something back.** Hovering,
clicking, or watching a value change should never land on inert content.

This doctrine sits *alongside* the complexity doctrine (§1), not in tension
with it — "engaging" and "O(1) per event" are the same requirement read from
two directions. A hover effect that recomputes an O(n) collection on every
`mousemove`, or a physics loop that allocates per frame, isn't engaging once
it's dropped frames on a mid-range phone; it's just broken. Every example
below already respects the complexity doctrine — reused buffers, named
constants, per-event O(1) work — because an effect that doesn't hold up
under that constraint doesn't belong on this site regardless of how good the
idea is.

**What "gives something back" looks like, concretely, from this codebase's
own history:**

- Data that changes should say so. The certification status icons
  (`src/components/certifications/certifications-logic.ts` — `evaluateCertificationStatus`)
  don't just render a static checkmark; they read real expiry dates and
  become a warning or an X, with a feedback line stating the exact month
  count. A value that never changes is a fact; a value that reacts to time
  passing is a *signal*.
- Text the user points at should react. `ScrambleText` (hover-triggered
  glyph scramble/decode, writing straight to the DOM node with zero React
  re-renders — see its own file for why) is applied to project titles,
  section ghost-indices, and education credentials specifically *because*
  it's a proven, cheap, already-tested primitive — reuse it before inventing
  a new mechanism.
- A section themed around a real subject should have a matching flourish,
  not a generic one. The Certifications section (EMT/BLS/ACLS content) has a
  looping ECG trace that speeds up on hover. The Genetic RefleXions project
  (SNP-analysis capstone) has a playable "Spot the SNP" mini-game. The
  attention-lapses research project has a genuine reaction-time psychophysics
  task. The theme comes FIRST — pick the subject's own real concept (a real
  SNP, a real reaction-time paradigm, a real predator-prey steering
  behavior), not a generic particle effect wearing the section's color
  scheme.
- A playable interaction beats a passive one, when the effort is justified.
  Not everything needs to be a game — most of this list is a hover effect or
  a live status, and that's fine. But when a project's subject matter is
  itself an interactive concept (a puzzle, a reflex test, a chase), building
  the real thing is worth the extra effort over a decorative animation of
  the same idea.

**Mechanically enforced floor:** `src/section-engagement-contract.test.ts`
sweeps every top-level page section (`Hero.tsx`, `Certifications.tsx`,
`Experience.tsx`, `Education.tsx`, `Projects.tsx`, `Skills.tsx`,
`Testimonials.tsx`, `Contact.tsx`, plus each one's own sub-directory) for at
least one genuine interactive signal — a real event handler wired to a
state/DOM change, a live-region status message, or an import of a proven
interactive primitive (`ScrambleText`, `Magnetic`, `MagneticField`, `Tilt`,
`CursorComet`, `PointerRipple`). Found and fixed 2026-07: `Education.tsx` had
nothing but a passive `animate-ping` dot — zero hover/click/focus interaction
anywhere in the section — fixed by wrapping each credential heading in
`ScrambleText`. This is a FLOOR, not a quality bar: it can't tell a great
interaction from a token one, only distinguish "something" from "nothing." A
future section that fails it needs one real interactive touch added, not the
check loosened.

**What this doctrine does NOT license:** it is not permission to bypass any
other rule in this document. A "cool" effect that reads a browser API in a
lazy `useState` initializer still trips the hydration-safety contract
(constraint #10); one that leaks a `requestAnimationFrame` loop still trips
the lifecycle-hygiene contract; one that does O(n) work per pointer move
still trips the complexity doctrine. An ambitious idea that can't be built
within those constraints gets scoped down to a version that can (a single
contained prototype, tier-gated to `full`, easy to remove) rather than
shipped in violation of them — see the 2026-07 canvas glyph-dissolve
prototype (`src/components/hero/`) for the pattern: a genuinely ambitious
visual idea, deliberately built small, reversible, and gated, instead of as
a wholesale rendering-architecture rewrite.

---

## 8. Naming and organization law

A codebase that is easy to navigate is not a nicety layered on top of correct
code — it's part of what makes the codebase's other guarantees trustworthy.
A dispatch table you can't find, a logic module hiding under a name that
doesn't say what it does, a component split from its test by an inconsistent
convention: each of these is friction that compounds, and friction is where
laziness hides ("I'll just inline it here instead of finding the right
module"). §0's method applies here exactly as it does to an algorithm: reason
from what the name or the file location is actually *for*, not from "this is
close enough" or "I'll fix the name later."

**Audited 2026-07, before writing any rule here:** every filename in `src/`
was walked and classified. Zero snake_case, zero space-containing, zero
mixed-convention filenames exist today; the only files that don't match a
simple PascalCase-component / `use*`-hook / kebab-case-logic shape are Next.js
App Router's own reserved filenames (`page.tsx`, `layout.tsx`, `error.tsx`,
`not-found.tsx`, `sitemap.ts`, `robots.ts`, `metadata.ts`, …) and a handful of
already-correct camelCase data files matching `src/data/`'s existing
documented convention. A repo-wide sweep for a denylist of lazy exported
identifier names (`foo`, `bar`, `temp`, `data`, `thing`, `stuff`, `helper`,
`util`, …) found zero matches.

**Revised the same day, on direct pushback:** the first draft of this section
still allowed a bare `logic.ts`/`engine.ts`/`builders.ts` as a valid
convention — because that was the established pattern, not because it was
the *best* one. That is exactly the "reason from convention, not from ground
truth" failure §0 exists to catch, and it took someone pointing at the
codebase directly ("the million generic logic.ts") to surface it: eleven
directories each held a file literally named `logic.ts`, indistinguishable
from one another in a search result, an open editor tab, or a stack trace —
`src/components/projects/` alone held a bare `logic.ts` sitting right next to
the already-qualified `card-logic.ts` and `featured-logic.ts`, the exact
ambiguity this section exists to rule out. Fixed by requiring the qualified,
directory-prefixed form everywhere (`hero-logic.ts`, not `logic.ts`;
`background-particles-engine.ts`, not `engine.ts`) with no bare exception, and
renaming all fourteen offending files (eleven `logic.ts`, two `engine.ts`, one
`builders.ts`) plus every import site in the same pass. **This section is
therefore a forward guard, same posture as §6 item 19: it codifies a
genuinely-already-true state as a permanently enforced floor, not a cleanup
of a current mess** — but only after the standard itself was first held to
its own bar.

### 8.1 Filenames say what's in them, by a convention keyed to role

| Role | Convention | Example |
| --- | --- | --- |
| React component (default-exports JSX) | `PascalCase.tsx` | `ExperienceCard.tsx` |
| Hook | `use` + `PascalCase.ts(x)` | `usePerformanceProfile.ts` |
| Extracted logic module | `*-logic.ts`, `*-engine.ts`, or `*-builders.ts` (qualified — never bare) | `hero-logic.ts`, `command-palette-logic.ts` |
| Static data catalog | camelCase `.ts` (existing `src/data/` convention) | `experience.ts`, `additionalCredentials.ts` |
| Test file | source name + `.test.ts(x)`, same casing family as its source | `Button.test.tsx`, `local-time-logic.test.ts` |
| Next.js App Router reserved file | whatever Next.js requires, never renamed | `page.tsx`, `layout.tsx`, `metadata.ts`, `robots.ts` |

The rule isn't "pick a convention" — every one of these already exists
independently, in different corners of this repo, for a reason (component
files are `PascalCase` because the exported symbol is; hooks are `use*`
because React's own rules-of-hooks lint depends on the prefix; data files are
camelCase because that predates this document). §8.1's contribution is
**making the existing conventions repo-wide and enforced**, not inventing a
new one: `src/repo-hygiene-contract.test.ts` checked this only for
`src/data/` and `src/hooks/`; `naming-and-organization-contract.test.ts` (see
enforcement below) extends the identical shape to every directory under
`src/`.

### 8.2 Every exported name says what it does — no lazy placeholders

An exported `const`, `function`, or `class` name is part of this codebase's
public surface the same way a logic module's export is (§6 item 5's dead-
export sweep already treats it that way). A name that could describe
anything — `data`, `temp`, `thing`, `helper`, `util`, `val`, `res`, `misc`,
`foo`, `bar` — describes nothing, and a reader has to open the implementation
to learn what a reference to it would have told them for free. This is
banned outright, not style-guided: `naming-and-organization-contract.test.ts`
walks every exported declaration in `src/` with the real TypeScript compiler
(the same `ts.createSourceFile` pattern established in §6 item 15's rewrite —
a regex denylist is exactly the kind of fixed-shape check that item warns
against, since `const dat_a` or a destructured re-export would evade a naive
string match) and fails on a match against a documented denylist.

This is a **floor, not a style bar** — the same relationship §7's engagement-
doctrine sweep has to "is this interaction actually good." The contract can
tell "specific" from "generic"; it cannot tell "well-named" from "adequately
named," and doesn't try to. A name passing this check is not automatically a
*good* name — code review still owns that judgment call, the same way it owns
whether a §7 interaction is actually engaging, not just present.

### 8.3 Directory structure mirrors the domain, not the framework

`src/components/<section>/` holds a section's component plus its qualified
`<section>-logic.ts` side by side — never split across `src/lib/` or `src/utils/`, which this
repo does not have and should not gain (a `utils/` directory is where names
go to become generic — see 8.2). `src/data/` holds every static content
catalog; `src/hooks/` holds every hook; `src/app/` holds only routes and their
Next.js-reserved files. A new file's location should be answerable from its
*role* (is it a component? logic? a hook? data?) in one step, never "wherever
seemed convenient at the time." This is the same principle §5's architecture
invariants already state for logic extraction — §8.3 generalizes it to the
whole tree, and `repo-hygiene-contract.test.ts`'s root-file allowlist already
enforces the top level; §8's contribution is making the *rest* of the tree's
shape just as explicit.

**Enforcement:** `src/naming-and-organization-contract.test.ts` — repo-wide
filename-casing sweep (§8.1) plus the lazy-identifier AST sweep (§8.2), both
described above. Deliberate exceptions to either sweep go in a documented
`Record<name, reason>` allowlist matching every other exemption list in this
file, held to the same bar §6 item 18 already sets — no exemption without a
concrete, checkable reason.

## 9. The shipped-artifact law — what the visitor receives is the only truth

Source code is a *claim* about what ships; `/out` is what actually ships.
Every rule in this section exists because a claim and the artifact disagreed,
and the artifact was right. The section's one-line summary: **when you assert
anything about performance, verify the assertion against the built artifact
and the wire — never against the source that was supposed to produce it.**
This is §0.5's validate-the-ruler rule pointed at a different instrument: the
build pipeline itself is a measurement device that can silently lie.

### 9.1 Verify emission, not intent (the `fetchpriority` incident)

Passing a prop is not shipping an attribute. `next/image`'s `priority` prop
was assumed to emit `fetchpriority="high"` on the hero LCP image — it does
not under `unoptimized` static export (found 2026-07-23 by grepping the
actual `<img>` tag in `/out/index.html`; the image had been queueing at
default priority behind the entire async-script wave for as long as the site
had shipped). The polyfill patches (§9.2) and the AVIF migration were
verified the same way: byte counts and tag attributes read from `/out`, not
inferred from config.

**Rule:** any change whose value depends on what the build emits — an
attribute, a preload, a chunk, a header — lands only after the emitted
artifact is inspected, and ships with a pin at whichever level can fail
fastest (component render test for attributes, e.g.
`profile-image-lcp.test.tsx`; post-build sweep in `performance-budgets.mjs`
for chunk contents; `headers-integrity-contract` for headers). "The docs say
the framework does X" is a hypothesis, not a verification.

### 9.2 Bytes ship on merit — formats, preloads, and vendor code all ratchet

Three applications of the same principle, all landed 2026-07-23, all with
the measurement on record:

- **Media formats are measured decisions with a ratchet.** AVIF replaced
  webp on the render path only after sharp measured it 16–55% smaller per
  asset at equal quality (~37% total). The asset-weight contract now fails
  any render-path webp without a reasoned `AVIF_EXEMPT_WEBP` entry; the two
  survivors (`profile.webp` scraper/manifest compat, `ba.webp` generation
  source) each carry their reason. When a better format earns support
  breadth (the way AVIF overtook webp), the same play runs again: measure,
  swap, ratchet, exempt-with-reasons.
- **A preload is a spent budget, not a hint.** Every preloaded byte competes
  with the LCP image. The `_headers` audit found an 18.8KB PWA icon
  preloaded on every page load (never rendered in any page — pure waste)
  and the desktop hero image preloaded on mobile viewports that render the
  small variant (a guaranteed double-download). Rule: a preload must name a
  resource the *current viewport* actually paints — `as=image` preloads are
  media-scoped, and favicon/manifest assets are never preloaded. Enforced by
  `headers-integrity-contract`'s preload-hygiene sweep.
- **Vendor bytes are patchable — "not fixable from `src/`" is not
  "unfixable."** Next.js unconditionally ships two legacy-polyfill bundles;
  both are now empty via `pnpm patch` (§4.7's `polyfill-module` entry and
  the 112KB `polyfill-nomodule` extension). The doctrine: when dead vendor
  bytes have no config opt-out, patch them out, document the safety argument
  (which browsers are affected and what they'd experience), record the
  honest magnitude (§0 — the nomodule patch buys deploy weight, not
  modern-visitor latency, and says so), and pin the patch so a version bump
  that silently drops it fails `npm test`.

### 9.3 Latency budgets don't end at onload — navigation is a metric

A static export makes every subpage navigation a cacheable, prefetchable
document — so hover-to-tap latency can absorb the *entire* next-page load.
Speculation Rules shipped 2026-07-23 (moderate hover-prefetch +
conservative pointerdown-prerender, `/resume/*` excluded so a stray hover
never pulls a multi-hundred-KB PDF), as progressive enhancement with zero
cost to non-supporting browsers. The general rule: when a Web Platform
capability can move a real user-felt latency to zero at ~zero risk
(Speculation Rules, bfcache, Early Hints via the existing `Link` headers),
adopt it deliberately, wire it through the data-catalog convention
(`SPECULATION_RULES` in `src/data/metadata.ts`), and pin the wiring
(`performance-regression-contract`). Cutting-edge is a posture only when
each adoption is individually reasoned and individually revocable.

### 9.4 The watched-levers registry — nothing is rejected without a tripwire

A measured rejection or an upstream block is a *decision with a shelf life*.
The failure mode this subsection exists to prevent: a lever is correctly
rejected today, the world changes, and nobody re-pulls it because the
rejection fossilized into lore. Every parked lever below carries (a) why it's
parked, (b) the condition that reopens it, and (c) the watcher that fires —
a probe test where machine-checkable, this registry where not. Adding a
parked lever without all three is the same defect as an exemption without a
reason (§6 item 18).

| Lever | Parked because | Reopens when | Watcher |
| --- | --- | --- | --- |
| TypeScript 7 | typescript-eslint peers `<6.1.0` | typescript-eslint ships TS7 support | pin-probe test in `dependency-freshness-contract` (fails the day the peer range moves) |
| sharp CVE ignore (GHSA-f88m-g3jw-g9cj) | no fixed sharp release exists | patched sharp publishes | self-cleaning audit sweep — the ignore entry must be deleted the release it stops matching |
| JS deferral / code-splitting for mobile LCP | measured no-op: Turbopack force-preloads every chunk; Lantern sums the initial wave regardless (§4.7) | the bundler stops force-preloading, or framer-motion leaves the bundle | re-measure against clean `/out` per §0.5 before believing any new deferral result |
| Removing framer-motion (the real mobile-TBT ceiling) | product decision — §7 engagement depends on it | the engagement doctrine changes, or React-native view transitions/scroll-driven animations can express §7 without it | owner call; revisit at each React/framer major |
| `domAnimation` (smaller framer feature pack) | hero `drag` + nav/rail `layoutId` need `domMax` (documented in `motion-features.ts`) | those interactions are redesigned away | grep is the check: no `drag`/`layoutId` usage → swap the pack same commit |
| `next` patch re-cuts | pnpm patches pin exact versions | every `next` version bump | contract test asserts patch version == lockfile version *and* installed polyfill files are 0 bytes |
| Local Lighthouse numbers | §0.5 — the ruler lied twice (dev-build-on-port-3000 incident) | never fully; PSI/CI stay the arbiters | `serve-out-warmed.mjs` refuses occupied ports and non-production responses |
| JSON-LD flight duplication (~33KB raw in home HTML) | structural to RSC: a Server Component's rendered script content rides the flight stream too, so the structured-data block ships once as `ld+json` and once flight-escaped | Next ships JSON-LD support in the Metadata API, or flight-payload exclusion for opaque script content | the home-HTML budget recalibration note in `performance-budgets.mjs` names this slack; re-measure before any future HTML-budget bump |
| Incremental framer removal as a *load-time* win | measured no-op: removing 8 of the page's framer graphs moved mobile Lighthouse 0.86 → 0.86, every metric inside run-to-run spread (§9.5). The load floor is bundle *evaluation* + 3,301-element hydration, and neither falls until the last framer import does | framer-motion is fully removed, or the client tree shrinks materially (more RSC conversions per §5) | re-measure load with LHCI *and* scroll with `pnpm run measure:scroll-cost` per §9.5 — a load-metric no-op does not mean a no-op |
| Declarative CSS custom properties for per-frame values | measured 6.3× worse: an *inherited* registered property on `:root` invalidates the whole document every frame (3.65ms/frame at 3,424 elements vs 0.58ms writing 8 elements directly) | the element count collapses, or browsers gain per-element custom-property invalidation | the comment block above `.velocity-lean-*` in `globals.css`; re-run the recalc probe before moving any per-frame value back into CSS |
| Mobile Lighthouse floor at 0.80 (tightened back from 0.45, 2026-08-09) | GitHub-hosted CI's actual shared-runner capacity was unmeasured for a month (CI was off); three fresh runs on re-enabling it measured 0.53/0.59/0.56 and TBT 1401–1696ms, ~50× the prior 27.5ms baseline — a runner-capacity gap, not an app regression (ruled out via a local framer-motion v12-vs-v13 A/B test, §0.5) | three consecutive CI runs clear 0.80 with no dependency change to explain the jump (evidence the runner tier or its load genuinely improved) | `performance-regression-contract.test.ts`'s pinned `0.45` + inline history; re-measure with 3+ fresh CI runs (not local) before raising the floor back |
| `kulturecity.org` link liveness (ledger status `unverifiable`, 2026-08-28) | the checking machine's ISP (Charter/Spectrum CUJO filter) intercepts the TLS connection — `ERR_SSL_WRONG_VERSION_NUMBER` on curl *and* node, while a plaintext `http://` probe lands on `block.charter-prod.hosted.cujo.io`, proving interception rather than a dead host (§0.5) | the link is re-checked from a network that isn't filtering it | `external-links-contract` — an `unverifiable` entry keeps its ORIGINAL `lastChecked`, so the 45-day staleness gate expires it (this one on 2026-09-02) and forces the re-check; a second assertion fails any `unverifiable` entry lacking a `note` or carrying a refreshed timestamp |
| Vitest 5 | `@stryker-mutator/vitest-runner@10.0.0` (latest) cannot activate RUNTIME mutants on Vitest 5 — it assigns `ns.activeMutant` in a `beforeAll` registered at the top level of its injected setup file, and under Vitest 5 that hook never fires (its setup-file `globalThis` is also not the one the instrumented module reads). Every function-body mutant is then reported *Survived*; only module-level mutants still die, via the instrumented `__STRYKER_ACTIVE_MUTANT__` env fallback read at import. Measured on identical source/tests (`hero-logic.ts`): **vitest 4.1.11 → 100.00% (62 killed / 0 survived); vitest 5.0.0 → 20.97% (13 killed / 49 survived)**. The failure is silent — a plausible low score, not an error — so it reads as "your tests are weak" and invites exactly the wrong fix (§0.5: the ruler lied again). | a `@stryker-mutator/vitest-runner` newer than 10.0.0 ships and the A/B re-run scores 100% on `hero-logic.ts` | `dependency-freshness-contract`'s `vitest pin` probe — fails the day a newer runner publishes, with the exact A/B command in its message; the three `PINNED_WITH_REASON` entries are self-cleaning if the pin ever catches up |

**Rule for future entries:** the moment a measurement rejects an
optimization or an upstream constraint blocks one, it enters this table in
the same commit — with its reopen condition and watcher — or it doesn't
count as "decided," it counts as "forgotten."

### 9.4b Lenis makes `scrollIntoView` a lie in verification harnesses (2026-07-26)

A real-browser check of the `useInView`-gated ephemeral-room widget reported
its decay clock frozen at 0.0s and its bar stuck at `scaleX(1)` — a convincing
"the simulation never starts" bug. It wasn't. Instrumenting the element's
actual geometry showed `visibleRatio: 0` *after* `scrollIntoView()`: on desktop,
**Lenis owns the scroll position and quietly discards a programmatic
`scrollIntoView`**, so the element never entered the viewport and §3.7's
visibility gate was correctly refusing to run. Driving `page.mouse.wheel`
instead — what Lenis is built to consume, and what a real visitor produces —
put the card at `visibleRatio: 1` and the clock advanced 0.6 → 2.1 → 3.6s with
the bar decaying 0.95 → 0.83 → 0.70 exactly as designed.

**Rule:** any headless check of a visibility-gated widget on this site must
scroll by wheel and then *assert the element is actually visible* before
asserting anything about its behaviour. A harness that trusts `scrollIntoView`
here will invent gate failures — and the tempting "fix" is to weaken or remove
the gate that §3.7 exists to enforce. Same family as §0.5: the instrument was
pointed at something other than what it claimed.

### 9.4c A single wheel scroll can undershoot a `.cv-section` target — poll, don't sample once (2026-07-26)

Extending §3.7's mount-gating from animation loops to component mounting
itself (`ProjectDemoDisclosure`, all 9 project games) surfaced a second way
the *correct* fix in §9.4b — drive real `mouse.wheel` events — can still
report a false gate failure. A single wheel gesture (or even 40 small ones)
aimed at a featured game's card, using its bounding box measured *before* the
scroll, sometimes left `aria-expanded` stuck at `false` even though the widget
was genuinely wheel-scrolled and genuinely never mounted from a click either.

The card sits inside a `.cv-section` (`content-visibility: auto`,
`contain-intrinsic-size: auto 1200px` — §4.7 item 17). Off-screen, that
placeholder height stands in for the section's real height. As the section
approaches the viewport and the browser starts laying out its real content —
nine disclosure cards, each with its own teaser copy and (for the two
featured ones) a mounted game — the section's true height turns out taller
than the placeholder guessed, and everything below it shifts. A target whose
bounding box read `y: 467` (safely mid-viewport) the instant after
`scrollIntoViewIfNeeded()` can read `y: -130` (scrolled back out, upward) one
frame later, as content above it resolves to its real, larger size. This is a
real, reproducible layout shift — not a test artifact — and it can repeat
for several iterations before the page settles, because resolving one
section's placeholder can itself trigger the next one's.

The gate itself was never broken: polling the target's bounding box and
continuing to scroll toward it — rather than scrolling once and asserting —
reached `aria-expanded: true` every time, typically within 40–60 short wheel
steps. A natural human scroll, which doesn't stop moving after one gesture,
never encounters this as a bug; only a harness that samples once does.

**Rule:** a headless check of ANY visibility-gated widget below a
`.cv-section` boundary must poll the target's bounding box and keep scrolling
toward it (not away, using the sign of its current offset) until it actually
settles inside the viewport, rather than issuing one scroll and asserting.
Same family as §9.4b and §0.5 — before concluding a gate has a real defect,
confirm the harness gave the page's own layout time to stop moving.

### 9.5 Measure the metric the change actually targets (the scroll-velocity port, 2026-07-25)

The page built the same scroll-velocity spring **eight times** — once per
`SectionHeader` (6) plus both `VelocityMarquee` bands — each a framer
`useScroll → useVelocity → useSpring → useTransform` chain with its own scroll
subscription, and each built unconditionally under Rules of Hooks *even on the
mobile tiers that never attach the resulting transform*. They are now one
`ScrollVelocityDriver` (`src/components/ui/`): one subscriber, one spring,
written straight to the 8 consumer elements, parking itself at rest.

**Result, stated with its conditions.** Mobile scroll-time JS
(412×823 coarse-pointer, 7 interleaved A/B pairs, 240-step wheel gesture):
**278ms → 238ms, −14.4%, with non-overlapping ranges** (baseline 274–284,
candidate 234–241) — the clean part of the win, and unsurprising in hindsight:
on mobile the baseline computed a lean it then threw away. Desktop scroll:
neutral (everything inside spread; layout −10%). Mobile Lighthouse:
**0.86 → 0.86, nothing outside run-to-run spread.** Shipped for the mobile
scroll win and the simplification, *not* as a load-time optimization.

Four lessons, each of which cost a real defect to learn:

1. **A load-time instrument cannot see a scroll-time change.** Judged only by
   Lighthouse this was a flat no-op and would have been reverted — the exact
   shape of the LazyMotion mistake in §0.3/§0.4, which was rejected on LCP and
   later found to be the TBT win. Before believing a null result, ask whether
   the harness ever exercises the thing that changed. `scripts/checks/measure-scroll-cost.mjs`
   (`pnpm run measure:scroll-cost --baseline <old-out>`) exists because the
   answer here was no: it drives real Chromium over a scripted wheel gesture
   and reads CDP `Performance.getMetrics`. It measures the two builds in
   **interleaved pairs** — sequential blocks let background load contaminate
   one arm only — and labels each metric SIGNAL or NOISE by whether the two
   arms' raw ranges are disjoint, because a median delta between overlapping
   ranges is not a result.
2. **The prettier version was 6.3× slower, and only a probe said so.**
   Publishing through an *inherited* registered custom property on `:root` —
   declarative, three `@property` blocks, transforms in CSS, genuinely nicer
   code — invalidates style for every element beneath the root on every frame:
   **3.65ms/frame** across 3,424 elements versus **0.58ms** writing the 8
   consumers directly, against **0.54ms** for doing nothing at all. ~19% of a
   60fps frame budget spent invalidating elements that never change. Worse, its
   first measurement *looked like a 55% JS win* — style recalc was so expensive
   it dropped frames, so the rAF loop simply ran fewer times. **A drop in
   per-frame JS can mean fewer frames, not cheaper ones; always read the
   companion counters.**
3. **A hand-rolled spring needs its stability bound checked, not assumed.**
   Explicit Euler on this spring is stable only while
   `(damping / mass) · dt < 2` — here `dt < 22.7ms`, i.e. ~44fps. Clamping long
   frames at 1/30s (33ms) put it *past* the bound, multiplying velocity by
   1.93× per step: the shipped build was caught mid-scroll holding
   `value = 1.03e7, velocity = -6.5e7`. It was invisible on screen because the
   published value is clamped to the saturation window — the only symptom was
   the lean taking ~2.5s to fall back instead of the ~1.5s its physics call
   for. Fixed by integrating in fixed `1/120s` sub-steps. framer's solver
   handles this; a replacement inherits the obligation.
4. **jsdom cannot see any of the above.** All three defects — a first frame
   with no delta-t parking the loop before it ever leaned, the recalc storm,
   and the divergence — were found by driving the built page in real Chromium and
   asserting the behaviour end to end — the lean appears during a scroll,
   clears once it stops, never appears on a coarse pointer, and the
   gradient-clipped headings still paint (constraint #15). None of the three
   reproduce in jsdom, which has no compositor, no style engine, and no smooth
   scrolling. Each is now pinned by a unit test **proven to fail against the defect
   before being trusted** (§6 items 8 and 22) — including one that had to be
   rewritten after the first version passed against the bug it claimed to
   catch: a *geometric* easing tail underflows to an exactly-zero delta, which
   satisfies the very `=== 0` park condition being pinned. It takes a
   *harmonic* tail to reproduce the real failure.

**September 2026 browser follow-up:** the gradient-paint constraint applies
to temporary entrance transforms too. `SectionHeader` now animates the whole
heading from its ancestor, with literal text inside the clipped gradient;
per-letter transforms made parts of the heading disappear until they settled.
The solid-color hero `TextReveal` uses a short CSS entrance and clips each
word to its reserved line box. Text remains readable before the lazy motion
runtime loads, and entering letters cannot paint over the following paragraph. Reduced-motion
browser testing also exposed Framer's `useReducedMotion()` reading media state
before hydration: `usePerformanceProfile` must gate that value with
`isProfileReady`, just like its pointer and hardware readings. The first client
render stays identical to SSR, then the effect applies the real preference.
The UI paint/contrast tests and `use-performance-profile.test.tsx` pin these
cases; production Chromium verification covers desktop, touch, and reduced
motion.

Explicit activation must outrank a decorative visibility observer. On a
390px viewport, a playable companion's button can be visible before 20% of
its taller container intersects. Toggling its raw `defaultOpen` state then
closed an unmounted game, despite the button advertising "Play". The shared
`ProjectDemoDisclosure` now toggles its rendered state and records explicit
activation; unactivated games still wait for visibility. Its test covers
both default-open and default-closed games with the observer still false.
