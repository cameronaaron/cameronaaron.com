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
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
    const source = read('src/components/ui/AmbientBackground.tsx');
    expect(source).toContain("const animateOrbs = performanceTier === 'full';");
    // Must NOT enable animation for 'balanced' (mobile) tier
    expect(source).not.toMatch(/animateOrbs\s*=.*balanced/);
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
    // Must not start at text-4xl (too large for 390px screens)
    expect(source).toContain('text-3xl sm:text-4xl md:text-6xl');
  });

  it('IntroCurtain is a static import in the page shell (no ssr:false dynamic import)', () => {
    const source = read('src/app/page.tsx');
    // Static import ensures the curtain is present on first paint — no flash
    expect(source).toContain("import IntroCurtain from '@/components/ui/IntroCurtain'");
    // Dynamic lazy import of IntroCurtain must not exist
    expect(source).not.toMatch(/dynamic\s*\([^)]*IntroCurtain/);
  });

  it('CursorTrail cleans up the mouseenter listener on unmount (memory leak fix)', () => {
    const source = read('src/components/ui/CursorTrail.tsx');
    // The mouseenter handler must be a named const so the same reference can be removed
    expect(source).toContain('const handleMouseEnter');
    expect(source).toContain("document.addEventListener('mouseenter', handleMouseEnter");
    expect(source).toContain("document.removeEventListener('mouseenter', handleMouseEnter");
  });

  it('event listeners in cursor and particle components use passive flag', () => {
    for (const path of [
      'src/components/ui/CursorTrail.tsx',
      'src/components/ui/CustomCursor.tsx',
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

  it('useMousePosition and useScrollPosition hooks use passive listeners', () => {
    const mouse = read('src/hooks/useMousePosition.ts');
    const scroll = read('src/hooks/useScrollPosition.ts');
    expect(mouse.split('\n').find((l) => l.includes("addEventListener('mousemove'"))).toContain('passive: true');
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
});
