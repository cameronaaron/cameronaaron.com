import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DnaSnpGame from './DnaSnpGame';

describe('DnaSnpGame', () => {
  it('shows a raw-file line and the SNPedia lookup the mirror makes', () => {
    render(<DnaSnpGame />);
    expect(screen.getByTestId('dna-raw-line').textContent).toContain('rs1815739\t11\t66328095\tCT');
    expect(screen.getByTestId('dna-association').textContent).toContain('SNPedia has rs1815739');
    expect(screen.getByTestId('dna-game-score').textContent).toBe('0');
  });

  it('scores what the mirror actually shows', () => {
    render(<DnaSnpGame />);
    fireEvent.click(screen.getByTestId('dna-option-2'));
    expect(screen.getByTestId('dna-game-score').textContent).toBe('1');
    expect(screen.getByTestId('dna-game-message').textContent).toMatch(/^Correct\. CT matches SNPedia/);
    expect(screen.getByTestId('dna-option-0').hasAttribute('disabled')).toBe(true);
  });

  it('corrects a wrong call without scoring it', () => {
    render(<DnaSnpGame />);
    fireEvent.click(screen.getByTestId('dna-option-0'));
    expect(screen.getByTestId('dna-game-score').textContent).toBe('0');
    expect(screen.getByTestId('dna-game-message').textContent).toMatch(/^Not quite\./);
  });

  it('moves to the next line', () => {
    render(<DnaSnpGame />);
    fireEvent.click(screen.getByTestId('dna-option-2'));
    fireEvent.click(screen.getByTestId('dna-game-next-round'));
    expect(screen.getByTestId('dna-raw-line').textContent).toContain('rs671');
    expect(screen.getByTestId('dna-game-message').textContent).toBe('');
  });
});
