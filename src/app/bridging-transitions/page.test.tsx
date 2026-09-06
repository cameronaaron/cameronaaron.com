import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { bridgingTransitions } from '@/data/bridgingTransitions';
import { capstone } from '@/data/capstone';
import BridgingTransitionsPage, { dynamic, metadata } from './page';

function renderPage() {
  return render(<BridgingTransitionsPage />);
}

function schemaGraph(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script!.textContent!) as { '@graph': Array<Record<string, unknown>> };
}

describe('bridging-transitions page', () => {
  it('is statically exported under its own canonical path', () => {
    expect(dynamic).toBe('force-static');
    expect(metadata.alternates?.canonical).toBe('/bridging-transitions');
  });

  it('leads with the poster title as the page heading', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: bridgingTransitions.posterTitle }),
    ).toBeTruthy();
  });

  it('states where and when the poster is being presented', () => {
    const { container } = renderPage();
    expect(container.textContent).toContain(bridgingTransitions.session.event);
    expect(container.textContent).toContain(bridgingTransitions.session.detail);
  });

  it('renders the playlist player', () => {
    renderPage();
    expect(
      screen.getByRole('list', { name: /Episodes in the Bridging Transitions series/i }),
    ).toBeTruthy();
  });

  it('offers both print-ready PDFs as real downloads', () => {
    const { container } = renderPage();

    for (const download of bridgingTransitions.downloads) {
      const link = container.querySelector<HTMLAnchorElement>(`a[href="${download.href}"]`);
      expect(link, `${download.label} is not linked`).not.toBeNull();
      expect(link!.hasAttribute('download')).toBe(true);
    }
  });

  it('carries every Monday action, each attributed to an office and a video', () => {
    const { container } = renderPage();

    for (const item of bridgingTransitions.actions) {
      expect(container.textContent, `${item.audience} action is missing`).toContain(item.action);
      expect(container.textContent).toContain(item.audience);
    }
  });

  it('routes onward to the capstone, the playlist and the portfolio', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Read the full capstone' }).getAttribute('href')).toBe(
      '/capstone',
    );
    expect(
      screen.getByRole('link', { name: 'Open the playlist on YouTube' }).getAttribute('href'),
    ).toBe(capstone.playlistUrl);
    expect(screen.getByRole('link', { name: 'Back to main portfolio' })).toBeTruthy();
  });

  it('opens external links safely', () => {
    const { container } = renderPage();
    for (const link of container.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')) {
      expect(link.getAttribute('rel'), `${link.href} is missing noopener`).toContain('noopener');
    }
  });

  it('gives every section an accessible name', () => {
    const { container } = renderPage();
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(3);

    for (const section of sections) {
      const labelledBy = section.getAttribute('aria-labelledby');
      expect(labelledBy, 'a section has no aria-labelledby').toBeTruthy();
      expect(
        container.querySelector(`#${labelledBy}`),
        `aria-labelledby="${labelledBy}" points at no element`,
      ).not.toBeNull();
    }
  });

  it('publishes the poster session and the full video series as structured data', () => {
    const { container } = renderPage();
    const graph = schemaGraph(container);
    const types = graph['@graph'].map((node) => node['@type']);

    expect(types).toContain('WebPage');
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('Event');
    expect(types).toContain('CreativeWorkSeries');

    const series = graph['@graph'].find((node) => node['@type'] === 'CreativeWorkSeries') as {
      hasPart: Array<{ embedUrl: string; name: string }>;
    };
    expect(series.hasPart).toHaveLength(capstone.videos.length);
    for (const [index, part] of series.hasPart.entries()) {
      expect(part.embedUrl).toContain(capstone.videos[index].youtubeId);
    }
  });

  it('gives the poster session a machine-readable start before its end', () => {
    const { container } = renderPage();
    const event = schemaGraph(container)['@graph'].find((node) => node['@type'] === 'Event') as {
      startDate: string;
      endDate: string;
    };

    expect(Date.parse(event.startDate)).toBeLessThan(Date.parse(event.endDate));
  });
});
