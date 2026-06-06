import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { viewport } from '@/app/layout';
import Education from '@/components/Education';
import Navigation from '@/components/Navigation';
import BackToTop from '@/components/ui/BackToTop';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import QuickActionsDock from '@/components/ui/QuickActionsDock';

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
    expect(dock.className).toContain('bottom-5');
    expect(dock.className).toContain('right-5');
    expect(dock.className).toContain('sm:bottom-6');

    fireEvent.click(screen.getByRole('button', { name: /explore quick actions/i }));
    expect(screen.getByRole('link', { name: /credentials/i })).toBeTruthy();
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
