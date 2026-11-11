import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Hero from '@/components/Hero';
import { HERO_DISCIPLINES } from '@/components/hero/hero-logic';
import { profile } from '@/data/profile';

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');

describe('Hero', () => {
  it('sets the name as the page heading, with the credentials outside the two name lines', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1, name: profile.name });
    const lines = heading.querySelectorAll('.hero-name-line');

    expect(lines).toHaveLength(2);
    expect(lines[0].textContent).toBe('Cameron');
    expect(heading.querySelector('.hero-credentials')?.textContent).toBe('M.Ed.');
    // The comma separates name from credentials; it is not part of either.
    expect(heading.textContent).toBe('CameronAaronM.Ed.');
  });

  it('states the role and the tagline from the profile data, verbatim', () => {
    render(<Hero />);
    expect(screen.getByText(profile.title)).toBeTruthy();
    expect(screen.getByText(profile.tagline)).toBeTruthy();
  });

  it('offers three actions that each lead to a real section', () => {
    render(<Hero />);
    const hrefOf = (name: string) => screen.getByRole('link', { name }).getAttribute('href');

    expect(hrefOf('See selected work')).toBe('#selected-work');
    expect(hrefOf('View credentials')).toBe('#certifications');
    expect(hrefOf('Get in touch')).toBe('#contact');
  });

  it('links every discipline to its section, in order', () => {
    const { container } = render(<Hero />);
    const links = [...container.querySelectorAll<HTMLAnchorElement>('a.hero-discipline')];

    expect(links.map((link) => link.getAttribute('href'))).toEqual(HERO_DISCIPLINES.map((d) => d.href));
    links.forEach((link, index) => {
      const discipline = HERO_DISCIPLINES[index];
      expect(within(link).getByRole('heading', { level: 2, name: discipline.title })).toBeTruthy();
      expect(within(link).getByText(discipline.name)).toBeTruthy();
      expect(within(link).getByText(discipline.action).className).toContain('mark-link');
    });
  });

  it('renders every stat as a term/definition pair', () => {
    const { container } = render(<Hero />);
    const terms = [...container.querySelectorAll('dl.hero-stats dt')].map((node) => node.textContent);
    const values = [...container.querySelectorAll('dl.hero-stats dd')].map((node) => node.textContent);

    expect(terms).toEqual(profile.stats.map((stat) => stat.label));
    expect(values).toEqual(profile.stats.map((stat) => stat.value));
  });

  it('puts the portrait before the copy on mobile and after it on desktop (CLAUDE.md constraint 11)', () => {
    const { container } = render(<Hero />);
    expect(container.querySelector('.hero-portrait')?.className).toContain('order-1 md:order-2');
    expect(container.querySelector('.hero-copy')?.className).toContain('order-2 md:order-1');
  });

  it('ships the portrait with its name as alt text and the location beneath it', () => {
    const { container } = render(<Hero />);
    expect(container.querySelector('.hero-portrait-frame img')?.getAttribute('alt')).toBe(profile.name);
    expect(container.querySelector('.hero-portrait-caption')?.textContent).toBe(profile.location);
  });
});

describe('Hero stays static: nothing above the fold starts hidden or needs JavaScript', () => {
  const css = read('src/app/globals.css');
  const block = (selector: string) => css.match(new RegExp(`\\${selector}\\s*\\{[^}]*\\}`))?.[0] ?? '';

  it('Hero, its portrait and the section header are Server Components', () => {
    for (const rel of ['src/components/Hero.tsx', 'src/components/hero/ProfileImage.tsx', 'src/components/ui/SectionHeader.tsx']) {
      const source = read(rel);
      expect(source, `${rel} must not be a client component`).not.toMatch(/^\s*['"]use client['"]/m);
      expect(source, `${rel} must not import framer-motion`).not.toContain('framer-motion');
    }
  });

  it('the LCP candidates carry no entrance animation', () => {
    // An element that animates in from opacity 0 is not painted, and so is not
    // an LCP candidate, until its animation lets it be. Guard the guard: the
    // rules must exist, or the absence of "animation" proves nothing.
    for (const selector of ['.hero-name', '.hero-title', '.hero-lede', '.hero-portrait-frame']) {
      const rule = block(selector);
      expect(rule, `${selector} rule missing from globals.css`).not.toBe('');
      expect(rule, `${selector} must not animate in`).not.toMatch(/animation|opacity/);
    }
  });

  it('the load moment is transform-only', () => {
    const keyframes = [...css.matchAll(/@keyframes (portrait-block-in|rule-draw)\s*\{([^@]*?\})\s*\}/g)];
    expect(keyframes.length).toBeGreaterThanOrEqual(2);
    for (const [, name, body] of keyframes) {
      const properties = [...body.matchAll(/([a-z-]+)\s*:/g)].map((match) => match[1]);
      expect(new Set(properties), `@keyframes ${name}`).toEqual(new Set(['transform']));
    }
  });

  it('the name scales with the viewport instead of stepping through breakpoints', () => {
    expect(block('.hero-name')).toMatch(/font-size:\s*clamp\(3\.75rem,\s*11\.5vw,\s*9\.75rem\)/);
  });
});
