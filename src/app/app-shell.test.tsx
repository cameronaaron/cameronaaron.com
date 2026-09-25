import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CHUNK_RELOAD_GUARD_KEY } from './error-boundary-logic';
import ErrorBoundaryView from './error';
import Loading from './loading';
import NotFound, { metadata as notFoundMetadata } from './not-found';
import Home from './page';
import RootLayout, { metadata, viewport } from './layout';

describe('app shell coverage', () => {
  it('renders the home page sections', () => {
    const { container } = render(<Home />);

    expect(screen.getByRole('main')).toBeTruthy();
    expect(container.querySelector('#home')).toBeTruthy();
    expect(container.querySelector('#experience')).toBeTruthy();
    expect(container.querySelector('#projects')).toBeTruthy();
    expect(container.querySelector('#contact')).toBeTruthy();
  });

  it('makes the skip link the first Tab stop, and its target skip past the navigation', () => {
    // Shipped wrong twice over: PageChrome's floating buttons preceded the
    // link in DOM order (third Tab stop), and <Navigation> sat inside
    // #main-content, so "skip" landed back at the start of the nav (WCAG 2.4.1).
    const { container } = render(<Home />);
    const focusables = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusables[0]?.textContent).toBe('Skip to main content');
    expect(focusables[0]?.getAttribute('href')).toBe('#main-content');

    const main = container.querySelector('#main-content');
    expect(main?.tagName).toBe('MAIN');
    const primaryNav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(main?.contains(primaryNav)).toBe(false);
  });

  it('evaluates layout exports and tree', () => {
    const tree = RootLayout({ children: <div>child</div> });

    expect(tree).toBeTruthy();
    expect(metadata.title).toBeTruthy();
    expect(metadata.openGraph?.images?.[0]?.url).toContain('opengraph-image.png');
    expect(viewport.themeColor).toEqual([
      { media: '(prefers-color-scheme: dark)', color: '#0cbdf2' },
      { media: '(prefers-color-scheme: light)', color: '#0cbdf2' },
    ]);
  });

  it('renders loading, not found, and error states', () => {
    render(<Loading />);
    expect(screen.getByText('Loading...')).toBeTruthy();

    render(<NotFound />);
    expect(screen.getByText('Page Not Found')).toBeTruthy();

    const reset = vi.fn();
    render(<ErrorBoundaryView error={new Error('boom')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('gives the 404 its own title and noindex so it never inherits the homepage head', () => {
    // Inheriting root metadata shipped the homepage title plus `index, follow`
    // beside Next's injected `noindex`. The artifact-level sweep over every
    // emitted page lives in scripts/checks/performance-budgets.mjs.
    expect(notFoundMetadata.title).toBe('Page Not Found');
    expect(notFoundMetadata.title).not.toBe(metadata.title);
    expect(notFoundMetadata.robots).toMatchObject({ index: false, googleBot: { index: false } });
  });
});

describe('error boundary — stale-deploy chunk reload', () => {
  const originalLocation = window.location;

  // jsdom's window.location.reload is non-configurable, so it cannot be
  // spied on or redefined in place — the whole location object has to be
  // swapped out and restored, same reasoning as the DOM-mutation approach
  // §3.1's per-frame code uses, just for a test double instead of a ref.
  function stubReload() {
    const reload = vi.fn();
    // @ts-expect-error -- test-only global override, restored in afterEach
    delete window.location;
    // @ts-expect-error -- partial Location stub is sufficient for this test
    window.location = { ...originalLocation, reload };
    return reload;
  }

  afterEach(() => {
    // @ts-expect-error -- restoring the real Location after stubReload's swap
    window.location = originalLocation;
    window.sessionStorage.clear();
  });

  it('auto-reloads once on a ChunkLoadError, a stale tab never reaches the retry UI', () => {
    const reload = stubReload();
    const error = new Error('Loading chunk 42 failed.');
    error.name = 'ChunkLoadError';

    render(<ErrorBoundaryView error={error} reset={vi.fn()} />);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)).toBe('true');
  });

  it('does not reload a second time in the same tab session — the loop guard', () => {
    window.sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, 'true');
    const reload = stubReload();
    const error = new Error('Loading chunk 42 failed.');
    error.name = 'ChunkLoadError';

    render(<ErrorBoundaryView error={error} reset={vi.fn()} />);

    expect(reload).not.toHaveBeenCalled();
  });

  it('never reloads for an ordinary application error', () => {
    const reload = stubReload();

    render(<ErrorBoundaryView error={new Error('boom')} reset={vi.fn()} />);

    expect(reload).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)).toBeNull();
  });
});
