import React from 'react';
import { fireEvent, render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FAQ from './FAQ';
import { faqs } from '@/data/faqs';

function getFaqTriggers(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('button[aria-expanded][aria-controls]')
  );
}

describe('FAQ accessibility & regression', () => {
  it('renders one semantic <button> trigger per FAQ entry', () => {
    const { container } = render(<FAQ />);
    expect(getFaqTriggers(container).length).toBe(faqs.length);
  });

  it('first entry is open by default with matching aria-expanded/aria-controls', () => {
    const { container } = render(<FAQ />);
    const triggers = getFaqTriggers(container);

    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    expect(triggers[1].getAttribute('aria-expanded')).toBe('false');

    const controlsId = triggers[0].getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    expect(container.querySelector(`#${controlsId}`)).toBeTruthy();
  });

  it('clicking a closed trigger opens that panel and closes others (accordion behavior)', () => {
    const { container } = render(<FAQ />);
    fireEvent.click(getFaqTriggers(container)[2]);

    const after = getFaqTriggers(container);
    expect(after[2].getAttribute('aria-expanded')).toBe('true');
    expect(after[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('clicking an open trigger collapses it', () => {
    const { container } = render(<FAQ />);
    expect(getFaqTriggers(container)[0].getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(getFaqTriggers(container)[0]);
    expect(getFaqTriggers(container)[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('chevron and decorative Q: prefix are aria-hidden', () => {
    const { container } = render(<FAQ />);
    const triggers = getFaqTriggers(container);

    const svg = triggers[0].querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');

    const decoratedSpan = triggers[0].querySelector('span[aria-hidden="true"]');
    expect(decoratedSpan?.textContent).toBe('Q:');
  });

  it('only one acceptedAnswer is in the DOM at a time (microdata is preserved)', () => {
    const { container } = render(<FAQ />);
    const openAnswers = container.querySelectorAll('[itemprop="acceptedAnswer"]');
    expect(openAnswers.length).toBe(1);
    expect(openAnswers[0].getAttribute('itemtype')).toBe('https://schema.org/Answer');
  });

  it('renders questions in semantic <h3> tags for proper heading hierarchy', () => {
    const { container } = render(<FAQ />);
    const triggers = getFaqTriggers(container);
    const heading = within(triggers[0]).getByRole('heading', { level: 3 });
    expect(heading.textContent).toContain(faqs[0].question);
  });

  it('section has aria-label for landmark navigation', () => {
    const { container } = render(<FAQ />);
    const section = container.querySelector('section#faq');
    expect(section?.getAttribute('aria-label')).toBe('Frequently asked questions');
  });
});
