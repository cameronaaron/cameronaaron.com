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

  it('keeps non-featured projects ordered from most recent to oldest', () => {
    const { container } = render(<Projects />);
    const rows = Array.from(container.querySelectorAll('[data-testid^="project-card-"]'));

    const periods = rows
      .map((row) => row.getAttribute('data-period'))
      .filter((period): period is string => Boolean(period));

    for (let index = 1; index < periods.length; index += 1) {
      expect(getDateSortKey(periods[index - 1])).toBeGreaterThanOrEqual(getDateSortKey(periods[index]));
    }
  });
});
