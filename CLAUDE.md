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
- **Vitest** + **Testing Library** — 435+ tests, all must pass

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

### 7. Hero mobile layout: image must come before text

The image column uses `order-1 md:order-2` and the text column uses `order-2 md:order-1` so that on mobile the profile photo appears above the name/title, above the fold.

## Data

Site content lives in `src/data/`:

| File | Content |
|------|---------|
| `profile.ts` | Name, title, tagline, stats, social links |
| `experience.ts` | Work history (sorted newest-first per company) |
| `projects.ts` | Portfolio projects |
| `certifications.ts` | Certs with verification URLs |
| `education.ts` | Degrees + prerequisite coursework |
| `testimonials.ts` | LinkedIn recommendations |

## Deployment

```bash
npm run deploy:prod   # builds → runs Lighthouse CI → deploys to Cloudflare Pages
```

Static site lives in `/out` after `npm run build`. Cloudflare Pages serves it directly. There is no server-side rendering after the build step.

Lighthouse performance threshold: **0.85** (enforced by `lighthouserc.json` and `src/performance-regression-contract.test.ts`).
