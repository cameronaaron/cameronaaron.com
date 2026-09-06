import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Hero from '@/components/Hero';
import Projects from '@/components/Projects';
import SelectedWork from '@/components/SelectedWork';
import { profile } from '@/data/profile';
import { projects } from '@/data/projects';
import { buildProjectCollections } from '@/components/projects/projects-logic';

describe('Selected work visitor journey', () => {
  it('exports complete work link markup in the static HTML', () => {
    const html = renderToStaticMarkup(<SelectedWork />);
    const document = new DOMParser().parseFromString(html, 'text/html');
    expect(document.querySelector('#selected-work-heading')?.textContent).toBe('Serious curiosity.Playful execution.');
    expect(document.querySelector('a[href="/capstone"] h3')?.textContent).toBe('Bridging Transitions');
    expect(document.querySelector('a[href="#research-playground"] h3')?.textContent).toBe('Follow your curiosity.');
    expect(document.querySelectorAll('canvas, video, iframe, img, script')).toHaveLength(0);
  });

  it('names each full-card link with its heading and keeps the art decorative', () => {
    const { container } = render(<SelectedWork />);
    expect(screen.getByRole('link', { name: 'Bridging Transitions' }).getAttribute('href')).toBe('/capstone');
    expect(screen.getByRole('link', { name: 'Follow your curiosity.' }).getAttribute('href')).toBe('#research-playground');
    for (const art of container.querySelectorAll('.work-film-art, .work-play-art')) {
      expect(art.getAttribute('aria-hidden')).toBe('true');
      expect(art.querySelectorAll('a, button, [tabindex]')).toHaveLength(0);
    }
    expect(container.querySelectorAll('.work-door')).toHaveLength(2);
  });

  it('connects the primary hero action and playground link to rendered destinations', () => {
    const { container } = render(<><Hero /><SelectedWork /><Projects /></>);
    expect(screen.getByRole('link', { name: 'Explore My Work' }).getAttribute('href')).toBe('#selected-work');
    expect(container.querySelectorAll('#selected-work')).toHaveLength(1);
    expect(container.querySelectorAll('#research-playground')).toHaveLength(1);
    expect(container.querySelector('#research-playground h3')?.textContent).toBe('Play the research');
  });

  it('keeps the occupational introduction readable as one text node', () => {
    const { container } = render(<Hero />);
    const title = container.querySelector('.hero-title');
    expect(title?.textContent).toBe(profile.title);
    expect(title?.childNodes).toHaveLength(1);
    expect(title?.firstChild?.nodeType).toBe(Node.TEXT_NODE);
  });

  it('presents research topics once, without a continuously moving duplicate strip', () => {
    const { container } = render(<Projects />);
    const { researchSignals } = buildProjectCollections(projects);
    expect(container.querySelector('.marquee-track')).toBeNull();
    for (const signal of researchSignals) {
      const labels = container.querySelectorAll('.flex.flex-wrap.items-center.gap-2 > span');
      expect(Array.from(labels).filter((label) => label.textContent === signal)).toHaveLength(1);
    }
    expect(screen.queryByText('Scroll-driven chapter')).toBeNull();
  });
});
