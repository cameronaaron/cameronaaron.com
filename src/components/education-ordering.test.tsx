import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Education from './Education';

function isNonFinalizedStatus(status: string): boolean {
  return /in progress|planned|pending|tbd|enrolled|not started/i.test(status);
}

describe('education ordering contract', () => {
  it('keeps education credentials ordered from most recent to oldest', () => {
    const { container } = render(<Education />);
    const cards = Array.from(container.querySelectorAll('[data-testid^="education-card-"]'));
    const periods = cards.map((card) => card.getAttribute('data-period'));

    expect(periods[0]).toBe('May 2023 - Jun 2026');
    expect(periods[1]).toBe('Aug 2023 - Jun 2024');
    expect(periods[2]).toBe('Aug 2017 - May 2021');
  });

  it('keeps non-finalized prerequisite coursework entries at the bottom', () => {
    const { container } = render(<Education />);
    const rows = Array.from(container.querySelectorAll('[data-testid^="prereq-desktop-row-"]'));
    const statuses = rows.map((row) => row.getAttribute('data-status') ?? '');

    expect(statuses.some((status) => isNonFinalizedStatus(status))).toBe(true);

    let seenNonFinalized = false;
    for (const status of statuses) {
      if (isNonFinalizedStatus(status)) {
        seenNonFinalized = true;
        continue;
      }
      expect(seenNonFinalized).toBe(false);
    }
  });

  it('keeps honors and affiliations ordered by latest dated item first', () => {
    const { container } = render(<Education />);
    const honorPills = Array.from(container.querySelectorAll('[data-testid^="honor-pill-"]'));
    const values = honorPills.map((pill) => pill.textContent ?? '');

    expect(values[0]).toContain('(Jun 2025)');
    expect(values[1]).toContain('(May 2024)');
  });
});
