import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ExperienceCard from './experience/ExperienceCard';
import FeaturedProject from './projects/FeaturedProject';
import ProjectCard from './projects/ProjectCard';

import { experiences } from '@/data/experience';
import { projects } from '@/data/projects';

// The featured capstone: a linked project. Not `projects[0]` — the data is
// ordered newest-first, and the newest work can be a private repository.
const capstoneProject = projects.find((project) => project.link?.includes('/capstone'))!;

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

  it('covers ProjectCard hover branches and fallback CTA in featured project', () => {
    render(<ProjectCard project={capstoneProject} index={0} />);

    const card = screen.getByTestId('project-card-0') as HTMLElement;
    Object.defineProperty(card, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 10, top: 10, width: 180, height: 120 }),
    });

    fireEvent.mouseEnter(card);
    fireEvent.mouseMove(card, { clientX: 70, clientY: 45 });
    fireEvent.mouseLeave(card);

    render(<FeaturedProject project={{ ...capstoneProject, cta: undefined }} index={0} />);
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
    render(<ProjectCardReduced project={capstoneProject} index={1} />);

    const reducedCard = screen.getByTestId('project-card-1');
    fireEvent.mouseEnter(reducedCard);
    fireEvent.mouseLeave(reducedCard);
  });
});
