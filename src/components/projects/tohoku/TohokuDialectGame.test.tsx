import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TohokuDialectGame from './TohokuDialectGame';
import { checkAnswer, getInitialRound } from './tohoku-dialect-logic';

function correctOption(): string {
  const round = getInitialRound();
  const correct = round.options.find((option) => checkAnswer(round, option));
  if (!correct) throw new Error('fixture bug: no option in the initial round is correct');
  return correct;
}

function wrongOption(): string {
  const round = getInitialRound();
  const wrong = round.options.find((option) => !checkAnswer(round, option));
  if (!wrong) throw new Error('fixture bug: every option in the initial round is correct');
  return wrong;
}

describe('TohokuDialectGame', () => {
  it('renders the initial round with zero score/streak', () => {
    render(<TohokuDialectGame />);

    expect(screen.getByTestId('tohoku-score').textContent).toBe('0');
    expect(screen.getByTestId('tohoku-streak').textContent).toBe('0');
    expect(screen.getByTestId('tohoku-best').textContent).toBe('0');
  });

  it('choosing the correct option increases score/streak and shows a correct message', () => {
    render(<TohokuDialectGame />);
    fireEvent.click(screen.getByTestId(`tohoku-option-${correctOption()}`));

    expect(screen.getByTestId('tohoku-score').textContent).toBe('1');
    expect(screen.getByTestId('tohoku-streak').textContent).toBe('1');
    expect(screen.getByTestId('tohoku-message').textContent).toMatch(/^Correct\./);
  });

  it('choosing a wrong option keeps the score at zero and shows a correction', () => {
    render(<TohokuDialectGame />);
    fireEvent.click(screen.getByTestId(`tohoku-option-${wrongOption()}`));

    expect(screen.getByTestId('tohoku-score').textContent).toBe('0');
    expect(screen.getByTestId('tohoku-message').textContent).toMatch(/^Not quite\./);
  });

  it('disables the options once a round is resolved', () => {
    render(<TohokuDialectGame />);
    const option = correctOption();
    fireEvent.click(screen.getByTestId(`tohoku-option-${option}`));

    expect(screen.getByTestId(`tohoku-option-${option}`).hasAttribute('disabled')).toBe(true);
  });

  it('"Next word" starts a fresh round with no message and no next button', () => {
    render(<TohokuDialectGame />);
    fireEvent.click(screen.getByTestId(`tohoku-option-${correctOption()}`));
    expect(screen.getByTestId('tohoku-next')).toBeTruthy();

    fireEvent.click(screen.getByTestId('tohoku-next'));

    expect(screen.getByTestId('tohoku-message').textContent).toBe('');
    expect(screen.queryByTestId('tohoku-next')).toBeNull();
  });
});
