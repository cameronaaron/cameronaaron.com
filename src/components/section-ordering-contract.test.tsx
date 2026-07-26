import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import { getDateSortKey } from '@/data/dateOrdering';

describe('section ordering contract', () => {
  it('keeps experience items ordered from most recent to oldest', () => {
    const { container } = render(<Experience />);
    const rows = Array.from(container.querySelectorAll('[data-testid^="experience-item-"]'));

    const periods = rows
      .map((row) => row.getAttribute('data-latest-period'))
      .filter((period): period is string => Boolean(period));

    for (let index = 1; index < periods.length; index += 1) {
      expect(getDateSortKey(periods[index - 1])).toBeGreaterThanOrEqual(getDateSortKey(periods[index]));
    }
  });

  it('keeps featured projects ordered from most recent to oldest', () => {
    const { container } = render(<Projects />);
    const rows = Array.from(container.querySelectorAll('[data-testid^="featured-project-item-"]'));

    const periods = rows
      .map((row) => row.getAttribute('data-period'))
      .filter((period): period is string => Boolean(period));

    for (let index = 1; index < periods.length; index += 1) {
      expect(getDateSortKey(periods[index - 1])).toBeGreaterThanOrEqual(getDateSortKey(periods[index]));
    }
  });

  it('keeps non-featured projects ordered from most recent to oldest, within each band', () => {
    // Non-featured projects render in TWO bands since 2026-07-26: those with a
    // playable companion (paired with their game) come first, then the compact
    // grid. Recency ordering therefore holds within each band, not across the
    // concatenation — asserting a single flat descending sequence would be
    // asserting a layout that deliberately no longer exists.
    const { container } = render(<Projects />);

    const playableBand = container.querySelector('[data-testid="playable-projects"]');
    expect(playableBand).not.toBeNull();

    const periodsIn = (root: ParentNode) =>
      Array.from(root.querySelectorAll('[data-testid^="project-card-"]'))
        .map((row) => row.getAttribute('data-period'))
        .filter((period): period is string => Boolean(period));

    const playablePeriods = periodsIn(playableBand!);
    const gridPeriods = periodsIn(container).filter((period) => !playablePeriods.includes(period));

    expect(playablePeriods.length).toBeGreaterThan(0);
    expect(gridPeriods.length).toBeGreaterThan(0);

    for (const periods of [playablePeriods, gridPeriods]) {
      for (let index = 1; index < periods.length; index += 1) {
        expect(getDateSortKey(periods[index - 1])).toBeGreaterThanOrEqual(getDateSortKey(periods[index]));
      }
    }
  });

  it('never leaves a playable project stranded in the compact grid', () => {
    // The defect the band split fixed: a project whose game rendered far below
    // it. Every game must live inside its own project's block.
    const { container } = render(<Projects />);
    const playableBand = container.querySelector('[data-testid="playable-projects"]');

    const disclosures = Array.from(container.querySelectorAll('[data-testid^="demo-disclosure-"]'));
    expect(disclosures.length).toBeGreaterThan(0);

    for (const disclosure of disclosures) {
      // Each companion sits inside either a featured project block or the
      // playable band — never orphaned at section level.
      const inPlayableBand = playableBand?.contains(disclosure) ?? false;
      const inFeatured = disclosure.closest('[data-testid^="featured-project-item-"]') !== null;
      expect(inPlayableBand || inFeatured).toBe(true);
    }
  });
});
