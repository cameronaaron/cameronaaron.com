import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Project } from '@/data/projects';
import { projects } from '@/data/projects';
import ProjectCard from './ProjectCard';

const tilt = vi.hoisted(() => ({ handleMouseMove: vi.fn(), handleMouseLeave: vi.fn() }));
const interactionMode = vi.hoisted(() => ({ enableHoverMotion: true, prefersReducedMotion: false, isCoarsePointer: false }));

vi.mock('@/hooks/use3DTilt', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use3DTilt')>();
  return {
    ...actual,
    use3DTilt: (options?: Parameters<typeof actual.use3DTilt>[0]) => ({ ...actual.use3DTilt(options), ...tilt }),
  };
});

vi.mock('@/hooks/useInteractionMode', () => ({ useInteractionMode: () => interactionMode }));

const privateProject: Project = {
  title: 'Private work',
  description: 'Lives in a private repository.',
  tags: ['Rust'],
  period: 'Sep 2026',
  cta: 'Private repository',
};

describe('ProjectCard — private repositories', () => {
  it('renders a card with no public URL as an article, never as a link', () => {
    const { container } = render(<ProjectCard project={privateProject} index={0} />);
    const card = screen.getByTestId('project-card-0');

    expect(card.tagName).toBe('ARTICLE');
    expect(card.hasAttribute('href')).toBe(false);
    expect(card.hasAttribute('target')).toBe(false);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(card.textContent).toContain('Private repository');
  });

  it('still renders a card with a public URL as a new-tab link', () => {
    const linked = { ...privateProject, link: 'https://github.com/cameronaaron/novachannel', cta: 'View on GitHub' };
    render(<ProjectCard project={linked} index={1} />);
    const card = screen.getByTestId('project-card-1');

    expect(card.tagName).toBe('A');
    expect(card.getAttribute('href')).toBe(linked.link);
    expect(card.getAttribute('target')).toBe('_blank');
    expect(card.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('project data — public and private work', () => {
  it('every project without a public URL says so in its call to action', () => {
    const unlabeled = projects.filter((p) => p.link === undefined && p.cta !== 'Private repository').map((p) => p.title);
    expect(unlabeled).toEqual([]);
  });

  it('no project labeled private carries a link', () => {
    const contradictory = projects.filter((p) => p.cta === 'Private repository' && p.link !== undefined).map((p) => p.title);
    expect(contradictory).toEqual([]);
  });
});

describe('ProjectCard — hover tilt follows the interaction mode', () => {
  afterEach(() => {
    interactionMode.enableHoverMotion = true;
    tilt.handleMouseMove.mockClear();
    tilt.handleMouseLeave.mockClear();
  });

  it('tilts toward the pointer when hover motion is enabled', () => {
    render(<ProjectCard project={privateProject} index={0} />);
    const card = screen.getByTestId('project-card-0');

    fireEvent.mouseEnter(card);
    fireEvent.mouseMove(card, { clientX: 120, clientY: 80 });

    expect(tilt.handleMouseMove).toHaveBeenCalledTimes(1);
  });

  it('never tilts on a device without hover motion, but still resets on leave', () => {
    interactionMode.enableHoverMotion = false;
    render(<ProjectCard project={privateProject} index={0} />);
    const card = screen.getByTestId('project-card-0');

    fireEvent.mouseEnter(card);
    fireEvent.mouseMove(card, { clientX: 120, clientY: 80 });
    fireEvent.mouseLeave(card);

    expect(tilt.handleMouseMove).not.toHaveBeenCalled();
    expect(tilt.handleMouseLeave).toHaveBeenCalledTimes(1);
  });
});
