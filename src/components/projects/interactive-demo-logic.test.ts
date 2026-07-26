import { describe, expect, it } from 'vitest';

import { projects, type InteractiveDemo } from '@/data/projects';
import {
  DEMO_DESCRIPTORS,
  getDemoDescriptor,
  getDemoToggleAriaLabel,
  getDemoToggleLabel,
} from './interactive-demo-logic';

const ALL_DEMOS = Object.keys(DEMO_DESCRIPTORS) as InteractiveDemo[];

describe('DEMO_DESCRIPTORS', () => {
  it('describes every demo a project actually references', () => {
    // The pairing breaks silently if a project names a demo with no copy:
    // the button would read "Play undefined".
    for (const project of projects) {
      if (!project.interactiveDemo) continue;
      expect(DEMO_DESCRIPTORS[project.interactiveDemo]).toBeDefined();
    }
  });

  it('has no descriptor for a demo nothing references', () => {
    const referenced = new Set(projects.map((project) => project.interactiveDemo).filter(Boolean));
    for (const demo of ALL_DEMOS) {
      expect(referenced.has(demo)).toBe(true);
    }
  });

  it('gives every demo a real title and a real teaser', () => {
    for (const demo of ALL_DEMOS) {
      expect(DEMO_DESCRIPTORS[demo].title.length).toBeGreaterThan(3);
      expect(DEMO_DESCRIPTORS[demo].teaser.length).toBeGreaterThan(30);
    }
  });

  it('gives every demo a distinct title', () => {
    const titles = ALL_DEMOS.map((demo) => DEMO_DESCRIPTORS[demo].title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('never falls back to a generic name — the button must say what it opens', () => {
    for (const demo of ALL_DEMOS) {
      expect(DEMO_DESCRIPTORS[demo].title.toLowerCase()).not.toContain('demo');
      expect(DEMO_DESCRIPTORS[demo].title.toLowerCase()).not.toContain('game');
    }
  });

  it('pins a couple of exact titles so a rename is a deliberate act', () => {
    expect(DEMO_DESCRIPTORS['toxoplasma-maze'].title).toBe('Fatal Feline Attraction');
    expect(DEMO_DESCRIPTORS['collective-intelligence-game'].title).toBe('Build the Smartest Team');
  });
});

describe('getDemoDescriptor', () => {
  it('returns the descriptor for a demo', () => {
    expect(getDemoDescriptor('tohoku-dialect-game').title).toBe('Hear the Shift');
  });
});

describe('getDemoToggleLabel', () => {
  it('names the game in both states', () => {
    expect(getDemoToggleLabel('toxoplasma-maze', false)).toBe('Play Fatal Feline Attraction');
    expect(getDemoToggleLabel('toxoplasma-maze', true)).toBe('Hide Fatal Feline Attraction');
  });

  it('produces a distinct label for every demo', () => {
    const labels = ALL_DEMOS.map((demo) => getDemoToggleLabel(demo, false));
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('getDemoToggleAriaLabel', () => {
  it('names both the game and the project it belongs to', () => {
    expect(getDemoToggleAriaLabel('ephemeral-room-game', 'thehellisthis.com', false)).toBe(
      'Play Keep the Room Alive, the playable companion to thehellisthis.com'
    );
  });

  it('switches the verb when open', () => {
    expect(getDemoToggleAriaLabel('ephemeral-room-game', 'thehellisthis.com', true)).toContain('Hide Keep the Room');
  });

  it('always mentions the owning project — the whole point of the pairing', () => {
    for (const demo of ALL_DEMOS) {
      expect(getDemoToggleAriaLabel(demo, 'Some Project', false)).toContain('Some Project');
    }
  });
});
