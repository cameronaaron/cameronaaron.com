import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CollectiveIntelligenceGame from './CollectiveIntelligenceGame';
import { CANDIDATE_POOL, HIGHEST_IQ_TEAM_IDS, TEAM_SIZE } from './collective-intelligence-logic';

describe('CollectiveIntelligenceGame', () => {
  it('renders the hint and a 0/TEAM_SIZE count before anyone is selected', () => {
    render(<CollectiveIntelligenceGame />);

    expect(screen.getByTestId('ci-count').textContent).toBe(`0/${TEAM_SIZE}`);
    expect(screen.getByTestId('ci-hint').textContent).toContain(`Select ${TEAM_SIZE} more`);
    expect(screen.queryByTestId('ci-result')).toBeNull();
  });

  it('selecting candidates one at a time updates the count and toggles pressed state', () => {
    render(<CollectiveIntelligenceGame />);
    const first = CANDIDATE_POOL[0];
    const button = screen.getByTestId(`ci-candidate-${first.id}`);

    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('ci-count').textContent).toBe(`1/${TEAM_SIZE}`);

    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('ci-count').textContent).toBe(`0/${TEAM_SIZE}`);
  });

  it('selecting a full team reveals the score and disables the remaining candidates', () => {
    render(<CollectiveIntelligenceGame />);
    for (const candidate of CANDIDATE_POOL.slice(0, TEAM_SIZE)) {
      fireEvent.click(screen.getByTestId(`ci-candidate-${candidate.id}`));
    }

    expect(screen.getByTestId('ci-result')).toBeTruthy();
    expect(screen.getByTestId('ci-score').textContent).toBeTruthy();
    expect(screen.getByTestId('ci-verdict').textContent).toBeTruthy();

    const unselected = CANDIDATE_POOL[TEAM_SIZE];
    expect(screen.getByTestId(`ci-candidate-${unselected.id}`).hasAttribute('disabled')).toBe(true);
  });

  it('"Draft the four highest IQs" selects exactly the all-star lineup', () => {
    render(<CollectiveIntelligenceGame />);
    fireEvent.click(screen.getByTestId('ci-allstars'));

    expect(screen.getByTestId('ci-count').textContent).toBe(`${HIGHEST_IQ_TEAM_IDS.length}/${TEAM_SIZE}`);
    for (const id of HIGHEST_IQ_TEAM_IDS) {
      expect(screen.getByTestId(`ci-candidate-${id}`).getAttribute('aria-pressed')).toBe('true');
    }
  });

  it('"Clear" resets the selection back to the hint state', () => {
    render(<CollectiveIntelligenceGame />);
    fireEvent.click(screen.getByTestId('ci-allstars'));
    expect(screen.getByTestId('ci-result')).toBeTruthy();

    fireEvent.click(screen.getByTestId('ci-reset'));

    expect(screen.getByTestId('ci-count').textContent).toBe(`0/${TEAM_SIZE}`);
    expect(screen.queryByTestId('ci-result')).toBeNull();
  });
});
