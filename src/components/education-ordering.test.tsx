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

    expect(periods[0]).toBe('Sep 2025 - Aug 2026');
    expect(periods[1]).toBe('May 2023 - Jun 2026');
    expect(periods[2]).toBe('Aug 2023 - Jun 2024');
    expect(periods[3]).toBe('Aug 2017 - May 2021');
  });

  it('keeps non-finalized prerequisite coursework entries at the bottom', () => {
    const { container } = render(<Education />);
    const rows = Array.from(container.querySelectorAll('[data-testid^="prereq-row-"]'));
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

    expect(values[0]).toContain('(Jul 2026)');
    expect(values[1]).toContain('(Jun 2026)');
  });

  it('renders pulse indicators only on in-progress prerequisite rows', () => {
    const { container } = render(<Education />);
    const rows = Array.from(container.querySelectorAll('[data-testid^="prereq-row-"]'));

    const inProgressRows = rows.filter((row) => row.getAttribute('data-status') === 'In Progress');
    const completedRows = rows.filter((row) => row.getAttribute('data-status') === 'Completed');

    expect(inProgressRows.length).toBeGreaterThan(0);
    expect(completedRows.length).toBeGreaterThan(0);

    for (const row of inProgressRows) {
      expect(row.querySelector('.animate-ping')).not.toBeNull();
    }

    for (const row of completedRows) {
      expect(row.querySelector('.animate-ping')).toBeNull();
    }
  });
});
