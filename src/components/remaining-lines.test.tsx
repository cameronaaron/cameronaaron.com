import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ExperienceCard from './experience/ExperienceCard';
import ProfileImage from './hero/ProfileImage';
import FeaturedProject from './projects/FeaturedProject';
import ProjectCard from './projects/ProjectCard';

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
  vi.resetModules();
});

describe('remaining line coverage', () => {
  it('covers ExperienceCard pointer math path', () => {
    render(<ExperienceCard experience={experiences[0]} index={0} />);

    const card = screen.getByTestId('experience-card-0') as HTMLElement;
    expect(card).toBeTruthy();

    if (card) {
      Object.defineProperty(card, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ left: 10, top: 20, width: 200, height: 120 }),
      });

      fireEvent.mouseEnter(card);
      fireEvent.mouseMove(card, { clientX: 120, clientY: 90 });
      fireEvent.mouseLeave(card);
    }

    expect(screen.getByText(experiences[0].company)).toBeTruthy();
  });

  it('covers ProfileImage mousemove rect path (via the container ref)', () => {
    render(<ProfileImage src={profile.image} alt={profile.name} />);

    // The component reads its container rect through a ref (not a
    // per-mousemove getElementById query — that path was removed 2026-07);
    // the ref attaches to the same element that carries this id. Named
    // profileContainer (not `container`) deliberately: this one is a
    // nullable DOM lookup, unlike RTL's always-truthy render container.
    const profileContainer = document.getElementById('profile-container');
    expect(profileContainer).not.toBeNull();

    if (profileContainer) {
      Object.defineProperty(profileContainer, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ left: 100, top: 100, width: 240, height: 240 }),
      });
    }

    fireEvent.mouseMove(window, { clientX: 180, clientY: 210 });
    expect(screen.getByAltText(profile.name)).toBeTruthy();
  });

  it('covers ProjectCard hover branches and fallback CTA in featured project', () => {
    render(<ProjectCard project={projects[0]} index={0} />);

    const card = screen.getByTestId('project-card-0') as HTMLElement;
    Object.defineProperty(card, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 10, top: 10, width: 180, height: 120 }),
    });

    fireEvent.mouseEnter(card);
    fireEvent.mouseMove(card, { clientX: 70, clientY: 45 });
    fireEvent.mouseLeave(card);

    render(<FeaturedProject project={{ ...projects[0], cta: undefined }} index={0} />);
    render(<FeaturedProject project={projects[1]} />);
    expect(screen.getByText('View Publication')).toBeTruthy();
  });

  it('covers reduced-motion branch in ProjectCard', async () => {
    vi.doMock('@/hooks/useInteractionMode', () => ({
      useInteractionMode: () => ({
        enableHoverMotion: true,
        prefersReducedMotion: true,
        isCoarsePointer: false,
      }),
    }));

    const { default: ProjectCardReduced } = await import('@/components/projects/ProjectCard');
    render(<ProjectCardReduced project={projects[0]} index={1} />);

    const reducedCard = screen.getByTestId('project-card-1');
    fireEvent.mouseEnter(reducedCard);
    fireEvent.mouseLeave(reducedCard);
  });

  it('covers coarse-pointer whileTap and magnetic early-return branches', async () => {
    vi.doMock('@/hooks/useInteractionMode', () => ({
      useInteractionMode: () => ({
        enableHoverMotion: false,
        prefersReducedMotion: false,
        isCoarsePointer: true,
      }),
    }));

    const [{ default: ButtonCoarse }, { default: MagneticDisabled }] = await Promise.all([
      import('@/components/ui/Button'),
      import('@/components/ui/Magnetic'),
    ]);

    render(
      <>
        <ButtonCoarse onClick={() => undefined}>TapBranch</ButtonCoarse>
        <MagneticDisabled><button type="button">MagnetNoMove</button></MagneticDisabled>
      </>
    );

    const button = screen.getByRole('button', { name: 'TapBranch' });
    fireEvent.mouseMove(button, { clientX: 20, clientY: 20 });

    const magneticButton = screen.getByRole('button', { name: 'MagnetNoMove' });
    fireEvent.mouseMove(magneticButton, { clientX: 50, clientY: 50 });

    expect(button).toBeTruthy();
  });
});
