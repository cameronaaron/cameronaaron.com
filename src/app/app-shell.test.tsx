import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CHUNK_RELOAD_GUARD_KEY } from './error-boundary-logic';
import ErrorBoundaryView from './error';
import Loading from './loading';
import NotFound from './not-found';
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
