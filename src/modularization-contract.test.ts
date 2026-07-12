import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

// Every production component/page file — present AND future. The per-file
// checks below pin known extractions; the sweeps at the bottom stop new
// components from inlining logic in the first place.
function listProductionComponentFiles(): string[] {
  const roots = [resolve(process.cwd(), 'src/components'), resolve(process.cwd(), 'src/app')];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
        files.push(full);
      }
    }
  };
  for (const root of roots) walk(root);
  return files;
}

describe('modularization contract', () => {
  it('keeps InteractiveParticles wired to extracted simulation engine', () => {
    const source = read('src/components/hero/InteractiveParticles.tsx');

    expect(source).toContain("from './interactive-particles/engine'");
    expect(source).not.toContain('function createSeededRandom(');
    expect(source).not.toContain('function createInitialParticles(');
  });

  it('keeps StructuredData schema construction in builders module', () => {
    const source = read('src/components/StructuredData.tsx');

    expect(source).toContain("from './structured-data/builders'");
    expect(source).not.toContain('const personSchema =');
    expect(source).not.toContain('const faqPageSchema =');
  });

  it('keeps Home page section transitions extracted into reusable ui module', () => {
    const source = read('src/app/page.tsx');

    expect(source).toContain("from '@/components/ui/SectionTransitions'");
    expect(source).not.toContain('function SectionReveal(');
    expect(source).not.toContain('function SectionHandoff(');
  });

  it('keeps Navigation section-tracking logic extracted', () => {
    const source = read('src/components/Navigation.tsx');

    expect(source).toContain("from '@/components/navigation/logic'");
    expect(source).not.toContain('const triggerLine = 140;');
    expect(source).not.toContain("const sectionId = item.href.replace('#', '');");
  });

  it('keeps Skills sorting, motion config, and static data extracted', () => {
    const source = read('src/components/Skills.tsx');

    expect(source).toContain("from '@/components/skills/logic'");
    // Sort logic
    expect(source).not.toContain("return [...skills.technical].sort((a, b) => b.level - a.level);");
    expect(source).not.toContain("return [...skills.technical].sort((a, b) => a.name.localeCompare(b.name));");
    // Motion config must come from logic, not be derived inline
    expect(source).not.toContain("performanceTier === 'lite' || performanceTier === 'reduced'");
    expect(source).toContain('getSkillsMotionConfig(performanceTier)');
    // Phase chips must come from the exported constant, not be inlined
    expect(source).toContain('SKILLS_JOURNEY_PHASES');
    expect(source).not.toContain("['Assess', 'Apply', 'Validate']");
    // Skill bar entry transition must use the extracted helper
    expect(source).toContain('getSkillBarEntryTransition(isLiteMotion, index)');
    // Column variants must use the extracted helper (no inline ±36 magic numbers)
    expect(source).toContain("getSkillColumnVariants(isLiteMotion, 'left', entryYOffset)");
    expect(source).toContain("getSkillColumnVariants(isLiteMotion, 'right', entryYOffset)");
    // Domain card hover transition must not mix tween type with spring props
    expect(source).toContain('getDomainCardHoverTransition(isLiteMotion)');
    expect(source).not.toContain("type: isLiteMotion ? 'tween' : 'spring'");
  });

  it('keeps Hero motion config and static badge/chip catalogs extracted', () => {
    const source = read('src/components/Hero.tsx');

    expect(source).toContain("from '@/components/hero/logic'");
    expect(source).not.toContain("const parallaxDepth = performanceTier === 'full' ? 150 : performanceTier === 'balanced' ? 100 : 45;");
    expect(source).not.toContain("['Engineering', 'Security', 'Clinical Care', 'NP Path']");
  });

  it('keeps Experience sorting and timeline config extracted', () => {
    const source = read('src/components/Experience.tsx');

    expect(source).toContain("from '@/components/experience/logic'");
    expect(source).not.toContain('const isLiteMotion = performanceTier === \'lite\' || performanceTier === \'reduced\';');
    expect(source).not.toContain("['Clinical operations', 'Research translation', 'Security and systems']");
    expect(source).not.toContain('const sortedExperiences = [...experiences]');
    // Timeline dot animation and transition must use extracted helpers
    expect(source).toContain('getTimelineDotAnimation(isLiteMotion, activeExperienceIndex === index)');
    expect(source).toContain('getTimelineDotTransition(isLiteMotion)');
    expect(source).not.toContain("boxShadow: isLiteMotion ? '0 0 10px");
  });

  it('keeps Projects data grouping and signal derivation extracted', () => {
    const source = read('src/components/Projects.tsx');

    expect(source).toContain("from '@/components/projects/logic'");
    expect(source).not.toContain('projects.filter((project) => project.featured)');
    expect(source).not.toContain('Array.from(new Set(projects.flatMap((project) => project.tags))).slice(0, 10)');
  });

  it('keeps Testimonials filtering and spotlight logic extracted', () => {
    const source = read('src/components/Testimonials.tsx');

    expect(source).toContain("from '@/components/testimonials/logic'");
    expect(source).not.toContain("type RelationshipFilter = 'all' | 'manager' | 'mentor' | 'colleague';");
    expect(source).not.toContain('const relationshipOptions: Array<{ key: RelationshipFilter; label: string }> = [');
    expect(source).not.toContain('const next = (current + direction + featuredTestimonials.length) % featuredTestimonials.length;');
  });

  it('keeps Contact social-link derivation and animation config extracted', () => {
    const source = read('src/components/Contact.tsx');

    expect(source).toContain("from '@/components/contact/logic'");
    expect(source).not.toContain("offset: ['start 85%', 'center 40%']");
    expect(source).not.toContain('const revealProgress = useSpring(revealRaw, { stiffness: 130, damping: 26, mass: 0.45 });');
    expect(source).not.toContain('socialPlatforms.map((social, index) => (');
  });

  it('keeps Certifications URL and sorting helpers extracted', () => {
    const source = read('src/components/Certifications.tsx');

    expect(source).toContain("from '@/components/certifications/logic'");
    expect(source).not.toContain('function buildVerificationHref(cert: Certification): string {');
    expect(source).not.toContain('const sortedCertifications = sortByDateDesc(certifications, (certification) => certification.status);');
    expect(source).not.toContain('index % 2 === 0 ? -16 : 16');
  });

  it('keeps Education sorting and status helpers extracted', () => {
    const source = read('src/components/Education.tsx');

    expect(source).toContain("from '@/components/education/logic'");
    expect(source).not.toContain('function isNonFinalizedCourseStatus(status: string): boolean {');
    expect(source).not.toContain('const sortedPrerequisiteCourses = [...prerequisiteCourses].sort((left, right) => {');
    expect(source).not.toContain('const formatGradeDisplay = (grade: string, gpa?: string) => {');
  });

  it('keeps ExperienceCard monogram and tilt math extracted', () => {
    const source = read('src/components/experience/ExperienceCard.tsx');

    expect(source).toContain("from '@/components/experience/card-logic'");
    expect(source).not.toContain('.split(/\\s+/)');
    expect(source).not.toContain('const centerX = rect.left + rect.width / 2;');
    expect(source).not.toContain('const percentY = (clientY - centerY) / (rect.height / 2);');
  });

  it('keeps ProjectCard reading-time, CTA fallback, and tilt math extracted', () => {
    const source = read('src/components/projects/ProjectCard.tsx');

    expect(source).toContain("from '@/components/projects/card-logic'");
    expect(source).not.toContain('Math.max(2, Math.ceil(project.description.length / 130))');
    expect(source).not.toContain("project.cta ?? 'Read More'");
    expect(source).not.toContain('const centerX = rect.left + rect.width / 2;');
  });

  it('keeps ProfileImage pointer normalization and animation helpers extracted', () => {
    const source = read('src/components/hero/ProfileImage.tsx');

    expect(source).toContain("from '@/components/hero/profile-image-logic'");
    expect(source).not.toContain("const springConfig = { damping: 20, stiffness: 100 };");
    expect(source).not.toContain("const centerX = rect.left + rect.width / 2;");
    expect(source).not.toContain("y: prefersReducedMotion ? 0 : [0, -20, 0]");
  });

  it('keeps FeaturedProject spotlight math and display helpers extracted', () => {
    const source = read('src/components/projects/FeaturedProject.tsx');

    expect(source).toContain("from '@/components/projects/featured-logic'");
    expect(source).not.toContain('const xPct = ((event.clientX - rect.left) / rect.width) * 100;');
    expect(source).not.toContain("project.cta ?? 'View Publication'");
    expect(source).not.toContain("project.title.split(' ')[0]");
  });

  it('keeps SocialLink reveal and icon-path logic extracted', () => {
    const source = read('src/components/contact/SocialLink.tsx');

    expect(source).toContain("from '@/components/contact/social-link-logic'");
    expect(source).not.toContain('const start = 0.08 + index * 0.16;');
    expect(source).not.toContain('const end = start + 0.4;');
    expect(source).not.toContain('M12 .3a12 12 0 0 0-3.8 23.4');
  });

  it('keeps TestimonialCard aria labels and meta formatting extracted', () => {
    const source = read('src/components/testimonials/TestimonialCard.tsx');

    expect(source).toContain("from '@/components/testimonials/card-logic'");
    expect(source).not.toContain('aria-label={`Open ${testimonial.name}\'s LinkedIn profile`}');
    expect(source).not.toContain('aria-label={`Open ${testimonial.company} website`}');
    expect(source).not.toContain('{testimonial.relationship} • {testimonial.date}');
  });

  it('keeps BackgroundParticles engine and quality config extracted', () => {
    const source = read('src/components/hero/BackgroundParticles.tsx');

    expect(source).toContain("from '@/components/hero/background-particles/engine'");
    expect(source).not.toContain('const qualityConfig = {');
    expect(source).not.toContain('particles.push({');
    expect(source).not.toContain('const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);');
  });

  it('keeps FloatingBadge position and icon helpers extracted', () => {
    const source = read('src/components/ui/FloatingBadge.tsx');

    expect(source).toContain("from '@/components/ui/floating-badge-logic'");
    expect(source).toContain("from '@/components/ui/floating-badge-icon'");
    expect(source).not.toContain('const positionStyles = {');
    expect(source).not.toContain('function BadgeIcon(');
  });

  it('keeps IframeTitleGuard title inference logic extracted', () => {
    const source = read('src/components/ui/IframeTitleGuard.tsx');

    expect(source).toContain("from '@/components/ui/iframe-title-guard-logic'");
    expect(source).not.toContain('function getIframeTitle(');
    expect(source).not.toContain('function ensureIframeTitle(');
  });

  it('keeps TextReveal storage and split helpers extracted', () => {
    const source = read('src/components/ui/TextReveal.tsx');

    expect(source).toContain("from '@/components/ui/text-reveal-logic'");
    expect(source).not.toContain('function readInitialReveal(');
    expect(source).not.toContain('const words = text.split(" ");');
  });

  it('keeps IntroCurtain navigation and persistence helpers extracted', () => {
    const source = read('src/components/ui/IntroCurtain.tsx');

    expect(source).toContain("from '@/components/ui/intro-curtain-logic'");
    expect(source).not.toContain("const STORAGE_KEY = 'intro-curtain-shown';");
    expect(source).not.toContain('function shouldSkipInitialCurtain(): boolean {');
  });

  it('keeps KeyboardShortcuts target/editable helpers AND the shortcut catalog extracted', () => {
    const source = read('src/components/ui/KeyboardShortcuts.tsx');

    expect(source).toContain("from '@/components/ui/keyboard-shortcuts-logic'");
    expect(source).not.toContain('const JUMP_MAP: Record<string, string> = SHORTCUTS.filter(');
    expect(source).not.toContain('function isEditableTarget(target: EventTarget | null): boolean {');
    // SHORTCUTS itself (2026-07): the catalog lived in the component next to
    // its own companion logic module for months — moved into
    // keyboard-shortcuts-logic.ts so the component only imports it.
    expect(source).toContain('SHORTCUTS,');
    expect(source).not.toMatch(/^export const SHORTCUTS/m);
  });

  it('keeps TypewriterEffect initial-state and persistence helpers extracted', () => {
    const source = read('src/components/ui/TypewriterEffect.tsx');

    expect(source).toContain("from '@/components/ui/typewriter-effect-logic'");
    expect(source).not.toContain('function readInitialComplete(storageKey: string): boolean {');
    expect(source).not.toContain('const storageKey = `typewriter-complete:${text}`;');
  });

  it('keeps Button style maps and magnetic offset math extracted', () => {
    const source = read('src/components/ui/Button.tsx');

    expect(source).toContain("from '@/components/ui/button-logic'");
    expect(source).not.toContain('const sizeStyles = {');
    expect(source).not.toContain('const variantStyles = {');
    expect(source).not.toContain('const centerX = left + width / 2;');
  });

  it('keeps FadeInWhenVisible direction map extracted', () => {
    const source = read('src/components/ui/FadeInWhenVisible.tsx');

    expect(source).toContain("from '@/components/ui/fade-in-logic'");
    expect(source).not.toContain('const directions = {');
  });

  it('keeps FeaturedProject icon rendering extracted to dedicated module', () => {
    const source = read('src/components/projects/FeaturedProject.tsx');

    expect(source).toContain("from '@/components/projects/FeaturedIcon'");
    expect(source).not.toContain('function FeaturedIcon({ index }: { index: number }) {');
  });

  it('keeps SocialLink icon rendering extracted to dedicated module', () => {
    const source = read('src/components/contact/SocialLink.tsx');

    expect(source).toContain("from '@/components/contact/SocialPlatformIcon'");
    expect(source).not.toContain("function PlatformIcon({ platformKey }: Pick<SocialLinkProps, 'platformKey'>) {");
  });

  it('keeps capstone YouTube embed helper extracted to logic module', () => {
    const page = read('src/app/capstone/page.tsx');
    const logic = read('src/app/capstone/logic.ts');

    expect(page).toContain("from './logic'");
    expect(page).not.toContain('function toYouTubeEmbedUrl(');
    expect(logic).toContain('export function toYouTubeEmbedUrl(');
  });

  it('keeps SectionTransitions glow-tone helper extracted to logic module', () => {
    const source = read('src/components/ui/SectionTransitions.tsx');

    expect(source).toContain("from './section-transitions-logic'");
    expect(source).not.toContain("index % 2 === 0 ? 'from-cyan-400/10");
    expect(source).not.toContain("'from-emerald-400/10 via-secondary/12 to-transparent'");
  });

  it('keeps Tilt mouse-offset math extracted to tilt-logic module', () => {
    const source = read('src/components/ui/Tilt.tsx');

    expect(source).toContain("from './tilt-logic'");
    expect(source).not.toContain('rect.left - rect.width / 2');
    expect(source).not.toContain('mouseXFromCenter / width');
  });

  it('keeps SectionRail most-visible entry sort AND the rail-section catalog extracted', () => {
    const source = read('src/components/ui/SectionRail.tsx');

    expect(source).toContain("from './section-rail-logic'");
    expect(source).not.toContain('.filter((entry) => entry.isIntersecting)');
    expect(source).not.toContain('.sort((a, b) => b.intersectionRatio - a.intersectionRatio)');
    // RAIL_SECTIONS itself (2026-07): same escape as KeyboardShortcuts'
    // SHORTCUTS — moved into section-rail-logic.ts.
    expect(source).toContain('RAIL_SECTIONS');
    expect(source).not.toMatch(/^export const RAIL_SECTIONS/m);
  });

  it('keeps AmbientBackground orb-count and animate-flag extracted to logic module', () => {
    const source = read('src/components/ui/AmbientBackground.tsx');

    expect(source).toContain("from './ambient-background-logic'");
    expect(source).not.toContain("performanceTier === 'full'\n      ? ORBS.length");
    expect(source).not.toContain("const animateOrbs = performanceTier === 'full'");
  });

  it('keeps SpotlightCard mouse-position offset extracted to spotlight-card-logic module', () => {
    const source = read('src/components/ui/SpotlightCard.tsx');

    expect(source).toContain("from './spotlight-card-logic'");
    expect(source).not.toContain('e.clientX - rect.left');
    expect(source).not.toContain('e.clientY - rect.top');
  });

  it('keeps Magnetic center-distance offset extracted to magnetic-logic module', () => {
    const source = read('src/components/ui/Magnetic.tsx');

    expect(source).toContain("from './magnetic-logic'");
    expect(source).not.toContain('rect.width / 2');
    expect(source).not.toContain('distanceX * strength');
  });

  it('keeps InteractiveParticles draw math (sprite geometry, percent→px) in the engine', () => {
    const source = read('src/components/hero/InteractiveParticles.tsx');

    expect(source).toContain('GLOW_SPRITE_SIZE');
    expect(source).toContain('GLOW_DIAMETER_MULTIPLIER');
    expect(source).toContain('getGlowGradientStops');
    expect(source).toContain('percentToPx');
    // No inline sprite geometry or coordinate math left in the component
    expect(source).not.toContain('const SPRITE_SIZE =');
    expect(source).not.toMatch(/\/ 100\) \* width/);
    expect(source).not.toMatch(/addColorStop\(0\.25/);
  });

  it('keeps BackgroundParticles mouse-pull physics and opacity tiers in the engine', () => {
    const source = read('src/components/hero/BackgroundParticles.tsx');

    expect(source).toContain('applyMousePull(');
    expect(source).toContain('BACKGROUND_OPACITY_TIERS');
    expect(source).toContain('MOUSE_INACTIVE_POSITION');
    // The old inline physics and tier table must not return
    expect(source).not.toContain('const OPACITY_TIERS');
    expect(source).not.toContain('force * 0.5');
    expect(source).not.toContain('mouse.x > -900');
  });

  it('keeps QuickActionsDock link catalog and motion config extracted', () => {
    const source = read('src/components/ui/QuickActionsDock.tsx');

    expect(source).toContain("from './quick-actions-dock-logic'");
    expect(source).toContain('QUICK_DOCK_LINKS');
    expect(source).not.toContain("{ label: 'Credentials', href: '#certifications' }");
    expect(source).not.toContain('reduced ? { opacity: 1 } : { opacity: 0, y: 8 }');
    expect(source).not.toContain('delay: reduced ? 0 : index * 0.03');
  });

  it('keeps SmoothScroll scroll-reset decision extracted', () => {
    const source = read('src/components/ui/SmoothScroll.tsx');

    expect(source).toContain("from './smooth-scroll-logic'");
    expect(source).toContain('shouldResetScrollPosition(window.location.hash, navigationEntry?.type)');
    expect(source).not.toContain("navigationEntry?.type === 'reload' || navigationEntry?.type === 'back_forward'");
  });

  it('keeps internet page category grouping extracted to its logic module', () => {
    const source = read('src/app/internet/page.tsx');

    expect(source).toContain("from './logic'");
    expect(source).toContain('groupFeaturesByCategory(sortedFeatures)');
    // No per-category filter scan inline in the page
    expect(source).not.toContain('sortedFeatures.filter((feature) => feature.category === category)');
    expect(source).not.toContain('const categoryOrder');
  });

  // Page/layout metadata extraction (2026-07): every `export const metadata`
  // in src/app was a large inline object — the root layout's alone was 190
  // lines dominated by a ~90-entry SEO keyword array, with zero completeness
  // testing anywhere. Extracted into src/data/metadata.ts (root) and a
  // per-page ./metadata.ts (capstone/credentials/internet), each with a
  // companion .test.ts. This is what widening the data-catalog sweep below
  // was for — these four object literals are exactly what it missed.

  it('keeps root layout metadata and viewport built from src/data/metadata, not inline', () => {
    const source = read('src/app/layout.tsx');

    expect(source).toContain("from \"@/data/metadata\"");
    expect(source).toContain('export const metadata = buildRootMetadata();');
    expect(source).toContain('export const viewport = buildRootViewport();');
    expect(source).not.toContain('metadataBase: new URL(');
    expect(source).not.toContain("'geo.region'");
  });

  it('keeps capstone page metadata built from its own metadata module', () => {
    const source = read('src/app/capstone/page.tsx');

    expect(source).toContain("from './metadata'");
    expect(source).toContain('export const metadata = buildCapstoneMetadata(pageUrl);');
    expect(source).not.toContain("title: 'Bridging Transitions Capstone Defense'");
  });

  it('keeps credentials page metadata built from its own metadata module', () => {
    const source = read('src/app/credentials/page.tsx');

    expect(source).toContain("from './metadata'");
    expect(source).toContain('export const metadata = buildCredentialsMetadata(pageUrl);');
    expect(source).not.toContain("title: 'Credentials and Verification Links'");
  });

  it('keeps internet page metadata built from its own metadata module', () => {
    const source = read('src/app/internet/page.tsx');

    expect(source).toContain("from './metadata'");
    expect(source).toContain('export const metadata = buildInternetMetadata(pageUrl);');
    expect(source).not.toContain("title: 'Cameron Aaron on the Internet'");
  });

  it('every hardcoded https://cameronaaron.com literal is gone — SITE_URL is the only source of truth', () => {
    // 2026-07: the literal was independently hardcoded in 9 files (14
    // occurrences) — layout.tsx, sitemap.ts, robots.ts, three page.tsx
    // files, structured-data/builders.ts, and data/projects.ts. A domain
    // change (or a typo in just one copy) would silently diverge. Now only
    // src/data/site.ts may contain the literal; everything else imports
    // SITE_URL or getPageUrl from it. Repo-wide over src/ (.ts + .tsx,
    // present and future), not just the known offenders.
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) files.push(full);
      }
    };
    walk(resolve(process.cwd(), 'src'));

    const offenders = files.filter((file) => {
      if (file.endsWith('/src/data/site.ts')) return false;
      return readFileSync(file, 'utf8').includes('cameronaaron.com');
    });

    expect(
      offenders,
      `hardcoded site URL outside src/data/site.ts — import SITE_URL/getPageUrl instead:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Repo-wide sweeps — modularity for components that don't exist yet.
// The per-file pins above protect known extractions; these stop any NEW .tsx
// under src/components or src/app from inlining logic that belongs in a
// companion logic module (which the module-testability contract then forces
// to have a co-located test).
// ═══════════════════════════════════════════════════════════════════════════

describe('modularization sweeps — every production .tsx, present and future', () => {
  it('no component sorts inline — sorting lives in logic modules', () => {
    for (const file of listProductionComponentFiles()) {
      const src = readFileSync(file, 'utf8');
      expect(src.includes('.sort('), `${file} sorts inline — extract to a logic module`).toBe(false);
    }
  });

  it('no component reduces inline — aggregation lives in logic modules', () => {
    for (const file of listProductionComponentFiles()) {
      const src = readFileSync(file, 'utf8');
      expect(src.includes('.reduce('), `${file} reduces inline — extract to a logic module`).toBe(false);
    }
  });

  it('no module-level data catalogs in components — catalogs live in logic modules or src/data', () => {
    // A top-level `const xxx = [` or `= {` — bare OR exported — in a component
    // is a content/config catalog (nav links, phases, chips, page metadata)
    // that belongs in src/data or a logic module. Widened 2026-07: the
    // original pattern only matched bare `const` + array literals, missing
    // `export const metadata: Metadata = {...}` (a 190-line SEO/OpenGraph/
    // robots object sat inline in layout.tsx for months) and two exported
    // array catalogs (SectionRail's RAIL_SECTIONS, KeyboardShortcuts'
    // SHORTCUTS) that had a companion *-logic.ts sitting right next to them
    // holding only the functions, not the data. A `export const metadata =
    // buildRootMetadata()` (function call) does NOT match — only a literal
    // `[` or `{` immediately after `=` counts as an inline catalog.
    const catalogPattern = /^(?:export\s+)?const \w+(?::[^=]+)? = [[{]/m;
    for (const file of listProductionComponentFiles()) {
      const src = readFileSync(file, 'utf8');
      expect(
        catalogPattern.test(src),
        `${file} declares a module-level array/object catalog — move it to a logic module or src/data`
      ).toBe(false);
    }
  });

  it('no regex parsing in components — string parsing lives in logic modules', () => {
    const regexCallPattern = /\.(?:match|replace|test|split)\(\s*\//;
    for (const file of listProductionComponentFiles()) {
      const src = readFileSync(file, 'utf8');
      expect(
        regexCallPattern.test(src),
        `${file} parses with a regex literal inline — extract to a logic module`
      ).toBe(false);
    }
  });

  it('no performance-tier ternaries in components — tier mapping lives in logic modules', () => {
    // `performanceTier === 'x' ? a : b` chains are motion-config derivation;
    // components consume getXxxMotionConfig(performanceTier) instead.
    const tierTernaryPattern = /performanceTier === '\w+'[^\n]*\?/;
    for (const file of listProductionComponentFiles()) {
      const src = readFileSync(file, 'utf8');
      expect(
        tierTernaryPattern.test(src),
        `${file} derives config from performanceTier inline — extract a getXxxMotionConfig helper`
      ).toBe(false);
    }
  });
});
