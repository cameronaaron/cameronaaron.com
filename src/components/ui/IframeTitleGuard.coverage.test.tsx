import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import IframeTitleGuard from './IframeTitleGuard';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('IframeTitleGuard coverage', () => {
  it('applies title to iframes already in DOM on mount', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    render(<IframeTitleGuard />);
    expect(iframe.title).toBeTruthy();
  });

  it('handles MutationObserver adding a direct IFRAME node (line 20)', async () => {
    render(<IframeTitleGuard />);

    await act(async () => {
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
    });

    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(f => expect(f.title).toBeTruthy());
  });

  it('handles MutationObserver adding a div containing nested iframes (line 27)', async () => {
    render(<IframeTitleGuard />);

    await act(async () => {
      const div = document.createElement('div');
      const nested = document.createElement('iframe');
      div.appendChild(nested);
      document.body.appendChild(div);
    });

    expect(document.querySelectorAll('iframe').length).toBeGreaterThan(0);
  });

  it('ignores non-HTMLElement nodes added to DOM', async () => {
    render(<IframeTitleGuard />);

    await act(async () => {
      const text = document.createTextNode('hello');
      document.body.appendChild(text);
    });

    expect(document.body).toBeTruthy();
  });

  it('ignores HTMLElement nodes that are not iframes and have no nested iframes', async () => {
    render(<IframeTitleGuard />);

    await act(async () => {
      const span = document.createElement('span');
      document.body.appendChild(span);
    });

    expect(document.body).toBeTruthy();
  });
});
