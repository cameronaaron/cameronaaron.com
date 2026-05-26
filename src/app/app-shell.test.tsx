import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ErrorBoundaryView from './error';
import Loading from './loading';
import NotFound from './not-found';
import Home from './page';
import RootLayout, { metadata, viewport } from './layout';

describe('app shell coverage', () => {
  it('renders the home page sections', () => {
    render(<Home />);

    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByText('Cameron Aaron')).toBeTruthy();
    expect(screen.getByText('Healthcare & Technology Experience')).toBeTruthy();
    expect(screen.getByText("Let's Connect")).toBeTruthy();
  });

  it('evaluates layout exports and tree', () => {
    const tree = RootLayout({ children: <div>child</div> });

    expect(tree).toBeTruthy();
    expect(metadata.title).toBeTruthy();
    expect(metadata.openGraph?.images?.[0]?.url).toContain('opengraph-image.png');
    expect(viewport.themeColor).toBe('#06b6d4');
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
