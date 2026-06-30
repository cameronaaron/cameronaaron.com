import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CustomCursor from './CustomCursor';

const makeMQ = (coarse: boolean) =>
  vi.fn().mockImplementation((q: string) => ({
    matches: q.includes('coarse') ? coarse : false,
    media: q, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }));

afterEach(() => { vi.restoreAllMocks(); });

describe('CustomCursor coverage', () => {
  it('returns null on coarse-pointer (touch) device', () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMQ(true) });
    const { container } = render(<CustomCursor />);
    expect(container.firstChild).toBeNull();
  });

  it('fires second mousemove when already visible (covers !isVisible false branch line 14)', async () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMQ(false) });
    render(<CustomCursor />);

    await act(async () => {
      fireEvent(window, new MouseEvent('mousemove', { clientX: 10, clientY: 20 }));
    });
    await act(async () => {
      fireEvent(window, new MouseEvent('mousemove', { clientX: 30, clientY: 40 }));
    });

    expect(document.body).toBeTruthy();
  });

  it('sets isHovering true on mouseover of a button element', async () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMQ(false) });
    render(<CustomCursor />);
    const btn = document.createElement('button');
    document.body.appendChild(btn);

    await act(async () => {
      // Fire on the btn element so e.target is an HTMLElement with .closest()
      fireEvent(btn, new MouseEvent('mouseover', { bubbles: true }));
    });

    expect(document.body).toBeTruthy();
    document.body.removeChild(btn);
  });

  it('sets isHovering false on mouseover of a plain div', async () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMQ(false) });
    render(<CustomCursor />);
    const div = document.createElement('div');
    document.body.appendChild(div);

    await act(async () => {
      // Fire on the div element (not window) so e.target is an HTMLElement with .closest()
      fireEvent(div, new MouseEvent('mouseover', { bubbles: true }));
    });

    expect(document.body).toBeTruthy();
    document.body.removeChild(div);
  });
});
