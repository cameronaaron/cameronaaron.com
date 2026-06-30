import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('modularization contract', () => {
  it('keeps CursorTrail wired to extracted cursor-trail logic module', () => {
    const source = read('src/components/ui/CursorTrail.tsx');

    expect(source).toContain("from './cursor-trail/logic'");
    expect(source).not.toContain('a, button, [role="button"], input, textarea, select, label, [data-cursor="interactive"]');
    expect(source).not.toContain('const relativeAge = 1 - index / Math.max(1, all.length);');
    expect(source).not.toContain('const decay = 0.035 + relativeAge * 0.02;');
  });

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

  it('keeps FAQ open-state and id generation helpers extracted', () => {
    const source = read('src/components/FAQ.tsx');

    expect(source).toContain("from '@/components/faq/logic'");
    expect(source).not.toContain('const panelId = `faq-panel-${index}`;');
    expect(source).not.toContain('const buttonId = `faq-trigger-${index}`;');
    expect(source).not.toContain('onClick={() => setOpenIndex(isOpen ? null : index)}');
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

  it('keeps KeyboardShortcuts target/editable helpers extracted', () => {
    const source = read('src/components/ui/KeyboardShortcuts.tsx');

    expect(source).toContain("from '@/components/ui/keyboard-shortcuts-logic'");
    expect(source).not.toContain('const JUMP_MAP: Record<string, string> = SHORTCUTS.filter(');
    expect(source).not.toContain('function isEditableTarget(target: EventTarget | null): boolean {');
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

  it('keeps CursorTrail brain cursor renderer extracted to dedicated module', () => {
    const source = read('src/components/ui/CursorTrail.tsx');

    expect(source).toContain("from '@/components/ui/BrainCursor'");
    expect(source).not.toContain('function BrainCursor({ active }: { active: boolean }) {');
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

  it('keeps SectionRail most-visible entry sort extracted to section-rail-logic module', () => {
    const source = read('src/components/ui/SectionRail.tsx');

    expect(source).toContain("from './section-rail-logic'");
    expect(source).not.toContain('.filter((entry) => entry.isIntersecting)');
    expect(source).not.toContain('.sort((a, b) => b.intersectionRatio - a.intersectionRatio)');
  });

  it('keeps AmbientBackground orb-count and animate-flag extracted to logic module', () => {
    const source = read('src/components/ui/AmbientBackground.tsx');

    expect(source).toContain("from './ambient-background-logic'");
    expect(source).not.toContain("performanceTier === 'full'\n      ? ORBS.length");
    expect(source).not.toContain("const animateOrbs = performanceTier === 'full'");
  });
});
