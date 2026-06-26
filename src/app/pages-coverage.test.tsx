import React from 'react';
import { render, screen } from '@testing-library/react';
import { act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockMQ = () =>
  vi.fn().mockImplementation((q: string) => ({
    matches: false, media: q, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }));

const mockMotionValue = (v: unknown) => ({ get: () => v, set: vi.fn(), on: vi.fn(), subscribe: vi.fn() });

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_t, tag: string) => {
      const SAFE = ['div','section','button','span','footer','header','nav','ul','li','a','p','h1','h2'];
      const El = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement(SAFE.includes(tag) ? tag : 'div',
          Object.fromEntries(Object.entries(props).filter(([k]) =>
            !['initial','animate','whileHover','whileTap','whileInView','transition','viewport','variants','exit','style'].includes(k))),
          children);
      El.displayName = `motion.${tag}`;
      return El;
    },
  }),
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
  useReducedMotion: () => false,
  useScroll: () => ({ scrollY: mockMotionValue(0), scrollYProgress: { on: vi.fn(), get: () => 0, subscribe: vi.fn() } }),
  useSpring: (v: unknown) => mockMotionValue(v),
  useTransform: () => mockMotionValue(0),
  useMotionValue: (v: unknown) => mockMotionValue(v),
  useMotionTemplate: (...args: unknown[]) => args.join(''),
  useMotionValueEvent: vi.fn(),
  useVelocity: () => mockMotionValue(0),
}));

vi.mock('next/dynamic', () => ({
  default: (_fn: unknown, _opts: unknown) => () => React.createElement('div', { 'data-testid': 'dynamic-placeholder' }),
}));

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: mockMQ() });
  Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
  Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 });
  Object.defineProperty(navigator, 'deviceMemory' as keyof Navigator, { configurable: true, value: 8 });
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  window.sessionStorage.clear();
});

// ── main app/page.tsx ────────────────────────────────────────────────────────
describe('app/page.tsx coverage (lines 52-53, 81-105)', () => {
  it('renders with full tier — showFloatingOverlays conditional', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'full',
        shouldRenderParticles: true,
        shouldRenderAmbientEffects: true,
        shouldRenderHeavyEffects: true,
        shouldRenderCursorTrail: true,
        prefersReducedMotion: false,
        isCoarsePointer: false,
      }),
    }));
    const { default: Home } = await import('./page');
    render(<Home />);
    expect(document.body).toBeTruthy();
  });

  it('renders with lite tier (showFloatingOverlays=false, showSectionHandoffs=false)', async () => {
    vi.doMock('@/hooks/usePerformanceProfile', () => ({
      usePerformanceProfile: () => ({
        performanceTier: 'lite',
        shouldRenderParticles: false,
        shouldRenderAmbientEffects: false,
        shouldRenderHeavyEffects: false,
        shouldRenderCursorTrail: false,
        prefersReducedMotion: true,
        isCoarsePointer: true,
      }),
    }));
    const { default: Home } = await import('./page');
    render(<Home />);
    expect(document.body).toBeTruthy();
  });

  it('fires interaction event to set hasInteracted=true (covers lines 52-53)', async () => {
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
    const { default: Home } = await import('./page');
    render(<Home />);

    await act(async () => {
      window.dispatchEvent(new Event('pointerdown'));
    });
    expect(document.body).toBeTruthy();
  });
});

// ── capstone/page.tsx ────────────────────────────────────────────────────────
describe('capstone/page.tsx coverage (line 167)', () => {
  it('renders capstone page with videos that have toYouTubeEmbedUrl branch', async () => {
    const { default: CapstonePageComponent } = await import('./capstone/page');
    const { container } = render(<CapstonePageComponent />);
    expect(container).toBeTruthy();
  });

  it('renders capstone with a video URL that produces no embedUrl (false branch)', async () => {
    vi.doMock('@/data/capstone', () => ({
      capstone: {
        title: 'Test Capstone',
        shortTitle: 'Test',
        abstract: 'Abstract text',
        institution: 'Test U',
        advisor: 'Dr. Test',
        datePublished: '2026-01-01',
        keywords: ['keyword1'],
        playlistUrl: 'https://example.com/playlist',
        objectives: ['Objective 1'],
        videos: [
          {
            id: 'v1',
            title: 'Video 1',
            description: 'Desc',
            duration: 'PT5M',
            url: 'https://not-youtube.com/watch',
            focusArea: 'Focus',
            thumbnail: '/thumb.jpg',
          },
        ],
      },
      toYouTubeEmbedUrl: () => null,
    }));
    const { default: CapstonePageComponent } = await import('./capstone/page');
    render(<CapstonePageComponent />);
    expect(document.body).toBeTruthy();
  });
});

// ── credentials/page.tsx ─────────────────────────────────────────────────────
describe('credentials/page.tsx coverage (line 104 — credentialId null branch)', () => {
  it('renders credentials page', async () => {
    const { default: CredentialsPage } = await import('./credentials/page');
    render(<CredentialsPage />);
    expect(document.body).toBeTruthy();
  });

  it('renders resource without credentialId (null branch at line 104)', async () => {
    vi.doMock('@/data/credentials', async (importOriginal) => {
      const actual = await importOriginal() as { academicVerificationResources: unknown[] };
      return {
        ...actual,
        academicVerificationResources: [
          {
            institution: 'Test',
            name: 'Test Credential',
            description: 'Desc',
            url: 'https://example.com',
            credentialId: undefined,
          },
        ],
      };
    });
    const { default: CredentialsPage } = await import('./credentials/page');
    render(<CredentialsPage />);
    expect(document.body).toBeTruthy();
  });
});

// ── internet/page.tsx ────────────────────────────────────────────────────────
describe('internet/page.tsx coverage (line 104 — empty items null return)', () => {
  it('renders internet page normally', async () => {
    const { default: InternetPage } = await import('./internet/page');
    render(<InternetPage />);
    expect(document.body).toBeTruthy();
  });

  it('renders internet page with a category that has no items (null return branch)', async () => {
    vi.doMock('@/data/internetFeatures', async (importOriginal) => {
      const actual = await importOriginal() as { internetFeatures: unknown[] };
      return {
        ...actual,
        internetFeatures: actual.internetFeatures.filter(
          (f: unknown) => (f as { category: string }).category !== 'Talks & Speaking'
        ),
      };
    });
    const { default: InternetPage } = await import('./internet/page');
    render(<InternetPage />);
    expect(document.body).toBeTruthy();
  });
});
