# CLAUDE.md — Cameron Aaron's Portfolio Site

## Commands

```bash
npm run dev          # dev server → http://localhost:3000
npm run build        # production static export to /out
npm test             # Vitest (all tests must pass before committing)
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
```

## Stack

- **Next.js 16** App Router, `output: 'export'` (static), deployed on **Cloudflare Pages**
- **React 19**, **TypeScript 6**, **Tailwind CSS v4**, **Framer Motion 12**
- **Lenis** smooth scroll (desktop only — disabled on touch devices)
- **Vitest 4** + **Testing Library** — 480+ tests, all must pass

## Architecture

### Performance tier system

Every animation and effect decision is gated on `usePerformanceProfile()`:

| Tier | Trigger | What works |
|------|---------|------------|
| `full` | Desktop fine-pointer, high-spec | All effects: particles, cursor trail, Lenis, ambient animation, parallax |
| `balanced` | Touch / coarse pointer (mobile) | Static ambient orbs, basic scroll animations, NO particles, NO Lenis, NO cursor trail |
| `lite` | Low hardware (≤4 cores / ≤4 GB) or save-data | Minimal motion only |
| `reduced` | `prefers-reduced-motion` | Near-static |

**Key properties returned by `usePerformanceProfile`:**
- `shouldRenderParticles` — `true` only on `'full'`
- `shouldRenderAmbientEffects` — `true` on `'full'` and `'balanced'`
- `shouldRenderHeavyEffects` / `shouldRenderCursorTrail` — `true` only on `'full'`

### Modularization contract

Every non-trivial component ships with a companion `logic.ts` (or `logic/` directory) containing all pure functions — sorting, math, animation config, etc. This is **enforced by contract tests** in `src/modularization-contract.test.ts`. Never inline logic that belongs in the extracted module.

Pattern: `Component.tsx` imports from `./logic` (or `./card-logic`, `./featured-logic`, etc.).

### Component layout

```
src/
  app/          # Next.js App Router pages + layout
  components/
    ui/          # Reusable primitives (Button, SpotlightCard, SmoothScroll…)
    hero/        # Hero section + sub-components
    experience/  # ExperienceCard + card-logic
    projects/    # ProjectCard, FeaturedProject + logic
    contact/     # SocialLink, SocialPlatformIcon + logic
    …            # One directory per section, logic extracted alongside
  data/          # Static data files (experience.ts, profile.ts, projects.ts…)
  hooks/         # usePerformanceProfile, useInteractionMode, useMousePosition…
```

## Test structure

```
src/repo-hygiene-contract.test.ts      # root-file whitelist, path conventions
src/modularization-contract.test.ts    # logic extraction enforced per component
src/performance-regression-contract.test.ts  # Lighthouse score thresholds
src/components/animation-regression-contract.test.ts  # animation anti-patterns
src/components/mobile-regression-contract.test.tsx    # mobile tap targets, safe areas
src/app/section-reveal-bfcache.test.ts  # bfcache blank-screen regression
src/hooks/use-performance-profile.test.tsx  # tier derivation, reactive updates
src/components/ui/ui-coverage-hardening.test.tsx  # AmbientBackground, SmoothScroll…
src/data/data-complete.test.ts         # data completeness + LACCD/CHEM 051/Dean's Honor assertions
src/components/education-ordering.test.tsx  # education card order + pulse indicator contract
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

`Education.tsx` uses `sm:grid-cols-2 xl:grid-cols-4` because there are now **4** education items (LACCD, Elmbridge M.Ed., Elmbridge Certificate, Connecticut College). If the count changes, update the grid class accordingly. Contract tests assert the sorted order: LACCD first (`Sep 2025 - Aug 2026`), then Elmbridge M.Ed. (`May 2023 - Jun 2026`).

### 8. In-progress prerequisite courses show a pulsing cyan dot

`Education.tsx` calls `isNonFinalizedCourseStatus(course.status)` to conditionally render an `.animate-ping` span in the status cell of the desktop prereq table. Contract tests in `education-ordering.test.tsx` assert that in-progress rows have this dot and completed rows do not. The same `animate-ping` pattern is used in `Certifications.tsx` for in-progress certification cards.

### 9. Education `verificationLinks[0]` is the institution link — not a pill

`Education.tsx` renders `verificationLinks[0].url` as the clickable institution name and shows `verificationLinks.slice(1)` as pill links. This means:

- `verificationLinks[0]` **must always be the institution's main website** (e.g. `laccd.edu`, `conncoll.edu`)
- Credential/verification links go at index 1+
- Violating this causes the institution name to link to the wrong place and that same link to appear twice (once as the institution name, once as a pill)

### 10. Hero mobile layout: image must come before text

The image column uses `order-1 md:order-2` and the text column uses `order-2 md:order-1` so that on mobile the profile photo appears above the name/title, above the fold.

## Data

Site content lives in `src/data/`:

| File | Content |
|------|---------|
| `profile.ts` | Name, title, tagline, stats, social links |
| `experience.ts` | Work history (sorted newest-first per company) |
| `projects.ts` | Portfolio projects |
| `certifications.ts` | Certs with verification URLs |
| `education.ts` | Degrees + prerequisite coursework (4 items; LACCD sorts first as most recent); `honorsAndAffiliations` is `HonorItem[]` (`{ label: string; url?: string }`) not `string[]` |
| `testimonials.ts` | LinkedIn recommendations |

## Algorithm and data-structure standards

These patterns are enforced by `src/components/algorithm-and-datastructure-contract.test.tsx`. Fix the **source**, not the test, when a check fails.

### Single-pass over map+filter

Never `.map(transform).filter(alive)` — it allocates a full intermediate array. Use a `for` loop with conditional `push()`:

```ts
// ✅ single-pass — stepBursts, decayTrailPoints
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
// ✅ labeled break — buildConnections
outer: for (let i = 0; i < particles.length; i++) {
  for (let j = i + 1; j < particles.length; j++) {
    if (lines.length >= maxConnections) break outer;
    // ...push
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
// ✅ testimonials/logic.ts
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

### Functional state updaters to prevent object churn

When a state value might not have actually changed, use the functional form and return `prev` unchanged to skip a re-render:

```ts
// ✅ useMousePosition.ts — avoids allocating a new {x,y} object every mousemove
setMousePosition((prev) =>
  prev.x === e.clientX && prev.y === e.clientY ? prev : { x: e.clientX, y: e.clientY }
);
```

### Named constants for physics and hardware thresholds

Never inline magic numbers in logic. Export named constants so they are self-documenting and testable:

```ts
// ✅ usePerformanceProfile.ts
export const LOW_HARDWARE_CORES_THRESHOLD = 4;
export const LOW_HARDWARE_MEMORY_GB_THRESHOLD = 4;
export const DEFAULT_HARDWARE_CONCURRENCY = 8;
export const DEFAULT_DEVICE_MEMORY_GB = 8;

// ✅ engine.ts
export const POINTER_ATTRACT_RADIUS = 22;
export const POINTER_ATTRACT_RADIUS_SQ = POINTER_ATTRACT_RADIUS * POINTER_ATTRACT_RADIUS;
export const ATTRACTION_STRENGTH_FULL = 0.012;
export const ATTRACTION_STRENGTH_BALANCED = 0.008;
```

## Deployment

```bash
npm run deploy:prod   # builds → runs Lighthouse CI → deploys to Cloudflare Pages
```

Static site lives in `/out` after `npm run build`. Cloudflare Pages serves it directly. There is no server-side rendering after the build step.

Lighthouse performance threshold: **0.85** (enforced by `lighthouserc.json` and `src/performance-regression-contract.test.ts`).
