import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SmallWorldGame from './SmallWorldGame';

describe('SmallWorldGame', () => {
  it('starts at Ana with Pia as the target and offers Ana’s links', () => {
    render(<SmallWorldGame />);
    expect(screen.getByTestId('small-world-goal').textContent).toContain('Ana');
    expect(screen.getByTestId('small-world-goal').textContent).toContain('Pia');
    expect(screen.getByTestId('small-world-choose-1')).toBeTruthy();
    expect(screen.getByTestId('small-world-choose-4')).toBeTruthy();
    expect(screen.getByTestId('small-world-person-0').getAttribute('data-on-chain')).toBe('true');
  });

  it('scores an optimal chain and explains how much it leaned on one-way links', () => {
    render(<SmallWorldGame />);
    fireEvent.click(screen.getByTestId('small-world-choose-4'));
    fireEvent.click(screen.getByTestId('small-world-choose-14'));
    fireEvent.click(screen.getByTestId('small-world-choose-15'));
    expect(screen.getByTestId('small-world-result').textContent).toBe('3 hops — as short as BFS finds.');
    expect(screen.getByTestId('small-world-note').textContent).toContain('confirmed mutual links only it is 7');
    expect(screen.queryByTestId('small-world-choices')).toBeNull();
  });

  it('hides one-way links when only confirmed mutual links count', () => {
    render(<SmallWorldGame />);
    fireEvent.click(screen.getByTestId('small-world-mutual'));
    expect(screen.getByTestId('small-world-mutual').getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByTestId('small-world-choose-4')).toBeNull();
    expect(screen.getByTestId('small-world-choose-2')).toBeTruthy();
  });

  it('undoes a step and moves on to the next pair', () => {
    render(<SmallWorldGame />);
    fireEvent.click(screen.getByTestId('small-world-choose-1'));
    expect(screen.getByTestId('small-world-result').textContent).toBe('1 hop so far.');
    fireEvent.click(screen.getByTestId('small-world-undo'));
    expect(screen.getByTestId('small-world-result').textContent).toBe('0 hops so far.');
    for (const person of [4, 14, 15]) fireEvent.click(screen.getByTestId(`small-world-choose-${person}`));
    fireEvent.click(screen.getByTestId('small-world-next'));
    expect(screen.getByTestId('small-world-goal').textContent).toContain('Gia');
  });

  it('says so when the chain walks into a dead end, and undo gets out of it', () => {
    render(<SmallWorldGame />);
    for (const person of [1, 2, 3, 5, 6, 8, 9, 7]) fireEvent.click(screen.getByTestId(`small-world-choose-${person}`));
    expect(screen.getByTestId('small-world-choices').textContent).toBe('Dead end — undo a step.');

    fireEvent.click(screen.getByTestId('small-world-undo'));
    expect(screen.queryByText('Dead end — undo a step.')).toBeNull();
    expect(screen.getByTestId('small-world-choose-7')).toBeTruthy();
  });
});
