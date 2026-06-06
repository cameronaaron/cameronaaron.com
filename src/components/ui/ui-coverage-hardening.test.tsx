import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AmbientBackground from '@/components/ui/AmbientBackground';
import IframeTitleGuard from '@/components/ui/IframeTitleGuard';
import QuickActionsDock from '@/components/ui/QuickActionsDock';
import SectionHeader from '@/components/ui/SectionHeader';
import SmoothScroll from '@/components/ui/SmoothScroll';
import TextReveal from '@/components/ui/TextReveal';
import TypewriterEffect from '@/components/ui/TypewriterEffect';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

function countAmbientOrbs(container: HTMLElement): number {
  return container.querySelectorAll('div[class*="rounded-full"]').length;
}

describe('ui coverage hardening', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('covers quick-actions dock open/close interactions in full and reduced modes', () => {
    const { rerender } = render(<QuickActionsDock performanceTier="full" />);

    const toggle = screen.getByRole('button', { name: 'Explore quick actions' });
    fireEvent.click(toggle);
    expect(screen.getByRole('link', { name: 'Credentials' })).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: 'Credentials' }));
    expect(screen.queryByRole('link', { name: 'Credentials' })).toBeNull();

    rerender(<QuickActionsDock performanceTier="reduced" />);
    fireEvent.click(screen.getByRole('button', { name: 'Explore quick actions' }));
    expect(screen.getByRole('link', { name: 'Experience' })).toBeTruthy();
  });

  it('covers ambient background tier branches and orb counts', () => {
    const { container, rerender } = render(<AmbientBackground performanceTier="full" />);
    expect(countAmbientOrbs(container)).toBe(7);

    rerender(<AmbientBackground performanceTier="balanced" />);
    expect(countAmbientOrbs(container)).toBe(4);

    rerender(<AmbientBackground performanceTier="lite" />);
    expect(countAmbientOrbs(container)).toBe(2);

    rerender(<AmbientBackground performanceTier="reduced" />);
    expect(countAmbientOrbs(container)).toBe(1);
  });

  it('covers section header subtitle and no-subtitle branches', () => {
    const { rerender } = render(<SectionHeader title="Section A" subtitle="Helpful subtitle" />);
    expect(screen.getByText('Helpful subtitle')).toBeTruthy();

    rerender(<SectionHeader title="Section B" />);
    expect(screen.queryByText('Helpful subtitle')).toBeNull();
  });

  it('covers iframe title guard for existing, direct, and nested frames', async () => {
    const existing = document.createElement('iframe');
    existing.setAttribute('src', 'https://example.com/embed');
    document.body.appendChild(existing);

    render(<IframeTitleGuard />);
    expect(existing.getAttribute('title')).toContain('Embedded content from example.com');

    const wrapper = document.createElement('div');
    const nested = document.createElement('iframe');
    nested.setAttribute('src', 'https://sub.example.com/inner');
    wrapper.appendChild(nested);
    document.body.appendChild(wrapper);

    const directFrame = document.createElement('iframe');
    directFrame.setAttribute('src', 'https://video.example.org/123');
    document.body.appendChild(directFrame);

    await waitFor(() => {
      expect(nested.getAttribute('title')).toContain('Embedded content from sub.example.com');
      expect(directFrame.getAttribute('title')).toContain('Embedded content from video.example.org');
    });
  });

  it('covers typewriter completion paths including bfcache pageshow handling', () => {
    vi.useFakeTimers();

    try {
      const { rerender } = render(<TypewriterEffect text="Typing" typingSpeed={1} />);
      act(() => {
        vi.advanceTimersByTime(20);
      });
      expect(screen.getAllByText('Typing').length).toBeGreaterThan(0);

      const pageShow = new Event('pageshow');
      Object.defineProperty(pageShow, 'persisted', { value: true });
      window.dispatchEvent(pageShow);

      const key = 'typewriter-complete:Typing';
      expect(window.sessionStorage.getItem(key)).toBe('1');

      rerender(<TypewriterEffect text="Typing" typingSpeed={1} className="heading" cursorClassName="cursor" />);
      expect(screen.getAllByText('Typing').length).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('covers text reveal pageshow persistence handling', () => {
    render(<TextReveal text="Coverage Matters" delay={0.1} />);

    const pageShow = new Event('pageshow');
    Object.defineProperty(pageShow, 'persisted', { value: true });
    window.dispatchEvent(pageShow);

    expect(window.sessionStorage.getItem('text-reveal-complete:Coverage Matters')).toBe('1');
  });

  it('covers smooth-scroll hash and pageshow branches with Lenis resize/scrollTo hooks', async () => {
    const LenisModule = await import('lenis');
    const LenisClass = LenisModule.default as unknown as { prototype: Record<string, unknown> };

    const scrollToSpy = vi.fn();
    const resizeSpy = vi.fn();
    LenisClass.prototype.scrollTo = scrollToSpy;
    LenisClass.prototype.resize = resizeSpy;

    const perfSpy = vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { type: 'reload' } as PerformanceNavigationTiming,
    ]);
    const windowScrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    window.history.pushState({}, '', '#anchored');
    const { unmount } = render(<SmoothScroll />);

    const pageShow = new Event('pageshow');
    Object.defineProperty(pageShow, 'persisted', { value: true });
    window.dispatchEvent(pageShow);

    expect(resizeSpy).toHaveBeenCalled();

    window.history.pushState({}, '', '/');
    window.dispatchEvent(pageShow);

    expect(windowScrollSpy).toHaveBeenCalledWith(0, 0);
    expect(scrollToSpy).toHaveBeenCalledWith(0, { immediate: true });

    unmount();
    perfSpy.mockRestore();
    windowScrollSpy.mockRestore();
  });

  it('covers service worker cleanup branches, including early-return and error handling', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const unregister = vi.fn().mockResolvedValue(true);
    const getRegistrations = vi.fn().mockResolvedValue([{ unregister }]);
    const cachesDelete = vi.fn().mockResolvedValue(true);
    const cachesKeys = vi.fn().mockResolvedValue(['v1']);

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistrations,
        controller: null,
      },
    });

    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        keys: cachesKeys,
        delete: cachesDelete,
      },
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(process.env.NODE_ENV).toBe('production');
      expect(getRegistrations).toHaveBeenCalled();
      expect(unregister).toHaveBeenCalled();
      expect(cachesKeys).toHaveBeenCalled();
      expect(cachesDelete).toHaveBeenCalledWith('v1');
      expect(window.sessionStorage.getItem('sw-cleanup-complete')).toBe('true');
    });

    window.sessionStorage.setItem('sw-cleanup-complete', 'true');
    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(getRegistrations).toHaveBeenCalledTimes(1);
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistrations: vi.fn().mockRejectedValue(new Error('boom')),
        controller: null,
      },
    });

    window.sessionStorage.removeItem('sw-cleanup-complete');
    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
    delete (window as Window & { caches?: CacheStorage }).caches;
    process.env.NODE_ENV = originalNodeEnv;
  });
});
