import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DnaSnpGame from './DnaSnpGame';
import {
  INITIAL_ROUND_SEED,
  ROUND_ADVANCE_DELAY_MS,
  STRAND_LENGTH,
  generateRound,
  getRoundResultMessage,
  getTileAriaLabel,
} from './dna-snp-game-logic';

// The very first round MUST be reproducible from the fixed seed — this is
// the hydration-safety contract (CLAUDE.md #10): server HTML and the
// client's first paint must render the identical round.
const firstRound = generateRound(INITIAL_ROUND_SEED, STRAND_LENGTH);

afterEach(() => {
  vi.useRealTimers();
});

describe('DnaSnpGame — initial render (hydration safety)', () => {
  it('renders the sample strand tiles exactly matching the fixed-seed round', () => {
    render(<DnaSnpGame />);

    firstRound.sample.forEach((base, index) => {
      const label = getTileAriaLabel(index + 1, base);
      expect(screen.getByLabelText(label)).not.toBeNull();
    });
  });

  it('renders exactly STRAND_LENGTH sample tiles, all enabled and type="button"', () => {
    render(<DnaSnpGame />);

    const sampleButtons = screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-label'));
    expect(sampleButtons).toHaveLength(STRAND_LENGTH);

    for (const button of sampleButtons) {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.hasAttribute('disabled')).toBe(false);
    }
  });

  it('exposes the reference sequence to assistive tech via an sr-only summary', () => {
    render(<DnaSnpGame />);

    expect(screen.getByText(`Reference sequence: ${firstRound.reference.join(' ')}`)).not.toBeNull();
  });

  it('starts with zeroed score, streak, and best streak', () => {
    render(<DnaSnpGame />);

    expect(screen.getByTestId('dna-game-score').textContent).toBe('0');
    expect(screen.getByTestId('dna-game-streak').textContent).toBe('0');
    expect(screen.getByTestId('dna-game-best-streak').textContent).toBe('0');
  });

  it('starts with no round-result message and no Next round button', () => {
    render(<DnaSnpGame />);

    expect(screen.getByTestId('dna-game-message').textContent).toBe('');
    expect(screen.queryByTestId('dna-game-next-round')).toBeNull();
  });

  it('renders two independent mounts identically for the fixed initial seed', () => {
    const first = render(<DnaSnpGame />);
    const firstLabels = screen
      .getAllByRole('button')
      .filter((button) => button.hasAttribute('aria-label'))
      .map((button) => button.getAttribute('aria-label'));
    first.unmount();

    render(<DnaSnpGame />);
    const secondLabels = screen
      .getAllByRole('button')
      .filter((button) => button.hasAttribute('aria-label'))
      .map((button) => button.getAttribute('aria-label'));

    expect(secondLabels).toEqual(firstLabels);
  });
});

describe('DnaSnpGame — correct guess', () => {
  it('increments score and streak, shows the correct feedback message, and disables the strand', () => {
    render(<DnaSnpGame />);

    const correctBase = firstRound.sample[firstRound.snpIndex];
    const correctLabel = getTileAriaLabel(firstRound.snpIndex + 1, correctBase);
    fireEvent.click(screen.getByLabelText(correctLabel));

    expect(screen.getByTestId('dna-game-score').textContent).toBe('1');
    expect(screen.getByTestId('dna-game-streak').textContent).toBe('1');
    expect(screen.getByTestId('dna-game-best-streak').textContent).toBe('1');
    expect(screen.getByTestId('dna-game-message').textContent).toBe(
      getRoundResultMessage(
        true,
        firstRound.snpIndex,
        firstRound.sample[firstRound.snpIndex],
        firstRound.reference[firstRound.snpIndex],
        firstRound.substitutionKind
      ),
    );

    // Every tile is disabled once a round has resolved.
    const sampleButtons = screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-label'));
    for (const button of sampleButtons) {
      expect(button.hasAttribute('disabled')).toBe(true);
    }
  });

  it('ignores further clicks once a guess has resolved the round', () => {
    render(<DnaSnpGame />);

    const correctBase = firstRound.sample[firstRound.snpIndex];
    const correctLabel = getTileAriaLabel(firstRound.snpIndex + 1, correctBase);
    const button = screen.getByLabelText(correctLabel);

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Score should still read exactly 1 — a disabled button click is a no-op.
    expect(screen.getByTestId('dna-game-score').textContent).toBe('1');
  });

  it('auto-advances to a fresh round after ROUND_ADVANCE_DELAY_MS', async () => {
    vi.useFakeTimers();
    render(<DnaSnpGame />);

    const correctBase = firstRound.sample[firstRound.snpIndex];
    const correctLabel = getTileAriaLabel(firstRound.snpIndex + 1, correctBase);
    fireEvent.click(screen.getByLabelText(correctLabel));

    expect(screen.getByTestId('dna-game-message').textContent).not.toBe('');

    await act(async () => {
      vi.advanceTimersByTime(ROUND_ADVANCE_DELAY_MS);
    });

    // The round reset: message clears and the strand is guessable again.
    expect(screen.getByTestId('dna-game-message').textContent).toBe('');
    const sampleButtons = screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-label'));
    for (const button of sampleButtons) {
      expect(button.hasAttribute('disabled')).toBe(false);
    }
  });

  it('lets the player skip the auto-advance wait via the Next round button', () => {
    render(<DnaSnpGame />);

    const correctBase = firstRound.sample[firstRound.snpIndex];
    const correctLabel = getTileAriaLabel(firstRound.snpIndex + 1, correctBase);
    fireEvent.click(screen.getByLabelText(correctLabel));

    const nextButton = screen.getByTestId('dna-game-next-round');
    fireEvent.click(nextButton);

    expect(screen.getByTestId('dna-game-message').textContent).toBe('');
    expect(screen.queryByTestId('dna-game-next-round')).toBeNull();
  });
});

describe('DnaSnpGame — incorrect guess', () => {
  it('shows the correct-position feedback, resets streak, and never decrements score', () => {
    render(<DnaSnpGame />);

    // First bank a correct guess so streak/score are non-zero.
    const correctBase = firstRound.sample[firstRound.snpIndex];
    fireEvent.click(screen.getByLabelText(getTileAriaLabel(firstRound.snpIndex + 1, correctBase)));
    expect(screen.getByTestId('dna-game-streak').textContent).toBe('1');

    // Advancing to the next round seeds off Date.now() — pin it so the new
    // round (and its SNP position) is computable and deterministic here too.
    const fixedNow = 999999;
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
    fireEvent.click(screen.getByTestId('dna-game-next-round'));
    nowSpy.mockRestore();

    const secondRound = generateRound(fixedNow, STRAND_LENGTH);
    const wrongIndex = (secondRound.snpIndex + 1) % STRAND_LENGTH;
    const wrongLabel = getTileAriaLabel(wrongIndex + 1, secondRound.sample[wrongIndex]);

    const scoreBefore = screen.getByTestId('dna-game-score').textContent;
    fireEvent.click(screen.getByLabelText(wrongLabel));

    expect(screen.getByTestId('dna-game-streak').textContent).toBe('0');
    expect(screen.getByTestId('dna-game-best-streak').textContent).toBe('1');
    expect(screen.getByTestId('dna-game-score').textContent).toBe(scoreBefore);
    expect(screen.getByTestId('dna-game-message').textContent?.startsWith('Not quite')).toBe(true);
  });

  it('requires an explicit Next round click to advance after a miss (no auto-advance)', async () => {
    vi.useFakeTimers();
    render(<DnaSnpGame />);

    // The first round's SNP is at firstRound.snpIndex — click any other tile to miss.
    const wrongIndex = (firstRound.snpIndex + 1) % STRAND_LENGTH;
    const wrongLabel = getTileAriaLabel(wrongIndex + 1, firstRound.sample[wrongIndex]);
    fireEvent.click(screen.getByLabelText(wrongLabel));

    const messageAfterMiss = screen.getByTestId('dna-game-message').textContent;
    expect(messageAfterMiss?.startsWith('Not quite')).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(ROUND_ADVANCE_DELAY_MS * 5);
    });

    // Still showing the same miss feedback — no auto-advance timer fires on a miss.
    expect(screen.getByTestId('dna-game-message').textContent).toBe(messageAfterMiss);
    expect(screen.getByTestId('dna-game-next-round')).not.toBeNull();
  });
});

describe('DnaSnpGame — accessibility basics', () => {
  it('every sample tile has a descriptive aria-label naming its position and base', () => {
    render(<DnaSnpGame />);

    firstRound.sample.forEach((base, index) => {
      const button = screen.getByLabelText(getTileAriaLabel(index + 1, base));
      expect(button.tagName).toBe('BUTTON');
    });
  });

  it('surfaces the round result through a polite status live region', () => {
    render(<DnaSnpGame />);

    const message = screen.getByTestId('dna-game-message');
    expect(message.getAttribute('role')).toBe('status');
    expect(message.getAttribute('aria-live')).toBe('polite');
  });

  it('the Next round button has an explicit type to satisfy the WCAG button-type contract', () => {
    render(<DnaSnpGame />);
    const correctBase = firstRound.sample[firstRound.snpIndex];
    fireEvent.click(screen.getByLabelText(getTileAriaLabel(firstRound.snpIndex + 1, correctBase)));

    expect(screen.getByTestId('dna-game-next-round').getAttribute('type')).toBe('button');
  });
});
