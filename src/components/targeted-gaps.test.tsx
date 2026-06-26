import React from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Certifications from './Certifications';
import CustomCursor from './ui/CustomCursor';
import { experiences } from '@/data/experience';
import { profile } from '@/data/profile';
import { projects } from '@/data/projects';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.doUnmock('@/hooks/useScrollPosition');
  vi.doUnmock('@/hooks/useInteractionMode');
  vi.doUnmock('@/data/experience');
  vi.doUnmock('@/data/projects');
  vi.doUnmock('@/data/testimonials');
  vi.resetModules();
});

describe('targeted coverage gaps', () => {
  it('covers layout verification branch with Bing token', async () => {
    vi.stubEnv('BING_SITE_VERIFICATION', 'bing-token-123');
    const layoutMod = await import('@/app/layout');

    expect(layoutMod.metadata.verification?.other).toEqual({
      'msvalidate.01': 'bing-token-123',
    });
  });

  it('covers navigation scrolled-state class branches', async () => {
    vi.doMock('@/hooks/useScrollPosition', () => ({
      useScrollPosition: () => true,
    }));

    const { default: Navigation } = await import('@/components/Navigation');
    render(<Navigation />);

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav.className).toContain('backdrop-blur-md');

    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink.className).toContain('hover:text-cyan-100');
  });

  it('covers structured-data fallback when dates are missing or invalid', async () => {
    vi.doMock('@/data/experience', () => ({
      experiences: [
        {
          company: 'Example Co',
          logo: '/example.webp',
          positions: [
            {
              title: 'Engineer',
              period: '',
              description: 'Example role',
            },
          ],
        },
      ],
    }));

    vi.doMock('@/data/projects', () => ({
      projects: [
        {
          title: 'No Period Project',
          description: 'No date available',
          link: 'https://example.com/no-period',
          period: undefined,
          tags: ['x'],
        },
        {
          title: 'Invalid Period Project',
          description: 'Invalid date value',
          link: 'https://example.com/invalid-period',
          period: '2020-13',
          tags: ['y'],
        },
      ],
    }));

    vi.doMock('@/data/testimonials', () => ({
      testimonials: [
        {
          name: 'Person A',
          role: 'Role A',
          relationship: 'Peer',
          date: '',
          text: 'No publish date',
          featured: true,
        },
        {
          name: 'Person B',
          role: 'Role B',
          relationship: 'Peer',
          date: '2020-13',
          text: 'Invalid publish date',
          featured: true,
        },
      ],
    }));

    const { default: StructuredData } = await import('@/components/StructuredData');
    const { container } = render(<StructuredData />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.textContent).toBeTruthy();

    const graph = JSON.parse(script?.textContent || '{}')['@graph'] as Array<Record<string, unknown>>;
    const workExperience = graph.find((item) => item.name === 'Professional Experience') as {
      itemListElement: Array<{ item: Record<string, unknown> }>;
    };
    const researchOutput = graph.find((item) => item.name === 'Research and Publications') as {
      itemListElement: Array<{ item: Record<string, unknown> }>;
    };
    const testimonialOutput = graph.find((item) => item.name === 'Professional Testimonials') as {
      itemListElement: Array<{ item: Record<string, unknown> }>;
    };

    const roleItem = workExperience.itemListElement[0].item;
    expect(roleItem.startDate).toBeUndefined();
    expect(roleItem.endDate).toBeUndefined();
    expect(researchOutput.itemListElement[0].item.datePublished).toBeUndefined();
    expect(testimonialOutput.itemListElement[0].item.datePublished).toBeUndefined();
  });

  it('covers testimonials list rendering without expand button', async () => {
    vi.doMock('@/data/testimonials', () => ({
      testimonials: [
        {
          name: 'Featured Person',
          role: 'Role',
          relationship: 'Peer',
          date: 'January 2024',
          text: 'Featured text',
          featured: true,
        },
        {
          name: 'Hidden Person',
          role: 'Role',
          relationship: 'Peer',
          date: 'January 2024',
          text: 'Hidden text',
          featured: false,
        },
      ],
    }));

    const { default: Testimonials } = await import('@/components/Testimonials');
    render(<Testimonials />);

    expect(screen.queryByRole('button', { name: /view all/i })).toBeNull();
    expect(screen.getByText('Hidden Person')).toBeTruthy();
  });

  it('covers disabled-hover branches in interaction-driven components', async () => {
    vi.doMock('@/hooks/useInteractionMode', () => ({
      useInteractionMode: () => ({
        enableHoverMotion: false,
        prefersReducedMotion: true,
        isCoarsePointer: true,
      }),
    }));

    const [{ default: ExperienceCard }, { default: ProfileImage }, { default: ProjectCard }, { default: Button }, { default: Magnetic }] =
      await Promise.all([
        import('@/components/experience/ExperienceCard'),
        import('@/components/hero/ProfileImage'),
        import('@/components/projects/ProjectCard'),
        import('@/components/ui/Button'),
        import('@/components/ui/Magnetic'),
      ]);

    render(
      <>
        <ExperienceCard experience={experiences[0]} index={0} />
        <ProfileImage src={profile.image} alt={profile.name} />
        <ProjectCard project={projects[0]} index={0} />
        <Button onClick={() => undefined}>NoHover</Button>
        <Magnetic><button type="button">Still</button></Magnetic>
      </>
    );

    fireEvent.mouseMove(screen.getByText(experiences[0].company), { clientX: 20, clientY: 20 });
    fireEvent.mouseLeave(screen.getByText(experiences[0].company));

    const projectLink = screen.getAllByRole('link').find((link) => link.getAttribute('href') === projects[0].link);
    expect(projectLink).toBeTruthy();

    if (projectLink) {
      fireEvent.mouseEnter(projectLink);
      fireEvent.mouseLeave(projectLink);
    }

    fireEvent.mouseMove(screen.getByRole('button', { name: 'NoHover' }), { clientX: 80, clientY: 40 });
  });

  it('cleans up stale service worker registrations in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const unregister = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn().mockResolvedValue([
      {
        unregister,
      },
    ]);
    const deleteCache = vi.fn().mockResolvedValue(true);
    const cacheKeys = vi.fn().mockResolvedValue(['legacy-cache']);

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: {},
        getRegistrations,
      },
    });

    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        keys: cacheKeys,
        delete: deleteCache,
      },
    });

    const reloadSpy = vi.fn();
    try {
      vi.spyOn(window.location, 'reload').mockImplementation(reloadSpy);
    } catch {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...window.location, reload: reloadSpy },
      });
    }

    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: (...args: unknown[]) => void) => {
      handler();
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { default: ServiceWorkerRegistration } = await import('@/components/ServiceWorkerRegistration');

    render(<ServiceWorkerRegistration />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(getRegistrations).toHaveBeenCalled();
    expect(unregister).toHaveBeenCalled();
    expect(cacheKeys).toHaveBeenCalled();
    expect(deleteCache).toHaveBeenCalledWith('legacy-cache');
    expect(window.sessionStorage.getItem('sw-cleanup-complete')).toBe('true');
    expect(reloadSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('covers custom cursor pointer and interaction branches', () => {
    render(<CustomCursor />);

    const anchor = document.createElement('a');
    anchor.href = '#x';
    const nested = document.createElement('span');
    nested.textContent = 'nested';
    anchor.appendChild(nested);

    const plain = document.createElement('div');
    plain.textContent = 'plain';

    document.body.appendChild(anchor);
    document.body.appendChild(plain);

    fireEvent.mouseMove(window, { clientX: 60, clientY: 70 });
    fireEvent.mouseOver(nested);
    fireEvent.mouseOver(plain);

    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(pointer: coarse)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const coarse = render(<CustomCursor />);
    expect(coarse.container.firstChild).toBeNull();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });

    document.body.removeChild(anchor);
    document.body.removeChild(plain);
  });

  it('covers interaction-mode media change handler branch', async () => {
    let changeHandler: ((event: MediaQueryListEvent) => void) | undefined;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(pointer: coarse)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_type: string, handler: (event: MediaQueryListEvent) => void) => {
          changeHandler = handler;
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { useInteractionMode } = await import('@/hooks/useInteractionMode');
    const hook = renderHook(() => useInteractionMode());

    act(() => {
      changeHandler?.({ matches: true } as MediaQueryListEvent);
    });

    expect(hook.result.current.isCoarsePointer).toBe(true);
  });

  it('renders pulsing status dot on in-progress certification cards and not on completed rows', () => {
    const { container } = render(<Certifications />);

    const inProgressCards = Array.from(
      container.querySelectorAll('[data-testid^="cert-mobile-row-"]')
    );
    expect(inProgressCards.length).toBeGreaterThan(0);

    const inProgressSection = container.querySelector('h3 + div');
    expect(inProgressSection).not.toBeNull();

    const pulseDots = container.querySelectorAll('.animate-ping');
    expect(pulseDots.length).toBeGreaterThan(0);

    const completedRows = Array.from(container.querySelectorAll('[data-testid^="cert-row-"]'));
    for (const row of completedRows) {
      expect(row.querySelector('.animate-ping')).toBeNull();
    }
  });
});
