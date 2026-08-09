import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TwiceExceptionalGame from './TwiceExceptionalGame';
import { AVERAGE_COMPOSITE_MAX, AVERAGE_COMPOSITE_MIN, NOTABLE_SCATTER_THRESHOLD } from './twice-exceptional-logic';

/**
 * These tests also pin the Susan Baum strength-first framing: an earlier
 * version of this widget handed the player only composite and scatter, which
 * quietly re-taught the score-mining, deficit-first model her talent-focused
 * approach argues against. The signature strength must render, must be named
 * as the real starting point, and must appear before the two numbers in
 * document order — not as a footnote bolted on after them.
 */

/**
 * These tests exist to pin the plain-language framing a non-expert player
 * needs — bare numbers like "Composite 103" and jargon like "average band" /
 * "notable threshold" meant nothing without a scale or a definition. Every
 * assertion here checks that the scale or definition is ACTUALLY ON SCREEN,
 * not just that some score renders.
 */
describe('TwiceExceptionalGame — non-expert comprehension', () => {
  it('states the composite score’s typical range in plain numbers', () => {
    render(<TwiceExceptionalGame />);
    const text = screen.getByTestId('twice-exceptional-game').textContent ?? '';

    expect(text).toContain('like an IQ score');
    expect(text).toContain(`${AVERAGE_COMPOSITE_MIN}`);
    expect(text).toContain(`${AVERAGE_COMPOSITE_MAX}`);
  });

  it('defines scatter as a concrete comparison, not a bare technical term', () => {
    render(<TwiceExceptionalGame />);
    const text = screen.getByTestId('twice-exceptional-game').textContent ?? '';

    expect(text).toContain('gap between this student');
    expect(text).toContain('strongest and weakest subject scores');
    expect(text).toContain(`${NOTABLE_SCATTER_THRESHOLD}`);
  });

  it('tells the player in plain words whether THIS student is in the typical range', () => {
    render(<TwiceExceptionalGame />);
    const text = screen.getByTestId('twice-exceptional-game').textContent ?? '';

    expect(/This student: (within|outside) the typical range/.test(text)).toBe(true);
  });

  it('tells the player in plain words whether the scatter is unusual', () => {
    render(<TwiceExceptionalGame />);
    const text = screen.getByTestId('twice-exceptional-game').textContent ?? '';

    expect(/This student: (unusually wide gap|ordinary variation)/.test(text)).toBe(true);
  });

  it('still lets a player classify a student and see the result', () => {
    render(<TwiceExceptionalGame />);
    fireEvent.click(screen.getByTestId('te-option-gifted'));

    expect(screen.getByTestId('te-message').textContent).toMatch(/Correct\.|Missed\./);
  });

  it('renders the signature strength, in quotes, as its own callout', () => {
    render(<TwiceExceptionalGame />);
    const text = screen.getByTestId('te-strength').textContent ?? '';

    expect(text.startsWith('“')).toBe(true);
    expect(text.length).toBeGreaterThan(10);
  });

  it('names Baum and frames the strength as the real starting point, not the numbers', () => {
    render(<TwiceExceptionalGame />);
    const text = screen.getByTestId('twice-exceptional-game').textContent ?? '';

    expect(text).toContain('Susan Baum');
    expect(text).toContain('starts from the student');
    expect(text).toContain('start here');
  });

  it('tells the player when the next case falls outside the typical range and has ordinary scatter', () => {
    // Seed 1 (verified via twice-exceptional-logic.generateCase(1)) produces
    // a case with composite=79 (outside 90-110) and scatter=18 (below
    // NOTABLE_SCATTER_THRESHOLD) — the opposite branch from the fixed-seed
    // initial case, which this file's other tests already exercise.
    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(1);
    render(<TwiceExceptionalGame />);
    fireEvent.click(screen.getByTestId('te-option-gifted'));
    fireEvent.click(screen.getByTestId('te-next'));
    dateNowSpy.mockRestore();

    const text = screen.getByTestId('twice-exceptional-game').textContent ?? '';
    expect(text).toContain('This student: outside the typical range');
    expect(text).toContain('This student: ordinary variation');
  });

  it('advances to a new case and resets the result state when "Next student" is clicked', () => {
    render(<TwiceExceptionalGame />);
    fireEvent.click(screen.getByTestId('te-option-gifted'));
    expect(screen.getByTestId('te-message').textContent).toMatch(/Correct\.|Missed\./);

    fireEvent.click(screen.getByTestId('te-next'));

    expect(screen.getByTestId('te-message').textContent).toBe('');
    expect(screen.queryByTestId('te-next')).toBeNull();
  });

  it('renders the strength callout before the composite/scatter numbers in document order', () => {
    render(<TwiceExceptionalGame />);
    const container = screen.getByTestId('twice-exceptional-game');
    const strengthIndex = container.innerHTML.indexOf('data-testid="te-strength"');
    const compositeIndex = container.innerHTML.indexOf('data-testid="te-composite"');

    expect(strengthIndex).toBeGreaterThan(-1);
    expect(compositeIndex).toBeGreaterThan(-1);
    expect(strengthIndex).toBeLessThan(compositeIndex);
  });
});
