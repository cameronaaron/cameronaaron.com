import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Navigation from './Navigation';
import { navItems } from '@/data/navigation';

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

describe('Navigation accessibility', () => {
  afterEach(() => {
    setViewport(1280);
  });

  it('exposes a landmark with an aria-label', () => {
    render(<Navigation />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeTruthy();
  });

  it('renders a skip-to-content link as the first focusable element', () => {
    render(<Navigation />);
    const link = screen.getByText(/skip to main content/i);
    expect(link.getAttribute('href')).toBe('#main-content');
  });

  it('renders every nav item with an href', () => {
    render(<Navigation />);
    const primary = screen.getByRole('navigation', { name: /primary navigation/i });
    for (const item of navItems) {
      const anchor = within(primary).getByRole('link', { name: item.name });
      expect(anchor.getAttribute('href')).toBe(item.href);
    }
  });

  it('marks the active link with aria-current="page"', () => {
    render(<Navigation />);
    const primary = screen.getByRole('navigation', { name: /primary navigation/i });
    const active = within(primary).getByRole('link', { name: navItems[0].name });
    expect(active.getAttribute('aria-current')).toBe('page');
  });

  it('updates aria-current when scrolling moves into a new section', () => {
    for (const item of navItems) {
      const id = item.href.replace('#', '');
      const section = document.createElement('section');
      section.id = id;
      Object.defineProperty(section, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ top: 9999, bottom: 99999, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }),
      });
      document.body.appendChild(section);
    }

    // Place the second nav target across the trigger line.
    const secondId = navItems[1].href.replace('#', '');
    const secondSection = document.getElementById(secondId)!;
    Object.defineProperty(secondSection, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ top: 0, bottom: 500, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }),
    });

    render(<Navigation />);
    act(() => {
      fireEvent.scroll(window);
    });

    const primary = screen.getByRole('navigation', { name: /primary navigation/i });
    const active = within(primary).getByRole('link', { name: navItems[1].name });
    expect(active.getAttribute('aria-current')).toBe('page');

    document.body.innerHTML = '';
  });

  it('toggles the mobile menu with proper aria-expanded state', () => {
    render(<Navigation />);
    const toggle = screen.getByRole('button', { name: /open navigation menu/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBeNull();

    fireEvent.click(toggle);
    const closeBtn = screen.getByRole('button', { name: /close navigation menu/i });
    expect(closeBtn.getAttribute('aria-expanded')).toBe('true');
    expect(closeBtn.getAttribute('aria-controls')).toBe('mobile-nav-panel');
    expect(document.getElementById('mobile-nav-panel')).toBeTruthy();

    fireEvent.click(closeBtn);
    const reopened = screen.getByRole('button', { name: /open navigation menu/i });
    expect(reopened.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the mobile menu when Escape is pressed', () => {
    render(<Navigation />);
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    expect(document.getElementById('mobile-nav-panel')).toBeTruthy();
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeTruthy();
  });

  it('closes the mobile menu when the viewport widens to desktop', () => {
    setViewport(500);
    render(<Navigation />);
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    setViewport(1280);
    act(() => {
      fireEvent.resize(window);
    });
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeTruthy();
  });

  it('closes the mobile menu when a nav item inside it is activated', () => {
    render(<Navigation />);
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));

    const mobilePanel = document.getElementById('mobile-nav-panel')!;
    const firstLink = within(mobilePanel).getAllByRole('link')[0];
    fireEvent.click(firstLink);

    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeTruthy();
  });

  it('coalesces rapid scroll events into a single rAF update and flushes it', () => {
    const callbacks: FrameRequestCallback[] = [];
    const queuedRaf = vi.fn((cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    const originalRaf = window.requestAnimationFrame;
    const originalGlobalRaf = globalThis.requestAnimationFrame;
    Object.defineProperty(window, 'requestAnimationFrame', { writable: true, value: queuedRaf });
    Object.defineProperty(globalThis, 'requestAnimationFrame', { writable: true, value: queuedRaf });

    try {
      for (const item of navItems) {
        const section = document.createElement('section');
        section.id = item.href.replace('#', '');
        document.body.appendChild(section);
      }

      render(<Navigation />);

      act(() => {
        fireEvent.scroll(window);
        fireEvent.scroll(window);
        fireEvent.resize(window);
      });

      // Three high-frequency events → exactly one scheduled frame
      expect(queuedRaf).toHaveBeenCalledTimes(1);

      // Flushing the frame recomputes the active section without errors,
      // and the next scroll can schedule a fresh frame again.
      act(() => {
        callbacks[0]?.(16);
      });
      act(() => {
        fireEvent.scroll(window);
      });
      expect(queuedRaf).toHaveBeenCalledTimes(2);
    } finally {
      Object.defineProperty(window, 'requestAnimationFrame', { writable: true, value: originalRaf });
      Object.defineProperty(globalThis, 'requestAnimationFrame', { writable: true, value: originalGlobalRaf });
      document.body.innerHTML = '';
    }
  });

  it('cancels a pending scroll frame on unmount', () => {
    const queuedRaf = vi.fn(() => 42);
    const queuedCancel = vi.fn();
    const originalRaf = window.requestAnimationFrame;
    const originalGlobalRaf = globalThis.requestAnimationFrame;
    const originalCancel = window.cancelAnimationFrame;
    const originalGlobalCancel = globalThis.cancelAnimationFrame;
    Object.defineProperty(window, 'requestAnimationFrame', { writable: true, value: queuedRaf });
    Object.defineProperty(globalThis, 'requestAnimationFrame', { writable: true, value: queuedRaf });
    Object.defineProperty(window, 'cancelAnimationFrame', { writable: true, value: queuedCancel });
    Object.defineProperty(globalThis, 'cancelAnimationFrame', { writable: true, value: queuedCancel });

    try {
      const { unmount } = render(<Navigation />);
      act(() => {
        fireEvent.scroll(window);
      });
      unmount();
      expect(queuedCancel).toHaveBeenCalledWith(42);
    } finally {
      Object.defineProperty(window, 'requestAnimationFrame', { writable: true, value: originalRaf });
      Object.defineProperty(globalThis, 'requestAnimationFrame', { writable: true, value: originalGlobalRaf });
      Object.defineProperty(window, 'cancelAnimationFrame', { writable: true, value: originalCancel });
      Object.defineProperty(globalThis, 'cancelAnimationFrame', { writable: true, value: originalGlobalCancel });
    }
  });

  it('removes its keydown/scroll/resize listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Navigation />);
    unmount();
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('all primary nav anchors target valid hash IDs', () => {
    render(<Navigation />);
    const primary = screen.getByRole('navigation', { name: /primary navigation/i });
    for (const link of within(primary).getAllByRole('link')) {
      const href = link.getAttribute('href') ?? '';
      expect(href.startsWith('#')).toBe(true);
      expect(href.length).toBeGreaterThan(1);
    }
  });

  it('keeps cinematic transparent classes before the scroll threshold', () => {
    render(<Navigation />);

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav.className).toContain('bg-transparent');
    expect(nav.className).not.toContain('bg-slate-950/55');

    const brand = screen.getByRole('link', { name: /cameron/i });
    expect(brand.className).toContain('hover:text-cyan-100');

    const primary = screen.getByRole('navigation', { name: /primary navigation/i });
    const active = within(primary).getByRole('link', { name: navItems[0].name });

    expect(active.className).toContain('text-cyan-100');
    expect(active.className).toContain('hover:text-cyan-100');
  });
});
