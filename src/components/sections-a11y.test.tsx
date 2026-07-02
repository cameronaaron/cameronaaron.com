import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Certifications from '@/components/Certifications';
import Contact from '@/components/Contact';
import Education from '@/components/Education';
import Experience from '@/components/Experience';
import Hero from '@/components/Hero';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Testimonials from '@/components/Testimonials';
import { navItems } from '@/data/navigation';

const SECTION_FIXTURES = [
  { name: 'Hero', expectedIds: ['home'], Component: Hero },
  { name: 'Certifications', expectedIds: ['certifications'], Component: Certifications },
  { name: 'Experience', expectedIds: ['experience'], Component: Experience },
  { name: 'Education', expectedIds: ['education'], Component: Education },
  { name: 'Projects', expectedIds: ['projects'], Component: Projects },
  { name: 'Skills', expectedIds: ['skills'], Component: Skills },
  { name: 'Testimonials', expectedIds: ['testimonials'], Component: Testimonials },
  { name: 'Contact', expectedIds: ['contact'], Component: Contact },
] as const;

describe('Section a11y contract', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  for (const fixture of SECTION_FIXTURES) {
    it(`${fixture.name} mounts without console errors`, () => {
      const { unmount } = render(<fixture.Component />);
      expect(errorSpy).not.toHaveBeenCalled();
      unmount();
    });

    it(`${fixture.name} exposes the expected DOM id(s) used by navigation`, () => {
      const { container, unmount } = render(<fixture.Component />);
      for (const id of fixture.expectedIds) {
        expect(container.querySelector(`#${id}`)).not.toBeNull();
      }
      unmount();
    });

    it(`${fixture.name} has at least one heading for screen-reader landmarks`, () => {
      const { container, unmount } = render(<fixture.Component />);
      const headings = container.querySelectorAll('h1, h2, h3');
      expect(headings.length).toBeGreaterThan(0);
      unmount();
    });

    it(`${fixture.name} gives every <img> non-empty alt text or marks it decorative`, () => {
      const { container, unmount } = render(<fixture.Component />);
      for (const img of Array.from(container.querySelectorAll('img'))) {
        const alt = img.getAttribute('alt');
        const ariaHidden = img.getAttribute('aria-hidden');
        expect(alt !== null || ariaHidden === 'true').toBe(true);
      }
      unmount();
    });

    it(`${fixture.name} gives every interactive control an accessible name`, () => {
      const { container, unmount } = render(<fixture.Component />);
      const buttons = Array.from(container.querySelectorAll('button'));
      for (const button of buttons) {
        const accessible =
          button.getAttribute('aria-label') ||
          button.getAttribute('aria-labelledby') ||
          button.textContent?.trim();
        expect(Boolean(accessible)).toBe(true);
      }
      const links = Array.from(container.querySelectorAll('a'));
      for (const link of links) {
        const accessible =
          link.getAttribute('aria-label') ||
          link.getAttribute('aria-labelledby') ||
          link.textContent?.trim();
        expect(Boolean(accessible)).toBe(true);
      }
      unmount();
    });
  }

  it('every navItem hash maps to a section id rendered by one of the page components', () => {
    const ids = new Set<string>();
    for (const fixture of SECTION_FIXTURES) {
      const { container, unmount } = render(<fixture.Component />);
      container.querySelectorAll('[id]').forEach((el) => ids.add(el.id));
      unmount();
    }
    for (const item of navItems) {
      const id = item.href.replace('#', '');
      expect(ids.has(id)).toBe(true);
    }
  });
});
