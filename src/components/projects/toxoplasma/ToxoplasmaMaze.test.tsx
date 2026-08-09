import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ToxoplasmaMaze from './ToxoplasmaMaze';
import { checkPrediction, getInitialRound, type MazeArm } from './toxoplasma-logic';

function correctArm(): MazeArm {
  const round = getInitialRound();
  return (['a', 'b'] as const).find((arm) => checkPrediction(round, arm)) as MazeArm;
}

function wrongArm(): MazeArm {
  const round = getInitialRound();
  return (['a', 'b'] as const).find((arm) => !checkPrediction(round, arm)) as MazeArm;
}

describe('ToxoplasmaMaze', () => {
  it('renders the initial round with zero score/streak', () => {
    render(<ToxoplasmaMaze />);

    expect(screen.getByTestId('toxo-score').textContent).toBe('0');
    expect(screen.getByTestId('toxo-streak').textContent).toBe('0');
    expect(screen.getByTestId('toxo-best').textContent).toBe('0');
  });

  it('predicting the correct arm increases score/streak and shows a correct message', () => {
    render(<ToxoplasmaMaze />);
    fireEvent.click(screen.getByTestId(`toxo-arm-${correctArm()}`));

    expect(screen.getByTestId('toxo-score').textContent).toBe('1');
    expect(screen.getByTestId('toxo-streak').textContent).toBe('1');
    expect(screen.getByTestId('toxo-message').textContent).toMatch(/^Correct\./);
  });

  it('predicting the wrong arm keeps the score at zero and shows a correction', () => {
    render(<ToxoplasmaMaze />);
    fireEvent.click(screen.getByTestId(`toxo-arm-${wrongArm()}`));

    expect(screen.getByTestId('toxo-score').textContent).toBe('0');
    expect(screen.getByTestId('toxo-message').textContent).toMatch(/^Not quite\./);
  });

  it('disables both arms once a round is resolved', () => {
    render(<ToxoplasmaMaze />);
    fireEvent.click(screen.getByTestId(`toxo-arm-${correctArm()}`));

    expect(screen.getByTestId('toxo-arm-a').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('toxo-arm-b').hasAttribute('disabled')).toBe(true);
  });

  it('"Next rodent" starts a fresh round with no message and no next button', () => {
    render(<ToxoplasmaMaze />);
    fireEvent.click(screen.getByTestId(`toxo-arm-${correctArm()}`));
    expect(screen.getByTestId('toxo-next')).toBeTruthy();

    fireEvent.click(screen.getByTestId('toxo-next'));

    expect(screen.getByTestId('toxo-message').textContent).toBe('');
    expect(screen.queryByTestId('toxo-next')).toBeNull();
  });

  it('flips the rodent status indicator color when a new round has the opposite infection status', () => {
    // Seed 1 (verified via toxoplasma-logic.generateRound(1)) produces a
    // round with the opposite `infected` value from the fixed-seed initial
    // round, which this file's other tests already exercise.
    const initial = getInitialRound();
    render(<ToxoplasmaMaze />);
    fireEvent.click(screen.getByTestId(`toxo-arm-${correctArm()}`));

    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(1);
    fireEvent.click(screen.getByTestId('toxo-next'));
    dateNowSpy.mockRestore();

    const indicator = screen.getByTestId('toxo-rodent').querySelector('span[aria-hidden="true"]');
    expect(indicator?.className.includes('bg-rose-400')).toBe(!initial.infected);
    expect(indicator?.className.includes('bg-emerald-400')).toBe(initial.infected);
  });
});
