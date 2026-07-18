/**
 * Animation regression contract.
 *
 * Prevents known animation/performance bugs from being re-introduced.
 *
 * 1. ExperienceCard double-whileInView blank-card bug (2026-06)
 *    When the card root has its own `initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}`
 *    AND the parent Experience.tsx container drives entry via a variant stagger, both
 *    chains start at opacity:0. In headless/bfcache scenarios the card stays invisible.
 *    Fix: remove standalone whileInView from the card root; rely entirely on the parent stagger.
 *
 * 2. ProfileImage infinite loops on mobile (2026-06)
 *    Float, pulse, and scale animations ran forever on touch devices, blocking the main thread.
 *    Fix: ProfileImage treats `isCoarsePointer` as equivalent to `prefersReducedMotion`.
 *
 * 3. AmbientBackground animated orbs on mobile (2026-06)
 *    Four Framer Motion orbs with repeat:Infinity were running on the 'balanced' (mobile) tier.
 *    Fix: animated orbs only on 'full'; 'balanced' and below get static CSS divs.
 *
 * 4. Lenis scroll on mobile (2026-06)
 *    Lenis with touchMultiplier:2 fights iOS native momentum scroll → visible lag.
 *    Fix: SmoothScroll bails out immediately on coarse-pointer devices.
 *
 * 5. shouldRenderParticles on mobile (2026-06)
 *    Canvas particle systems ran on the 'balanced' (mobile) tier.
 *    Fix: shouldRenderParticles is restricted to 'full' tier only.
 *
 * 6. React hydration error #418 — lazy useState initializers reading browser APIs (2026-06)
 *    usePerformanceProfile: lazy initializers read window.matchMedia() and navigator.hardwareConcurrency
 *    before hydration, causing mismatch on every mobile visit.
 *    TextReveal: lazy initializer called readInitialReveal() which reads sessionStorage and
 *    performance.getEntriesByType() — mismatched on return visits in the same session.
 *    Fix (both): useState(false) for SSR-matching initial state; real detection deferred to useEffect.
 *    Broader prevention: src/ssr-hydration-contract.test.ts scans all 'use client' files.
 *
 * 7. Spring-animated colors serializing to oklab() (2026-07)
 *    SectionRail's active/inactive dot and Experience's timeline dot both animated
 *    backgroundColor/boxShadow under a `type: 'spring'` transition. A spring samples the
 *    animation continuously (unlike a tween's start/end interpolation), and Framer Motion's
 *    spring color sampling can produce an intermediate value that serializes as
 *    `oklab(...)` — which some browsers reject when set via inline style with
 *    "'oklab(...)' is not an animatable color" (motion.dev/troubleshooting/color-not-animatable).
 *    Fix (both): keep `scale` on a spring; animate backgroundColor/borderColor/boxShadow with
 *    a plain tween instead (per-property transition override), which only ever interpolates
 *    within the source rgba()/rgb() space.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('animation regression contract', () => {
  it('ExperienceCard has no standalone whileInView on its card root element', () => {
    const source = read('src/components/experience/ExperienceCard.tsx');
    // The SpotlightCard (root element) must not own its entry animation — the parent
    // Experience.tsx stagger drives it. Having both start at opacity:0 causes blank cards.
    expect(source).not.toContain('whileInView={{ opacity: 1, y: 0, scale: 1 }}');
    expect(source).not.toContain('viewport={{ once: true, margin: "-100px" }}');
  });

  it('ExperienceCard inner elements have no standalone whileInView entry animations', () => {
    const source = read('src/components/experience/ExperienceCard.tsx');
    // Position rows and dot indicators previously had their own whileInView starting at
    // opacity:0 / scale:0. These conflicted with the parent stagger and could cause
    // those sub-elements to remain invisible.
    expect(source).not.toMatch(/whileInView=\{\{[^}]*opacity:\s*[01]/);
    expect(source).not.toMatch(/whileInView=\{\{[^}]*scale:\s*1\s*\}/);
  });

  it('ProfileImage imports usePerformanceProfile and uses isCoarsePointer to suppress mobile animations', () => {
    const source = read('src/components/hero/ProfileImage.tsx');
    expect(source).toContain("from '@/hooks/usePerformanceProfile'");
    expect(source).toContain('isCoarsePointer');
    // reducedMotion must be derived from BOTH prefersReducedMotion AND isCoarsePointer
    expect(source).toMatch(/reducedMotion\s*=.*\|\|\s*isCoarsePointer/);
  });

  it('AmbientBackground restricts animated (Framer Motion) orbs to the full tier only', () => {
    const component = read('src/components/ui/AmbientBackground.tsx');
    const logic = read('src/components/ui/ambient-background-logic.ts');
    // The component must delegate the decision to the extracted helper
    expect(component).toContain('shouldAnimateOrbs(performanceTier)');
    // The logic module must enforce full-only animation
    expect(logic).toContain("return performanceTier === 'full'");
    // Neither file must gate animation on the balanced (mobile) tier
    expect(component).not.toMatch(/animateOrbs\s*=.*balanced/);
    expect(logic).not.toMatch(/animateOrbs.*balanced/);
  });

  it('SmoothScroll bails out before creating Lenis when the pointer is coarse', () => {
    const source = read('src/components/ui/SmoothScroll.tsx');
    expect(source).toContain("window.matchMedia('(pointer: coarse)').matches");
    // The coarse-pointer guard must appear before the Lenis constructor
    const guardIdx = source.indexOf("window.matchMedia('(pointer: coarse)').matches");
    const lenisIdx = source.indexOf('new Lenis(');
    expect(guardIdx).toBeGreaterThan(-1);
    expect(lenisIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeLessThan(lenisIdx);
  });

  it('usePerformanceProfile.shouldRenderParticles is false on the balanced (mobile) tier', () => {
    const source = read('src/hooks/usePerformanceProfile.ts');
    expect(source).toContain("shouldRenderParticles: performanceTier === 'full'");
    // Must NOT include 'balanced' in the particle-render condition
    expect(source).not.toMatch(/shouldRenderParticles:.*balanced/);
  });

  it('Hero image column uses CSS order to appear above text on mobile', () => {
    const source = read('src/components/Hero.tsx');
    // Image column: order-1 on mobile, order-2 on md+
    expect(source).toContain('order-1 md:order-2');
    // Text column: order-2 on mobile, order-1 on md+
    expect(source).toContain('order-2 md:order-1');
  });

  it('Hero title uses a responsive font scale starting from text-3xl on mobile', () => {
    const source = read('src/components/Hero.tsx');
    // Must not start at text-4xl (too large for 390px screens). The pin
    // guards the mobile floor only — the desktop scale is free to grow
    // (the 2026-07 makeover took md+ to display scale).
    expect(source).toMatch(/className="text-3xl sm:text-4xl md:text-/);
  });

  it('IntroCurtain is a static import in the page shell (no ssr:false dynamic import)', () => {
    const source = read('src/app/page.tsx');
    // Static import ensures the curtain is present on first paint — no flash
    expect(source).toContain("import IntroCurtain from '@/components/ui/IntroCurtain'");
    // Dynamic lazy import of IntroCurtain must not exist
    expect(source).not.toMatch(/dynamic\s*\([^)]*IntroCurtain/);
  });

  it('event listeners in particle components use passive flag', () => {
    for (const path of [
      'src/components/hero/BackgroundParticles.tsx',
      'src/components/hero/InteractiveParticles.tsx',
      'src/components/hero/ProfileImage.tsx',
    ]) {
      const source = read(path);
      // Every mousemove listener must be passive (these never call preventDefault)
      const mousemoveLines = source.split('\n').filter((l) => l.includes("addEventListener('mousemove'"));
      for (const line of mousemoveLines) {
        expect(line).toContain('passive: true');
      }
    }
  });

  it('Navigation resize and keydown listeners are passive', () => {
    const source = read('src/components/Navigation.tsx');
    const resizeLines = source.split('\n').filter((l) => l.includes("addEventListener('resize'"));
    expect(resizeLines.length).toBeGreaterThan(0);
    for (const line of resizeLines) {
      expect(line).toContain('passive: true');
    }
    const keydownLines = source.split('\n').filter((l) => l.includes("addEventListener('keydown'"));
    for (const line of keydownLines) {
      expect(line).toContain('passive: true');
    }
  });

  it('Hero pointer tracking and useScrollPosition hooks use passive listeners', () => {
    const hero = read('src/components/Hero.tsx');
    const scroll = read('src/hooks/useScrollPosition.ts');
    expect(hero.split('\n').find((l) => l.includes("addEventListener('mousemove'"))).toContain('passive: true');
    expect(scroll.split('\n').find((l) => l.includes("addEventListener('scroll'"))).toContain('passive: true');
  });

  it('pageshow listeners in bfcache-aware components are passive', () => {
    for (const path of [
      'src/components/ui/IntroCurtain.tsx',
      'src/components/ui/SmoothScroll.tsx',
      'src/components/ui/TypewriterEffect.tsx',
      'src/components/ui/TextReveal.tsx',
    ]) {
      const source = read(path);
      const pagesShowLines = source.split('\n').filter((l) => l.includes("addEventListener('pageshow'"));
      expect(pagesShowLines.length).toBeGreaterThan(0);
      for (const line of pagesShowLines) {
        expect(line, `${path} pageshow listener missing passive: true`).toContain('passive: true');
      }
    }
  });

  it('Hero signal chips use whitespace-nowrap to prevent mid-word wrapping on mobile', () => {
    const source = read('src/components/Hero.tsx');
    expect(source).toContain('whitespace-nowrap');
  });

  it('usePerformanceProfile and TextReveal use false initial state (not lazy browser-API initializers) to prevent React #418', () => {
    const perfProfile = read('src/hooks/usePerformanceProfile.ts');
    const textReveal = read('src/components/ui/TextReveal.tsx');

    // Both had lazy initializers that read browser APIs before hydration, causing #418.
    // Fix: useState(false) matches SSR; real values set in useEffect post-hydration.
    expect(perfProfile).not.toContain('useState(() =>');
    expect(perfProfile).toContain('useState(false)');

    expect(textReveal).not.toContain('useState(() =>');
    expect(textReveal).toContain('useState(false)');
  });

  it('Skills section headings are plain h3 elements inside the stagger container (no standalone whileInView inside stagger)', () => {
    const source = read('src/components/Skills.tsx');
    // The two column headings (Core Competencies, Domain Expertise, Certification Highlights)
    // live inside a stagger container. They must NOT have their own initial={{ opacity: 0 }}
    // combined with whileInView — that is the same double-animation blank pattern from
    // ExperienceCard. The parent stagger drives column visibility; headings ride along.
    expect(source).toContain('<h3 className="text-2xl font-bold mb-6 text-white">');
    expect(source).not.toMatch(/<motion\.h3[^>]+whileInView[^>]+>[\s\S]*?Core Competencies/);
    expect(source).not.toMatch(/<motion\.h3[^>]+whileInView[^>]+>[\s\S]*?Domain Expertise/);
    expect(source).not.toMatch(/<motion\.h3[^>]+whileInView[^>]+>[\s\S]*?Certification Highlights/);
  });

  it('repo-wide: every file with an infinite animation references a motion gate (2026-07)', () => {
    // An ungated `repeat: Infinity` runs forever for every visitor — including
    // reduced-motion users and low-power mobile devices. Sweep every production
    // source, present and future: any file declaring an infinite animation must
    // also reference at least one gating signal (prefersReducedMotion /
    // reducedMotion variable, performance tier, hover-motion flag, tier-derived
    // quality prop, or a shouldAnimate* helper). The gate keyword appearing in
    // the file is a necessary (string-level) condition; the per-component
    // coverage tests exercise both branches at runtime.
    const gatePattern = /prefersReducedMotion|reducedMotion|performanceTier|enableHoverMotion|shouldAnimate|quality/;
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) files.push(full);
      }
    };
    walk(resolve(process.cwd(), 'src'));

    const ungated = files.filter((file) => {
      const src = readFileSync(file, 'utf8');
      return src.includes('repeat: Infinity') && !gatePattern.test(src);
    });

    expect(
      ungated,
      `ungated infinite animation(s) — gate on prefersReducedMotion (see StatCard.tsx):\n${ungated.join('\n')}`,
    ).toEqual([]);
  });

  it('repo-wide: no color-affecting property is directly sprung (2026-07)', () => {
    // See incident 7 above. Precise, not a proximity heuristic: flags only a
    // color-affecting property key whose OWN value object sets `type: 'spring'`
    // (e.g. `backgroundColor: { type: 'spring', ... }`) — the shape both real fixes
    // (SectionRail.tsx, experience/logic.ts) now deliberately avoid, always using a
    // tween for these keys instead. A broader "spring anywhere near a color key"
    // proximity check was tried and dropped: it false-positived on a `scale` spring
    // legitimately sharing a per-property transition map with a *tweened* color key
    // (exactly what the fix looks like), and on Navigation.tsx's layoutId shared-element
    // spring, which morphs position/size next to a plain static (non-animated) style
    // color — neither is the bug this guards against.
    const directSpringOnColorPattern =
      /\b(?:backgroundColor|borderColor|boxShadow)\s*:\s*\{[^{}]*type:\s*['"]spring['"]/;

    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) files.push(full);
      }
    };
    walk(resolve(process.cwd(), 'src'));

    const offenders = files.filter((file) => directSpringOnColorPattern.test(readFileSync(file, 'utf8')));

    expect(
      offenders,
      `color-affecting property directly sprung — use a tween instead (see SectionRail.tsx or experience/logic.ts's getTimelineDotTransition):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
