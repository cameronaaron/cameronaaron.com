import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { viewport } from '@/app/layout';
import Education from '@/components/Education';
import Navigation from '@/components/Navigation';
import BackToTop from '@/components/ui/BackToTop';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import QuickActionsDock from '@/components/ui/QuickActionsDock';
import SpotlightCard from '@/components/ui/SpotlightCard';

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function setScroll(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  fireEvent.scroll(window);
}

describe('mobile regression contract', () => {
  it('keeps mobile viewport metadata configured for responsive rendering', () => {
    expect(viewport.width).toBe('device-width');
    expect(viewport.initialScale).toBe(1);
    expect(viewport.viewportFit).toBe('cover');
  });

  it('keeps mobile navigation tap targets and safe-area padding in the slide-down panel', () => {
    render(<Navigation />);

    const toggle = screen.getByRole('button', { name: /open navigation menu/i });
    expect(toggle.className).toContain('h-11');
    expect(toggle.className).toContain('w-11');

    fireEvent.click(toggle);

    const panel = document.getElementById('mobile-nav-panel');
    expect(panel).toBeTruthy();
    expect(panel?.className).toContain('pb-[env(safe-area-inset-bottom)]');

    const links = within(panel as HTMLElement).getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.className).toContain('min-h-[44px]');
    }
  });

  it('keeps keyboard shortcut overlay mobile-safe with bottom anchoring and safe-area inset', () => {
    for (const id of ['home', 'experience', 'projects', 'skills', 'contact', 'certifications', 'education', 'testimonials']) {
      const section = document.createElement('section');
      section.id = id;
      document.body.appendChild(section);
    }

    render(<KeyboardShortcuts />);
    fireEvent.click(screen.getByTestId('keyboard-shortcuts-trigger'));

    const backdrop = screen.getByTestId('keyboard-shortcuts-backdrop');
    expect(backdrop.className).toContain('items-end');
    expect(backdrop.className).toContain('pb-[calc(env(safe-area-inset-bottom)+1rem)]');
    expect(backdrop.className).toContain('sm:items-center');
  });

  it('keeps back-to-top control at mobile-friendly size', () => {
    render(<BackToTop threshold={0} />);
    act(() => setScroll(800));

    const button = screen.getByTestId('back-to-top');
    expect(button.className).toContain('h-11');
    expect(button.className).toContain('w-11');
    expect(button.className).toContain('bottom-20');
  });

  it('keeps quick actions dock reachable from mobile viewport edges', () => {
    render(<QuickActionsDock performanceTier="full" />);

    const dock = screen.getByRole('navigation', { name: /quick navigation dock/i });
    // Fixed bottom offset must add the home-indicator safe area on notched phones
    expect(dock.className).toContain('bottom-[calc(1.25rem+env(safe-area-inset-bottom))]');
    expect(dock.className).toContain('right-5');
    expect(dock.className).toContain('sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]');

    fireEvent.click(screen.getByRole('button', { name: /explore quick actions/i }));
    expect(screen.getByRole('link', { name: /credentials/i })).toBeTruthy();
  });

  it('keeps full-screen sections on svh units so the iOS URL bar never hides content', () => {
    // 100vh on iOS is the LARGE viewport: with the URL bar visible, the bottom
    // of a min-h-screen hero (scroll cue, CTA) sits below the fold. svh sizes
    // to the small viewport, so above-the-fold content is always visible.
    for (const path of [
      'src/components/Hero.tsx',
      'src/app/error.tsx',
      'src/app/loading.tsx',
      'src/app/not-found.tsx',
    ]) {
      const source = read(path);
      expect(source, `${path} must use min-h-svh`).toContain('min-h-svh');
      expect(source, `${path} must not size to the large viewport`).not.toContain('min-h-screen');
    }
  });

  it('does not stick the SpotlightCard hover glow on coarse-pointer (touch) devices', () => {
    // Touch browsers emulate mouseenter on tap and never deliver mouseleave
    // until the next tap elsewhere — an ungated hover glow sticks on.
    const coarseMedia = {
      matches: true,
      media: '(pointer: coarse)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: () => true,
    };
    const matchMediaSpy = vi
      .spyOn(window, 'matchMedia')
      .mockReturnValue(coarseMedia as unknown as MediaQueryList);

    try {
      const { container } = render(
        <SpotlightCard>
          <div>touch content</div>
        </SpotlightCard>
      );
      const card = container.firstElementChild as HTMLElement;

      // Emulated tap sequence on touch: mouseenter + mousemove
      fireEvent.mouseEnter(card);
      fireEvent.mouseMove(card, { clientX: 10, clientY: 10 });

      // No layer may light up: every overlay stays at opacity 0
      const litLayers = Array.from(card.querySelectorAll('div[aria-hidden="true"]')).filter(
        (el) => (el as HTMLElement).style.opacity === '1' || (el as HTMLElement).style.opacity === '0.8'
      );
      expect(litLayers).toEqual([]);
    } finally {
      matchMediaSpy.mockRestore();
    }
  });

  it('keeps education prerequisites mobile cards and horizontal overflow protection', () => {
    const { container } = render(<Education />);

    const tableRegion = screen.getByRole('region', {
      name: /nursing program prerequisite coursework table/i,
    });
    expect(tableRegion.className).toContain('overflow-x-auto');

    const mobileRows = container.querySelectorAll('[data-testid^="prereq-mobile-row-"]');
    expect(mobileRows.length).toBeGreaterThan(0);

    const firstMobileRow = mobileRows[0] as HTMLElement;
    expect(firstMobileRow.className).toContain('p-4');

    const desktopTableWrap = Array.from(container.querySelectorAll('div')).find((el) =>
      (el as HTMLElement).className.includes('min-w-[920px]')
    ) as HTMLElement | undefined;
    expect(desktopTableWrap).toBeTruthy();
    expect(desktopTableWrap?.className).toContain('hidden');
    expect(desktopTableWrap?.className).toContain('md:block');
  });
});
