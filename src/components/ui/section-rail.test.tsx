import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SectionRail, { RAIL_SECTIONS } from './SectionRail';

type ObserverCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;
const observerInstances: Array<{ callback: ObserverCallback; observed: Element[]; disconnect: () => void }> = [];

class FakeIntersectionObserver {
  callback: ObserverCallback;
  observed: Element[] = [];
  constructor(callback: ObserverCallback) {
    this.callback = callback;
    observerInstances.push({
      callback,
      observed: this.observed,
      disconnect: () => this.disconnect(),
    });
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function emit(entries: Array<{ id: string; ratio: number }>) {
  const last = observerInstances[observerInstances.length - 1];
  expect(last).toBeTruthy();
  const built = entries.map(({ id, ratio }) => ({
    target: document.getElementById(id) as Element,
    isIntersecting: ratio > 0,
    intersectionRatio: ratio,
    boundingClientRect: {} as DOMRectReadOnly,
    intersectionRect: {} as DOMRectReadOnly,
    rootBounds: null,
    time: 0,
  } as IntersectionObserverEntry));
  act(() => last.callback(built, {} as IntersectionObserver));
}

describe('SectionRail', () => {
  beforeEach(() => {
    observerInstances.length = 0;
    document.body.innerHTML = '';
    for (const section of RAIL_SECTIONS) {
      const el = document.createElement('section');
      el.id = section.id;
      el.scrollIntoView = vi.fn();
      document.body.appendChild(el);
    }
    (window as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
      FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders one anchor per section with accessible labels', () => {
    render(<SectionRail />);
    for (const section of RAIL_SECTIONS) {
      const link = screen.getByLabelText(`Jump to ${section.label}`);
      expect(link.getAttribute('href')).toBe(`#${section.id}`);
    }
  });

  it('marks the first section active by default', () => {
    const { container } = render(<SectionRail />);
    const first = container.querySelector(`[data-section-id="${RAIL_SECTIONS[0].id}"]`);
    expect(first?.getAttribute('data-active')).toBe('true');
    expect(first?.getAttribute('aria-current')).toBe('true');
  });

  it('switches active state when the intersection observer reports a different section', () => {
    const { container } = render(<SectionRail />);
    emit([
      { id: 'home', ratio: 0.1 },
      { id: 'experience', ratio: 0.9 },
      { id: 'projects', ratio: 0.4 },
    ]);

    const active = container.querySelector('[data-active="true"]');
    expect(active?.getAttribute('data-section-id')).toBe('experience');
  });

  it('ignores intersection events with no visible sections', () => {
    const { container } = render(<SectionRail />);
    emit([{ id: 'home', ratio: 0 }, { id: 'experience', ratio: 0 }]);
    const active = container.querySelector('[data-active="true"]');
    expect(active?.getAttribute('data-section-id')).toBe('home');
  });

  it('scrolls the target into view and updates history on click', () => {
    const replaceSpy = vi.spyOn(history, 'replaceState');
    render(<SectionRail />);

    const target = document.getElementById('projects');
    const scrollSpy = vi.fn();
    target!.scrollIntoView = scrollSpy;

    fireEvent.click(screen.getByLabelText('Jump to Research'));
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(replaceSpy).toHaveBeenCalledWith(null, '', '#projects');
    replaceSpy.mockRestore();
  });

  it('is a no-op when clicking a section that is not present in the DOM', () => {
    const customSections = [{ id: 'does-not-exist', label: 'Ghost' }];
    render(<SectionRail sections={customSections} />);
    expect(() => fireEvent.click(screen.getByLabelText('Jump to Ghost'))).not.toThrow();
  });

  it('disconnects observers on unmount and accepts a custom section list', () => {
    const customSections = [
      { id: 'home', label: 'Top' },
      { id: 'contact', label: 'End' },
    ];
    const { unmount } = render(<SectionRail sections={customSections} />);
    expect(observerInstances.length).toBeGreaterThan(0);
    unmount();
  });

  it('renders nothing observable when no matching elements exist', () => {
    document.body.innerHTML = '';
    expect(() => render(<SectionRail sections={[{ id: 'none', label: 'None' }]} />)).not.toThrow();
  });

  it('is safe when IntersectionObserver is unavailable in the environment', () => {
    const original = (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
    delete (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
    (globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver = undefined;

    expect(() => render(<SectionRail />)).not.toThrow();

    (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver = original;
    (globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver = original;
  });

  it('respects prefers-reduced-motion by using auto scroll behaviour', async () => {
    const fm = await import('framer-motion');
    const spy = vi.spyOn(fm, 'useReducedMotion').mockReturnValue(true);

    render(<SectionRail />);
    const target = document.getElementById('skills');
    const scrollSpy = vi.fn();
    target!.scrollIntoView = scrollSpy;

    fireEvent.click(screen.getByLabelText('Jump to Skills'));
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });

    spy.mockRestore();
  });
});
