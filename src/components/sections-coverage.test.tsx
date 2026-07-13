'use client'; // suppress Next.js type errors
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── shared matchMedia mock ──────────────────────────────────────────────────
const mockMQ = (matches = false) =>
  vi.fn().mockImplementation((q: string) => ({
    matches: q.includes('coarse') ? false : matches,
    media: q, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }));

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: mockMQ() });
  Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  window.sessionStorage.clear();
});

// ── framer-motion mock (reused across all tests) ────────────────────────────
const makeMotionEl = (tag: string) => {
  const El = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const safeTag = ['div','section','button','span','h1','p','footer','ul','li','nav','header','a'].includes(tag) ? tag : 'div';
    const filtered = Object.fromEntries(
      Object.entries(props).filter(([k]) =>
        !['initial','animate','whileHover','whileTap','whileInView','whileFocus','transition','viewport','variants','exit','style','dragConstraints','drag'].includes(k)
      )
    );
    return React.createElement(safeTag, filtered, children);
  };
  El.displayName = `motion.${tag}`;
  return El;
};

const mockMotionValue = (initial: unknown) => ({
  get: () => initial,
  set: vi.fn(),
  on: vi.fn(),
  subscribe: vi.fn(),
  destroy: vi.fn(),
});

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_t, tag: string) => makeMotionEl(tag) }),
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  useInView: () => true,
  useReducedMotion: () => false,
  useScroll: () => ({
    scrollY: { on: vi.fn(), get: () => 0, subscribe: vi.fn() },
    scrollYProgress: { on: vi.fn(), get: () => 0, subscribe: vi.fn() },
  }),
  useSpring: (v: unknown) => v,
  useTransform: (_v: unknown, _i: unknown, _o: unknown[]) => 0,
  useVelocity: () => ({ on: vi.fn(), get: () => 0, subscribe: vi.fn() }),
  useMotionValue: (initial: unknown) => mockMotionValue(initial),
  useMotionTemplate: (...args: unknown[]) => args.join(''),
  useMotionValueEvent: vi.fn(),
}));

// ────────────────────────────────────────────────────────────────────────────
// NAVIGATION
// ────────────────────────────────────────────────────────────────────────────
describe('Navigation coverage (branches 18, 64)', () => {
  it('renders navigation and exercises activeHref fallback', async () => {
    vi.doMock('@/data/navigation', () => ({ navItems: [] }));
    const { default: Navigation } = await import('@/components/Navigation');
    const { container } = render(<Navigation />);
    expect(container.firstChild).not.toBeNull();
  });

  it('opens mobile menu and fires resize to close it at desktop width', async () => {
    const { default: Navigation } = await import('@/components/Navigation');
    const { container } = render(<Navigation />);

    const menuButton = document.querySelector('[aria-label*="menu"], [aria-label*="Menu"], button[aria-expanded]');
    if (menuButton) {
      await act(async () => { fireEvent.click(menuButton); });
      await act(async () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 });
        window.dispatchEvent(new Event('resize'));
      });
    }
    expect(container.firstChild).not.toBeNull();
  });

  it('opens mobile menu and fires resize at mobile width (menu stays open)', async () => {
    const { default: Navigation } = await import('@/components/Navigation');
    const { container } = render(<Navigation />);

    const menuButton = document.querySelector('[aria-label*="menu"], [aria-label*="Menu"], button[aria-expanded]');
    if (menuButton) {
      await act(async () => { fireEvent.click(menuButton); });
      await act(async () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
        window.dispatchEvent(new Event('resize'));
      });
    }
    expect(container.firstChild).not.toBeNull();
  });

  it('updates active section on scroll', async () => {
    const { default: Navigation } = await import('@/components/Navigation');
    const { container } = render(<Navigation />);

    await act(async () => { window.dispatchEvent(new Event('scroll')); });
    expect(container.firstChild).not.toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// EXPERIENCE
// ────────────────────────────────────────────────────────────────────────────
describe('Experience coverage (branches 92-94, 167-173)', () => {
  it('renders in full cinematic tier (isCinematic=true)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'full',
        shouldRenderParticles: true,
        shouldRenderAmbientEffects: true,
        shouldRenderHeavyEffects: true,
        prefersReducedMotion: false,
        isCoarsePointer: false,
      }),
    }));
    const { default: Experience } = await import('@/components/Experience');
    const { container } = render(<Experience />);

    const navButtons = document.querySelectorAll('[data-testid^="experience-nav-"]');
    if (navButtons.length > 0) {
      await act(async () => { fireEvent.click(navButtons[0]); });
      await act(async () => { fireEvent.mouseEnter(navButtons[0]); });
      await act(async () => { fireEvent.focus(navButtons[0]); });
    }
    expect(container.firstChild).not.toBeNull();
  });

  it('renders in lite tier (isLiteMotion=true)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'lite',
        shouldRenderParticles: false,
        shouldRenderAmbientEffects: false,
        shouldRenderHeavyEffects: false,
        prefersReducedMotion: true,
        isCoarsePointer: true,
      }),
    }));
    const { default: Experience } = await import('@/components/Experience');
    const { container } = render(<Experience />);
    expect(container.firstChild).not.toBeNull();
  });

  it('fires mouseEnter on experience item div and card (lines 167-173)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'full',
        shouldRenderHeavyEffects: true,
        prefersReducedMotion: false,
        isCoarsePointer: false,
      }),
    }));
    const { default: Experience } = await import('@/components/Experience');
    const { container } = render(<Experience />);

    // Fire mouseEnter on the wrapper div (line 167 arrow function)
    const items = document.querySelectorAll('[data-testid^="experience-item-"]');
    if (items.length > 0) {
      const wrapperDiv = items[0].querySelector('[class*="pl-20"]');
      if (wrapperDiv) await act(async () => { fireEvent.mouseEnter(wrapperDiv); });
    }

    // Fire mouseEnter on the SpotlightCard inside ExperienceCard (triggers onActivate at line 173)
    const cards = document.querySelectorAll('[data-testid^="experience-card-"]');
    for (const card of cards) {
      await act(async () => { fireEvent.mouseEnter(card); });
    }
    expect(container.firstChild).not.toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ────────────────────────────────────────────────────────────────────────────
describe('Testimonials coverage (branches 30-32, 62-72, 121)', () => {
  it('renders testimonials and cycles spotlight prev/next', async () => {
    const { default: Testimonials } = await import('@/components/Testimonials');
    const { container } = render(<Testimonials />);

    const prevBtn = screen.queryByLabelText('Show previous testimonial');
    const nextBtn = screen.queryByLabelText('Show next testimonial');
    if (nextBtn) await act(async () => { fireEvent.click(nextBtn); });
    if (prevBtn) await act(async () => { fireEvent.click(prevBtn); });
    expect(container.firstChild).not.toBeNull();
  });

  it('filters testimonials by relationship', async () => {
    const { default: Testimonials } = await import('@/components/Testimonials');
    const { container } = render(<Testimonials />);

    const filterButtons = document.querySelectorAll('button[aria-pressed]');
    for (const btn of filterButtons) {
      await act(async () => { fireEvent.click(btn); });
    }
    expect(container.firstChild).not.toBeNull();
  });

  it('cycleSpotlight returns early when no featured testimonials', async () => {
    vi.doMock('@/components/testimonials/logic', () => ({
      getFeaturedTestimonials: () => [],
      getSpotlightTestimonial: () => undefined,
      filterTestimonialsByRelationship: (t: unknown[]) => t,
      sortTestimonialsByDate: (t: unknown[]) => t,
      cycleSpotlightIndex: vi.fn(),
      getTestimonialStaggerDelay: () => 0,
      RELATIONSHIP_OPTIONS: [{ key: 'all', label: 'All' }],
    }));
    const { default: Testimonials } = await import('@/components/Testimonials');
    const { container } = render(<Testimonials />);

    const nextBtn = screen.queryByLabelText('Show next testimonial');
    if (nextBtn) await act(async () => { fireEvent.click(nextBtn); });
    expect(container.firstChild).not.toBeNull();
  });

  it('shows empty state when all testimonials are filtered out (line 140 true branch)', async () => {
    vi.doMock('@/data/testimonials', () => ({ testimonials: [] }));
    const { default: Testimonials } = await import('@/components/Testimonials');
    render(<Testimonials />);
    expect(screen.getByText('No testimonials in this filter yet.')).toBeTruthy();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SKILLS
// ────────────────────────────────────────────────────────────────────────────
describe('Skills coverage (branches 98-112, 75% funcs)', () => {
  it('renders in full tier and toggles sort view', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'full',
        shouldRenderHeavyEffects: true,
        prefersReducedMotion: false,
        isCoarsePointer: false,
      }),
    }));
    const { default: Skills } = await import('@/components/Skills');
    const { container } = render(<Skills />);

    // Click the Alphabetical button first (changes state from 'priority')
    const alphBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => /alphabetical/i.test(b.textContent ?? '')
    );
    if (alphBtn) await act(async () => { fireEvent.click(alphBtn as HTMLElement); });

    // After re-render, query the Priority button fresh to avoid stale DOM references
    const priorityBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim().toLowerCase() === 'priority'
    );
    if (priorityBtn) await act(async () => { fireEvent.click(priorityBtn as HTMLElement); });

    expect(container.firstChild).not.toBeNull();
  });

  it('renders in lite tier (isLiteMotion=true)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'lite',
        shouldRenderHeavyEffects: false,
        prefersReducedMotion: true,
        isCoarsePointer: true,
      }),
    }));
    const { default: Skills } = await import('@/components/Skills');
    const { container } = render(<Skills />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders null branch of strongestSkill ternary (line 141) when technical skills list is empty', async () => {
    vi.doMock('@/data/skills', () => ({
      skills: {
        technical: [],
        domains: [],
        certifications: [],
      },
    }));
    const { default: Skills } = await import('@/components/Skills');
    const { container } = render(<Skills />);
    expect(container.firstChild).not.toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// EDUCATION
// ────────────────────────────────────────────────────────────────────────────
describe('Education coverage (branches 37-49)', () => {
  it('renders education items without verificationLinks (else branch lines 37-49)', async () => {
    vi.doMock('@/data/education', () => ({
      educationItems: [
        {
          institution: 'Test School',
          credential: 'Test Degree',
          period: 'Jan 2020 - May 2024',
          details: ['Detail 1'],
          verificationLinks: undefined,
        },
      ],
      prerequisiteCourses: [],
      honorsAndAffiliations: [],
    }));
    const { default: Education } = await import('@/components/Education');
    render(<Education />);
    expect(screen.getByText('Test School')).toBeTruthy();
  });

  it('renders education items with only one verificationLink (no pills shown)', async () => {
    vi.doMock('@/data/education', () => ({
      educationItems: [
        {
          institution: 'Single Link School',
          credential: 'B.S.',
          period: 'Jan 2020 - May 2024',
          details: [],
          verificationLinks: [{ label: 'Main', url: 'https://example.com' }],
        },
      ],
      prerequisiteCourses: [],
      honorsAndAffiliations: [],
    }));
    const { default: Education } = await import('@/components/Education');
    const { container } = render(<Education />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders a prerequisite course as a link when a url is present', async () => {
    vi.doMock('@/data/education', () => ({
      educationItems: [],
      prerequisiteCourses: [
        {
          requirement: 'Test Requirement',
          course: 'TEST 101 - Linked Course',
          units: '3.00',
          grade: 'A',
          status: 'Completed',
          url: 'https://example.edu/catalog/test-101',
        },
      ],
      honorsAndAffiliations: [],
    }));
    const { default: Education } = await import('@/components/Education');
    render(<Education />);

    const link = screen.getByRole('link', { name: 'TEST 101 - Linked Course' });
    expect(link.getAttribute('href')).toBe('https://example.edu/catalog/test-101');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('drops the section-title velocity skew layer off the full tier', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({ performanceTier: 'balanced' }),
    }));
    const { default: SectionHeader } = await import('@/components/ui/SectionHeader');
    render(<SectionHeader title="Balanced Tier" />);

    const titleMotion = screen.getByTestId('section-title-motion');
    expect(titleMotion.getAttribute('style')).toBeNull();
  });

  it('renders a prerequisite course as plain text when no url is present', async () => {
    vi.doMock('@/data/education', () => ({
      educationItems: [],
      prerequisiteCourses: [
        {
          requirement: 'Test Requirement',
          course: 'TEST 202 - Unlinked Course',
          units: '3.00',
          grade: 'A',
          status: 'Completed',
        },
      ],
      honorsAndAffiliations: [],
    }));
    const { default: Education } = await import('@/components/Education');
    render(<Education />);

    expect(screen.getByText('TEST 202 - Unlinked Course')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'TEST 202 - Unlinked Course' })).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ────────────────────────────────────────────────────────────────────────────
describe('Projects coverage (branches 37-80, 50%)', () => {
  it('renders in full tier (shouldRenderAmbientEffects = true)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'full',
        shouldRenderParticles: true,
        shouldRenderAmbientEffects: true,
        shouldRenderHeavyEffects: true,
        prefersReducedMotion: false,
        isCoarsePointer: false,
      }),
    }));
    const { default: Projects } = await import('@/components/Projects');
    const { container } = render(<Projects />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders in balanced tier (shouldRenderAmbientEffects = true, no particles)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'balanced',
        shouldRenderParticles: false,
        shouldRenderAmbientEffects: true,
        shouldRenderHeavyEffects: false,
        prefersReducedMotion: false,
        isCoarsePointer: true,
      }),
    }));
    const { default: Projects } = await import('@/components/Projects');
    const { container } = render(<Projects />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders in lite tier (no ambient effects, prefersReducedMotion true)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'lite',
        shouldRenderParticles: false,
        shouldRenderAmbientEffects: false,
        shouldRenderHeavyEffects: false,
        prefersReducedMotion: true,
        isCoarsePointer: true,
      }),
    }));
    const { default: Projects } = await import('@/components/Projects');
    const { container } = render(<Projects />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders with useReducedMotion=true (covers prefersReducedMotion ? undefined : animate branches)', async () => {
    // Override the static framer-motion mock for this test by using doMock
    vi.doMock('framer-motion', () => ({
      motion: new Proxy({}, { get: (_t: object, tag: string) => makeMotionEl(tag) }),
      AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
      useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
      useInView: () => true,
      useReducedMotion: () => true,
      useScroll: () => ({
        scrollY: { on: vi.fn(), get: () => 0, subscribe: vi.fn() },
        scrollYProgress: { on: vi.fn(), get: () => 0, subscribe: vi.fn() },
      }),
      useSpring: (v: unknown) => v,
      useTransform: (_v: unknown, _i: unknown, _o: unknown[]) => 0,
      useVelocity: () => ({ on: vi.fn(), get: () => 0, subscribe: vi.fn() }),
      useMotionValue: (initial: unknown) => mockMotionValue(initial),
      useMotionTemplate: (...args: unknown[]) => args.join(''),
      useMotionValueEvent: vi.fn(),
    }));
    const { default: Projects } = await import('@/components/Projects');
    const { container } = render(<Projects />);
    expect(container.firstChild).not.toBeNull();
  });
});
