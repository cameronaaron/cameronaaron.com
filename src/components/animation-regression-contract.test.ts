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
 *
 * 8. ReactionTimeGame stimulus-onset timestamp captured before paint (2026-07)
 *    goTimestamp was stamped with performance.now() inside the setTimeout callback that
 *    ALSO flipped phase to 'go' — before React re-rendered and the browser painted the
 *    "go" state. Render + commit + paint take real time (a frame or more), so every
 *    measured reaction was inflated by however long that took, making genuinely fast
 *    reactions read as merely typical and typical ones read as slow.
 *    Fix: setTimeout only flips the phase; a separate effect keyed on phase === 'go'
 *    waits for the next requestAnimationFrame and uses THAT frame's own timestamp as
 *    goTimestamp — aligned with the frame the browser is about to paint.
 *
 * 9. Hero world-word painted across the subject's face (2026-09)
 *    The per-world display word ("Build"/"Question"/"Care"/"Grow") was an absolutely
 *    positioned child of .hero-stage at z-index 25 — i.e. stacked ON TOP of the
 *    portrait. Measured against /out at 1440x900 and 390x844: a 246x93px slab of type
 *    across the subject's chin on desktop, 114x45px across the lower face on mobile.
 *    Pushing it behind the portrait (z-index 0) only traded that for clipped-looking
 *    text, and the geometry showed no absolute offset clears BOTH the portrait and the
 *    content-full left column at every width — the copy column's buttons and world tabs
 *    occupy the only gutter. Two decorative FloatingBadge icons inside ProfileImage were
 *    also colliding with the meaningful EMT/Security/Research/Future NP pills; they were
 *    deleted outright rather than repositioned.
 *    Fix: the word lives IN FLOW as a sibling after .hero-stage, never absolutely
 *    positioned. Collision becomes impossible by construction rather than tuned per
 *    breakpoint, which is what this contract pins: the word must not be a descendant of
 *    the portrait stage, and its rule must not re-acquire absolute/fixed positioning.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

/** Source with all comments blanked out (kept as whitespace so offsets are
 * preserved), via the real TypeScript scanner — a comment mentioning
 * `repeat: Infinity` while documenting the framer→CSS migration must not read
 * as an actual animation (§6 item 15: match code, not prose). */
function stripComments(src: string): string {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, /* skipTrivia */ false, ts.LanguageVariant.JSX, src);
  let out = '';
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const text = scanner.getTokenText();
    if (token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia) {
      out += text.replace(/[^\n]/g, ' ');
    } else {
      out += text;
    }
    token = scanner.scan();
  }
  return out;
}

/** The className string literal of a JSX opening element, or '' when it is not
 * a plain literal (template/expression classNames are not what this pins). */
function classNameOf(node: ts.JsxOpeningLikeElement): string {
  for (const prop of node.attributes.properties) {
    if (!ts.isJsxAttribute(prop) || prop.name.getText() !== 'className') continue;
    const init = prop.initializer;
    if (init && ts.isStringLiteral(init)) return init.text;
  }
  return '';
}

/** Body of a single top-level CSS rule, matched on its exact selector. */
function cssRuleBody(css: string, selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`CSS rule not found: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

describe('animation regression contract', () => {
  it('hero world word is not a descendant of the portrait stage (2026-09 face-collision)', () => {
    const source = read('src/components/Hero.tsx');
    const file = ts.createSourceFile('Hero.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    // Locate the portrait stage element, then prove the world word is nowhere
    // inside it. Inside .hero-stage there is no offset that clears the portrait
    // at every viewport width, so containment itself is the regression.
    let stage: ts.Node | undefined;
    const findStage = (node: ts.Node): void => {
      if (ts.isJsxElement(node) && /(^|\s)hero-stage(\s|$)/.test(classNameOf(node.openingElement))) {
        stage = node;
      }
      ts.forEachChild(node, findStage);
    };
    findStage(file);
    expect(stage, 'Hero.tsx has no .hero-stage element').toBeDefined();

    let wordInsideStage = false;
    const findWord = (node: ts.Node): void => {
      const cls =
        ts.isJsxSelfClosingElement(node) ? classNameOf(node)
        : ts.isJsxElement(node) ? classNameOf(node.openingElement)
        : '';
      if (cls.includes('hero-stage-word')) wordInsideStage = true;
      ts.forEachChild(node, findWord);
    };
    findWord(stage!);

    expect(
      wordInsideStage,
      'The hero world word is inside .hero-stage again — it will paint over the portrait. Keep it a sibling AFTER the stage.',
    ).toBe(false);

    // ...and it must still exist somewhere in the hero, or the pin is vacuous.
    expect(source).toContain('hero-stage-word');
  });

  it('hero world word stays in flow — never absolutely positioned over the portrait (2026-09)', () => {
    const body = cssRuleBody(read('src/app/globals.css'), '.hero-stage-word');

    expect(/position:\s*(absolute|fixed)/.test(body), '.hero-stage-word re-acquired absolute/fixed positioning').toBe(false);
    expect(/(^|[^-])z-index:/.test(body), '.hero-stage-word re-acquired a z-index').toBe(false);
  });

  it('the portrait carries no decorative FloatingBadge icons overlapping its meaning pills (2026-09)', () => {
    const source = read('src/components/hero/ProfileImage.tsx');

    expect(source).not.toContain('FloatingBadge');
    // The deleted module must stay deleted, not linger as dead code.
    expect(existsSync(resolve(process.cwd(), 'src/components/ui/FloatingBadge.tsx'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/components/ui/floating-badge-logic.ts'))).toBe(false);
  });

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
    // isProfileReady gate added 2026-07-19 (mobile load-flash fix): decorative
    // effects must not mount under the optimistic 'full' default and then
    // unmount when the real tier lands post-hydration.
    expect(source).toContain("shouldRenderParticles: isProfileReady && performanceTier === 'full'");
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

  it('IntroCurtain is a static import in the client page-chrome island (no ssr:false dynamic import)', () => {
    // Moved from page.tsx to PageChrome in the RSC migration (2026-07): page.tsx
    // is now a Server Component and all client orchestration (curtain, overlays,
    // interaction gating) lives in the PageChrome island. The invariant is
    // unchanged — CLAUDE.md #1: IntroCurtain stays a static import so it's
    // present on first paint, never a flash-causing ssr:false dynamic.
    const source = read('src/components/ui/PageChrome.tsx');
    expect(source).toContain("import IntroCurtain from '@/components/ui/IntroCurtain'");
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

  it('usePerformanceProfile uses false initial state (not lazy browser-API initializers) to prevent React #418', () => {
    const perfProfile = read('src/hooks/usePerformanceProfile.ts');

    // Both had lazy initializers that read browser APIs before hydration, causing #418.
    // Fix: useState(false) matches SSR; real values set in useEffect post-hydration.
    expect(perfProfile).not.toContain('useState(() =>');
    expect(perfProfile).toContain('useState(false)');

  });

  it('Skills section headings are plain h3 elements inside the stagger container (no standalone whileInView inside stagger)', () => {
    const source = read('src/components/Skills.tsx');
    // The two column headings (Core Competencies, Domain Expertise, Certification Highlights)
    // live inside a stagger container. They must NOT have their own initial={{ opacity: 0 }}
    // combined with whileInView — that is the same double-animation blank pattern from
    // ExperienceCard. The parent stagger drives column visibility; headings ride along.
    expect(source).toContain('<h3 className="text-2xl font-bold mb-6 text-white">');
    expect(source).not.toMatch(/<m\.h3[^>]+whileInView[^>]+>[\s\S]*?Core Competencies/);
    expect(source).not.toMatch(/<m\.h3[^>]+whileInView[^>]+>[\s\S]*?Domain Expertise/);
    expect(source).not.toMatch(/<m\.h3[^>]+whileInView[^>]+>[\s\S]*?Certification Highlights/);
  });

  it('repo-wide: every file with a framer infinite animation references a motion gate (2026-07)', () => {
    // A framer `repeat: Infinity` drives a requestAnimationFrame + MotionValue
    // write on the MAIN thread every frame, forever, for every visitor — the
    // exact class of work that pegged real-mobile TBT to 4.6s until the
    // decorative loops were moved to CSS (see the CSS-conversion sweep below).
    // Any framer infinite animation that remains must reference a gating signal
    // (prefersReducedMotion / reducedMotion, performance tier, hover-motion
    // flag, tier-derived quality prop, isCoarsePointer, or a shouldAnimate*
    // helper) so it never runs on the reduced-motion / low-power mobile path.
    // CSS `@keyframes ... infinite` animations are exempt: they run on the
    // compositor, are frozen globally by globals.css's prefers-reduced-motion
    // block, and pause off-screen with their section's content-visibility —
    // they are the *fix*, not the thing being gated.
    const gatePattern = /prefersReducedMotion|reducedMotion|performanceTier|enableHoverMotion|shouldAnimate|quality|isCoarsePointer/;
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
      // Match `repeat: Infinity` in real code only, not in a prose comment
      // describing the framer→CSS migration (§6 item 15: a sweep that matches
      // its own documentation is a broken sweep).
      const src = stripComments(readFileSync(file, 'utf8'));
      return /repeat:\s*Infinity/.test(src) && !gatePattern.test(src);
    });

    expect(
      ungated,
      `ungated framer infinite animation(s) — gate it (prefersReducedMotion / isCoarsePointer / tier), or convert it to a CSS @keyframes loop (see globals.css):\n${ungated.join('\n')}`,
    ).toEqual([]);
  });

  it('mobile-path decorative loops stay CSS, and every *-anim class exists in globals.css (2026-07)', () => {
    // These components render on the mobile (balanced/reduced) path and each
    // carried framer repeat:Infinity loops that, multiplied across the page
    // (SectionHandoff ×7 × {glow,ring,3 dots}, StatCard ×5 × 3, per-card
    // ProjectCard/SkillBar), pegged a real Moto G Power's main thread to a 4.6s
    // TBT. Their infinite animations are now CSS @keyframes — compositor-run
    // and paused off-screen by their section's content-visibility. Lock it in:
    // (a) a framer repeat:Infinity reappearing in any of them is a mobile-perf
    // regression, and (b) any `*-anim` class referenced anywhere in src must be
    // defined in globals.css — a typo'd or deleted class is a silently dead
    // animation the type system can't catch.
    const CSS_CONVERTED = [
      'src/components/ui/SectionTransitions.tsx',
      'src/components/ui/StatCard.tsx',
      'src/components/ui/SkillBar.tsx',
      'src/components/projects/ProjectCard.tsx',
      'src/components/certifications/HeartbeatMonitor.tsx',
    ];
    const reintroduced = CSS_CONVERTED.filter((rel) => /repeat:\s*Infinity/.test(stripComments(read(rel))));
    expect(
      reintroduced,
      `framer repeat:Infinity reintroduced on the mobile path — keep these decorative loops as CSS @keyframes:\n${reintroduced.join('\n')}`,
    ).toEqual([]);

    const globals = read('src/app/globals.css');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) files.push(full);
      }
    };
    walk(resolve(process.cwd(), 'src'));

    const missing: string[] = [];
    let referencedCount = 0;
    for (const file of files) {
      const src = stripComments(readFileSync(file, 'utf8'));
      for (const match of src.matchAll(/\b([a-z]+(?:-[a-z]+)*-anim)\b/g)) {
        referencedCount += 1;
        const cls = match[1];
        if (!globals.includes(`.${cls} `) && !globals.includes(`.${cls}\n`) && !globals.includes(`.${cls}{`)) {
          missing.push(`${file.replace(`${resolve(process.cwd())}/`, '')} → .${cls}`);
        }
      }
    }
    // Guard the guard (§6 item 8): the sweep must actually be finding classes.
    expect(referencedCount, 'no *-anim classes found — the sweep regex is broken').toBeGreaterThanOrEqual(10);
    expect(
      Array.from(new Set(missing)),
      `*-anim class referenced in a component but not defined in globals.css (dead animation):\n${Array.from(new Set(missing)).join('\n')}`,
    ).toEqual([]);
  });

  it('every canvas rAF loop is gated on visibility so it never draws frames nobody sees (§3.7, 2026-07)', () => {
    // A component that renders a <canvas> and runs a requestAnimationFrame draw
    // loop is the most expensive continuous-work pattern on the page — every
    // frame clears, advances, and RE-RASTERISES. §3.7 requires that work to run
    // only while visible. Below-fold canvases get it free (useInView unmounts
    // them), but the hero particle canvases are always mounted (index 0) and so
    // ran their loop forever — even scrolled off-screen, even in a background
    // tab. Root-caused via a CPU-throttled trace where RasterTask dominated the
    // desktop main thread. Fixed with gateLoopOnVisibility; this locks it in so
    // a new canvas animation can't reintroduce the waste.
    //
    // A file passes by referencing a real visibility gate (gateLoopOnVisibility
    // or useInView). Genuine exceptions — a loop that self-terminates or
    // self-sleeps, so it is not perpetual — go in ALLOWED_UNGATED_CANVAS_LOOPS
    // with a concrete, checkable reason (§6 item 18), never a blanket excuse.
    const ALLOWED_UNGATED_CANVAS_LOOPS: Record<string, string> = {
      'src/components/ui/CursorComet.tsx':
        'Self-sleeps: the loop sets frameId=0 and returns when pool.liveCount===0 and nothing emitted, so it stops within one spark lifetime of the pointer going still — bounded off-screen work, restarted by wake() on real movement, never perpetual.',
      'src/components/hero/GlyphDissolveName.tsx':
        'Finite: the tick returns without rescheduling once hasEnteringFinished/hasLeavingFinished, so the name dissolve plays exactly once and stops — it is not a perpetual loop.',
    };
    const VISIBILITY_GATE = /gateLoopOnVisibility|useInView/;

    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx$/.test(entry.name) && !/\.test\./.test(entry.name)) files.push(full);
      }
    };
    walk(resolve(process.cwd(), 'src/components'));

    const canvasLoops: string[] = [];
    const ungated: string[] = [];
    for (const file of files) {
      const src = stripComments(readFileSync(file, 'utf8'));
      if (!src.includes('<canvas') || !/requestAnimationFrame\s*\(/.test(src)) continue;
      const rel = file.replace(`${resolve(process.cwd())}/`, '');
      canvasLoops.push(rel);
      if (rel in ALLOWED_UNGATED_CANVAS_LOOPS) continue;
      if (!VISIBILITY_GATE.test(src)) ungated.push(rel);
    }

    // Guard the guard (§6 item 8): the sweep must actually be finding the
    // canvas components, or it would pass vacuously.
    expect(canvasLoops.length, 'no canvas rAF components found — the sweep is broken').toBeGreaterThanOrEqual(5);
    expect(
      ungated,
      `canvas rAF loop not gated on visibility (§3.7) — wire it through gateLoopOnVisibility / useInView, or add a reasoned ALLOWED_UNGATED_CANVAS_LOOPS entry:\n${ungated.join('\n')}`,
    ).toEqual([]);

    for (const [key, reason] of Object.entries(ALLOWED_UNGATED_CANVAS_LOOPS)) {
      expect(reason.length, `ALLOWED_UNGATED_CANVAS_LOOPS["${key}"] needs a real, specific reason`).toBeGreaterThan(30);
    }
  });

  it('every CSS @keyframes animates only compositor-friendly properties (2026-07)', () => {
    // A CSS animation that touches transform/opacity/filter runs on the
    // compositor thread — zero main-thread cost per frame, which is the entire
    // reason the decorative loops were moved off framer's rAF onto CSS. Animate
    // anything else (box-shadow, width/height/top/left, background-position,
    // stroke-dashoffset) and the browser must re-paint or re-layout every frame
    // on the MAIN thread — the exact jank Lighthouse's "avoid non-composited
    // animations" audit flags. This keeps every keyframe compositable, so a
    // future decorative loop can't silently reintroduce per-frame paint work.
    // Genuine exceptions go in ALLOWED_NONCOMPOSITED with a reason (§6 item 18).
    const COMPOSITABLE = new Set(['transform', 'opacity', 'filter', '-webkit-filter', 'visibility']);
    const ALLOWED_NONCOMPOSITED: Record<string, string> = {
      'ecg-trace':
        'A genuine SVG line-draw (the "Live vitals" ECG) needs stroke-dashoffset, which has no compositable equivalent. Scoped to one 12x4px single-element decoration in the Certifications section; Lighthouse scores this audit as UNSCORED (no effect on the perf number), and the element is off-screen-paused by its section content-visibility. Not worth a fragile mask-based rewrite.',
    };

    const css = read('src/app/globals.css');
    const violations: string[] = [];
    let keyframeCount = 0;
    const re = /@keyframes\s+([A-Za-z0-9_-]+)\s*\{/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(css))) {
      keyframeCount += 1;
      const name = match[1];
      // Brace-match the block body.
      let i = re.lastIndex;
      let depth = 1;
      const start = i;
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth += 1;
        else if (css[i] === '}') depth -= 1;
        i += 1;
      }
      const body = css.slice(start, i - 1);
      const animated = new Set(
        [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]).filter((p) => p !== 'content'),
      );
      const offenders = [...animated].filter((p) => !COMPOSITABLE.has(p));
      if (offenders.length && !(name in ALLOWED_NONCOMPOSITED)) {
        violations.push(`  @keyframes ${name} animates non-composited: ${offenders.join(', ')}`);
      }
    }

    // Guard the guard (§6 item 8): the parser must be finding keyframes.
    expect(keyframeCount, 'no @keyframes found — the parser is broken').toBeGreaterThanOrEqual(10);
    expect(
      violations,
      `CSS keyframes must animate only transform/opacity/filter (compositor thread). Rework to a compositable property, or add a reasoned ALLOWED_NONCOMPOSITED entry:\n${violations.join('\n')}`,
    ).toEqual([]);

    for (const [key, reason] of Object.entries(ALLOWED_NONCOMPOSITED)) {
      expect(reason.length, `ALLOWED_NONCOMPOSITED["${key}"] needs a real, specific reason`).toBeGreaterThan(30);
    }
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

  it('ReactionTimeGame stamps goTimestamp from a requestAnimationFrame callback, not inside the go setTimeout', () => {
    // Parsed with the real TypeScript compiler rather than a brace-matching
    // regex reconstructing the callback bodies — the exact class of fragile
    // check this repo's own regression ratchet (item 15) warns against.
    const filePath = resolve(process.cwd(), 'src/components/projects/reaction-game/ReactionTimeGame.tsx');
    const source = readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    function forEachDescendant(node: ts.Node, visit: (n: ts.Node) => void): void {
      visit(node);
      ts.forEachChild(node, (child) => forEachDescendant(child, visit));
    }

    function callsIdentifier(node: ts.Node, name: string): boolean {
      let found = false;
      forEachDescendant(node, (n) => {
        if (!found && ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === name) {
          found = true;
        }
      });
      return found;
    }

    function referencesPropertyAccess(node: ts.Node, objectName: string, propertyName: string): boolean {
      let found = false;
      forEachDescendant(node, (n) => {
        if (
          !found &&
          ts.isCallExpression(n) &&
          ts.isPropertyAccessExpression(n.expression) &&
          ts.isIdentifier(n.expression.expression) &&
          n.expression.expression.text === objectName &&
          n.expression.name.text === propertyName
        ) {
          found = true;
        }
      });
      return found;
    }

    let setTimeoutCallback: ts.Node | null = null;
    let rafCallback: ts.ArrowFunction | null = null;

    forEachDescendant(sourceFile, (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'window' &&
        node.expression.name.text === 'setTimeout' &&
        node.arguments.length > 0
      ) {
        setTimeoutCallback = node.arguments[0];
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'requestAnimationFrame' &&
        node.arguments.length > 0 &&
        ts.isArrowFunction(node.arguments[0])
      ) {
        rafCallback = node.arguments[0];
      }
    });

    expect(setTimeoutCallback, 'expected to find the pre-go window.setTimeout callback').not.toBeNull();
    // The setTimeout that flips phase to 'go' must NOT also call performance.now()
    // to seed goTimestamp — that's the exact pre-paint measurement bug (item 8 above).
    expect(referencesPropertyAccess(setTimeoutCallback!, 'performance', 'now')).toBe(false);
    expect(callsIdentifier(setTimeoutCallback!, 'setPhase')).toBe(true);

    expect(rafCallback, 'expected to find a requestAnimationFrame(arrow) callback').not.toBeNull();
    expect(rafCallback!.parameters[0]?.name.getText()).toBe('paintTime');
    expect(callsIdentifier(rafCallback!, 'setGoTimestamp')).toBe(true);
  });

  it('continuous-work widgets gate on visibility — ENGINEERING-STANDARDS §3.7', () => {
    // Each of these runs a rAF loop, physics sim, or countdown; before the
    // gate (2026-07-19) they all started at page mount and the predator-prey
    // score accrued before a visitor ever scrolled to Projects. Honest-
    // throttled mobile TBT went 690ms -> 27ms with gating in place.
    const gatedWidgets = [
      'src/components/projects/predator-prey/PredatorPreyChase.tsx',
      'src/components/projects/reaction-game/ReactionTimeGame.tsx',
      'src/components/skills/SkillWeb.tsx',
      'src/components/ui/RibbonBand.tsx',
      'src/components/ui/MagneticField.tsx',
    ];
    for (const file of gatedWidgets) {
      const source = read(file);
      expect(source, `${file} must import useInView (§3.7 visibility gate)`).toContain('useInView');
      expect(source, `${file} must gate its effect on the in-view flag`).toMatch(/isInView/);
    }
  });

  it('below-fold non-content widgets are code-split — ENGINEERING-STANDARDS §3.8', () => {
    // Split (measured +0.03 mobile, desktop flat — §4.7 item 8).
    //
    // Swept across every production source rather than pinned to
    // Projects.tsx (2026-07-25). The requirement is "this widget is not in the
    // initial bundle", which is a property of the widget, not of whichever
    // file happens to hold its import — and the old file-pin proved that:
    // moving the games behind an InteractiveDemoSlot dispatch table (§2.2)
    // failed this check while the code-split it protects was fully intact.
    // Same lesson as RibbonBandLazy below, and the same "sweeps over pins"
    // rule as §6 item 2. As a sweep it also covers every FUTURE game
    // automatically, which the enumerated pin never did.
    const splitFiles: string[] = [];
    const walkSplit = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walkSplit(full);
        else if (/\.tsx?$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) splitFiles.push(full);
      }
    };
    walkSplit(resolve(process.cwd(), 'src'));
    const productionSources = splitFiles.map((file) => readFileSync(file, 'utf8'));
    const splitWidgets = [
      'dna-game/DnaSnpGame',
      'reaction-game/ReactionTimeGame',
      'predator-prey/PredatorPreyChase',
      'toxoplasma/ToxoplasmaMaze',
      'tohoku/TohokuDialectGame',
      'collective-intelligence/CollectiveIntelligenceGame',
      'ephemeral-room/EphemeralRoomGame',
      'twice-exceptional/TwiceExceptionalGame',
      'divergent-thinking/DivergentThinkingGame',
    ];
    for (const widget of splitWidgets) {
      // Whitespace-tolerant on purpose: a longer module path wraps across
      // lines under Prettier, and a contract that fails on line-wrapping is
      // testing formatting, not the code-split it exists to protect. The
      // load-bearing parts — this exact module path, and `ssr: false` — are
      // still required exactly.
      const pattern = new RegExp(
        `dynamic\\(\\s*\\(\\)\\s*=>\\s*import\\(\\s*'@/components/projects/${widget.replace(
          '/',
          '\\/'
        )}'\\s*\\)\\s*,\\s*\\{\\s*ssr:\\s*false\\s*,?\\s*\\}\\s*\\)`
      );
      expect(
        productionSources.some((source) => pattern.test(source)),
        `${widget} must be dynamically imported with ssr:false somewhere in production (§3.8)`
      ).toBe(true);
    }
    expect(read('src/components/Skills.tsx')).toContain("dynamic(() => import('@/components/skills/SkillWeb'), { ssr: false })");
    // RibbonBand's ssr:false dynamic moved to the RibbonBandLazy client island
    // (RSC migration, 2026-07): next/dynamic with ssr:false is disallowed inside
    // a Server Component, so the now-server page.tsx renders <RibbonBandLazy/>,
    // which carries the lazy import. §3.8 code-split preserved.
    expect(read('src/components/ui/RibbonBandLazy.tsx')).toContain("dynamic(() => import('@/components/ui/RibbonBand'), { ssr: false })");

    // Deliberately NOT split — it wraps real content (the contact links),
    // which must stay in the prerendered HTML (§3.8's content boundary):
    expect(read('src/components/Contact.tsx')).toContain("import MagneticField from '@/components/ui/MagneticField'");
  });
});
