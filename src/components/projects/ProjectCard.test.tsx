import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Project } from '@/data/projects';
import { projects } from '@/data/projects';
import ProjectCard from './ProjectCard';

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
