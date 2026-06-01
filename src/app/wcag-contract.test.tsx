import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import Home from './page';

const ARIA_REFERENCE_ATTRIBUTES = [
  'aria-labelledby',
  'aria-describedby',
  'aria-controls',
  'aria-owns',
  'aria-activedescendant',
];

function getAccessibleName(node: Element): string {
  const labelledBy = node.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .join(' ')
      .trim();
    if (text) return text;
  }

  const ariaLabel = node.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  return node.textContent?.trim() ?? '';
}

function getFocusableElements(container: HTMLElement): Element[] {
  const candidates = Array.from(
    container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')
  );

  return candidates.filter((node) => {
    if (
      node instanceof HTMLButtonElement ||
      node instanceof HTMLInputElement ||
      node instanceof HTMLSelectElement ||
      node instanceof HTMLTextAreaElement
    ) {
      if (node.disabled) return false;
    }

    if (node instanceof HTMLInputElement && node.type === 'hidden') return false;

    const tabIndex = node.getAttribute('tabindex');
    if (tabIndex !== null && Number.parseInt(tabIndex, 10) < 0) return false;

    return true;
  });
}

describe('WCAG contract guardrails', () => {
  it('provides a valid landmark structure', () => {
    const { container } = render(<Home />);

    expect(container.querySelectorAll('main').length).toBe(1);

    const sectionIds = Array.from(container.querySelectorAll('section[id]'));
    expect(sectionIds.length).toBeGreaterThan(0);

    for (const section of sectionIds) {
      const label = section.getAttribute('aria-label');
      const labelledBy = section.getAttribute('aria-labelledby');
      const hasHeading = section.querySelector('h1, h2, h3, h4, h5, h6') !== null;
      expect(Boolean(label || labelledBy || hasHeading)).toBe(true);
    }
  });

  it('keeps heading order coherent without skipping levels', () => {
    const { container } = render(<Home />);

    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    expect(headings.length).toBeGreaterThan(0);

    const levels = headings.map((heading) => Number(heading.tagName.replace('H', '')));
    const h1Count = levels.filter((level) => level === 1).length;
    expect(h1Count).toBe(1);

    for (let index = 1; index < levels.length; index += 1) {
      const previous = levels[index - 1];
      const current = levels[index];
      expect(current - previous).toBeLessThanOrEqual(1);
    }
  });

  it('ensures images are either described or intentionally hidden', () => {
    const { container } = render(<Home />);

    const images = Array.from(container.querySelectorAll('img'));
    for (const image of images) {
      const alt = image.getAttribute('alt');
      const ariaHidden = image.getAttribute('aria-hidden');
      expect(alt !== null || ariaHidden === 'true').toBe(true);

      if (alt !== null) {
        expect(alt.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('ensures all interactive controls expose an accessible name', () => {
    const { container } = render(<Home />);

    const controls = Array.from(container.querySelectorAll('a, button, input, select, textarea'));

    for (const control of controls) {
      const hidden = control.getAttribute('aria-hidden') === 'true';
      if (hidden) continue;

      const name = getAccessibleName(control);
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('ensures external links opened in new tabs include safe rel attributes', () => {
    const { container } = render(<Home />);

    const links = Array.from(container.querySelectorAll('a[href]'));
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      const href = link.getAttribute('href')?.trim() ?? '';
      expect(href.length).toBeGreaterThan(0);
      expect(href.toLowerCase().startsWith('javascript:')).toBe(false);

      if (link.getAttribute('target') === '_blank') {
        const rel = (link.getAttribute('rel') ?? '').toLowerCase();
        expect(rel.includes('noopener')).toBe(true);
        expect(rel.includes('noreferrer')).toBe(true);
      }
    }
  });

  it('ensures skip links and in-page anchors point to real IDs', () => {
    const { container } = render(<Home />);

    const fragmentLinks = Array.from(container.querySelectorAll('a[href^="#"]'));
    expect(fragmentLinks.length).toBeGreaterThan(0);

    for (const link of fragmentLinks) {
      const href = link.getAttribute('href')?.trim() ?? '';
      if (href === '#') continue;

      const id = decodeURIComponent(href.slice(1));
      expect(id.length).toBeGreaterThan(0);
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it('keeps keyboard focus targets visible to assistive tech and avoids positive tab order', () => {
    const { container } = render(<Home />);

    const focusableElements = getFocusableElements(container);
    expect(focusableElements.length).toBeGreaterThan(0);

    for (const node of focusableElements) {
      expect(node.getAttribute('aria-hidden')).not.toBe('true');
      expect(node.closest('[aria-hidden="true"]')).toBeNull();

      const tabIndex = node.getAttribute('tabindex');
      if (tabIndex !== null) {
        expect(Number.parseInt(tabIndex, 10)).toBeLessThanOrEqual(0);
      }
    }
  });

  it('keeps headings and list semantics non-empty and structurally valid', () => {
    const { container } = render(<Home />);

    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    expect(headings.length).toBeGreaterThan(0);
    for (const heading of headings) {
      expect(heading.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    }

    const lists = Array.from(container.querySelectorAll('ul, ol'));
    for (const list of lists) {
      const directChildren = Array.from(list.children);
      expect(directChildren.length).toBeGreaterThan(0);
      for (const child of directChildren) {
        expect(child.tagName).toBe('LI');
      }
    }
  });

  it('rejects deprecated or potentially disruptive autoplay patterns', () => {
    const { container } = render(<Home />);

    expect(container.querySelector('marquee, blink')).toBeNull();
    expect(container.querySelector('video[autoplay], audio[autoplay], [autoplay]')).toBeNull();
  });

  it('keeps navigation landmarks named and distinct', () => {
    const { container } = render(<Home />);

    const navLandmarks = Array.from(container.querySelectorAll('nav, [role="navigation"]'));
    expect(navLandmarks.length).toBeGreaterThan(0);

    const labels: string[] = [];
    for (const node of navLandmarks) {
      const labelledBy = node.getAttribute('aria-labelledby')
        ?.split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .join(' ')
        .trim();
      const label = node.getAttribute('aria-label')?.trim();
      const computedLabel = labelledBy || label || '';
      expect(computedLabel.length).toBeGreaterThan(0);
      labels.push(computedLabel.toLowerCase());
    }

    expect(new Set(labels).size).toBe(labels.length);
  });

  it('keeps aria ID references valid and IDs unique', () => {
    const { container } = render(<Home />);

    const allIds = Array.from(container.querySelectorAll('[id]')).map((node) => node.id);
    expect(new Set(allIds).size).toBe(allIds.length);

    for (const attribute of ARIA_REFERENCE_ATTRIBUTES) {
      const nodes = Array.from(container.querySelectorAll(`[${attribute}]`));

      for (const node of nodes) {
        const ids = node.getAttribute(attribute);
        if (!ids) continue;

        for (const id of ids.split(/\s+/).filter(Boolean)) {
          const target = document.getElementById(id);
          if (target) continue;

          // Disclosure widgets may keep aria-controls while the region is collapsed/unmounted.
          if (attribute === 'aria-controls' && node.getAttribute('aria-expanded') === 'false') {
            continue;
          }

          expect(target).not.toBeNull();
        }
      }
    }
  });

  it('WCAG 2.2 keyboard support: opens and closes shortcut dialog from keyboard', () => {
    render(<Home />);

    fireEvent.keyDown(window, { key: '?' });

    const dialog = screen.getByRole('dialog', { name: /keyboard shortcuts/i });
    expect(dialog).not.toBeNull();

    const closeButton = screen.getByTestId('keyboard-shortcuts-close');
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: /keyboard shortcuts/i })).toBeNull();
  });

  it('QuickRef + A11y Project: keeps dialog trigger semantics in sync with expanded state', () => {
    render(<Home />);

    const trigger = screen.getByTestId('keyboard-shortcuts-trigger');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBeNull();

    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe('keyboard-shortcuts-dialog');
    expect(document.getElementById('keyboard-shortcuts-dialog')).not.toBeNull();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBeNull();
  });

  it('QuickRef + A11y Project: presentational roles are never keyboard focus targets', () => {
    const { container } = render(<Home />);

    const presentationalNodes = Array.from(container.querySelectorAll('[role="presentation"], [role="none"]'));

    for (const node of presentationalNodes) {
      const nodeAsHTMLElement = node as HTMLElement;
      expect(nodeAsHTMLElement.tabIndex).toBeLessThan(0);
      expect(node.querySelector('a[href], button, input, select, textarea, [tabindex="0"], [tabindex="1"], [tabindex="2"], [tabindex="3"]')).toBeNull();
    }
  });

  it('WCAG 2.2 + QuickRef: button controls expose explicit type and valid toggle state attributes', () => {
    const { container } = render(<Home />);

    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.length).toBeGreaterThan(0);

    for (const button of buttons) {
      const type = button.getAttribute('type');
      expect(type === 'button' || type === 'submit' || type === 'reset').toBe(true);

      const ariaPressed = button.getAttribute('aria-pressed');
      if (ariaPressed !== null) {
        expect(['true', 'false', 'mixed']).toContain(ariaPressed);
      }

      const ariaExpanded = button.getAttribute('aria-expanded');
      if (ariaExpanded !== null) {
        expect(['true', 'false']).toContain(ariaExpanded);

        if (ariaExpanded === 'true') {
          expect((button.getAttribute('aria-controls') ?? '').trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('WCAG 2.2 language of page: layout declares html lang attribute', () => {
    const layoutSource = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    expect(layoutSource).toContain('<html lang="en"');
  });
});
