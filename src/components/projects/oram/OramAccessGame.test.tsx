import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import OramAccessGame from './OramAccessGame';
import { createGame, isOnPath } from './oram-access-logic';

describe('OramAccessGame', () => {
  it('opens in ORAM mode with exactly one root-to-leaf path lit', () => {
    render(<OramAccessGame />);
    const game = createGame();
    if (game.observation.mode !== 'oram') throw new Error('fixture: expected ORAM mode');
    const lit = screen.getAllByTestId(/^oram-node-/).filter((n) => n.getAttribute('data-touched') === 'true');
    expect(lit).toHaveLength(4);
    for (const node of lit) {
      const id = Number(node.getAttribute('data-testid')!.replace('oram-node-', ''));
      expect(isOnPath(id, game.observation.leaf)).toBe(true);
    }
    expect(screen.getByTestId('oram-mode-oram').getAttribute('aria-pressed')).toBe('true');
  });

  it('plain storage gives the reader away', () => {
    render(<OramAccessGame />);
    fireEvent.click(screen.getByTestId('oram-mode-plain'));
    const lit = screen.getAllByTestId(/^oram-slot-/).filter((n) => n.getAttribute('data-touched') === 'true');
    expect(lit).toHaveLength(1);
    const slot = Number(lit[0].getAttribute('data-testid')!.replace('oram-slot-', ''));
    fireEvent.click(screen.getByTestId(`oram-guess-${slot}`));
    expect(screen.getByTestId('oram-result').textContent).toMatch(/^Right/);
    expect(screen.getByTestId('oram-accuracy-plain').textContent).toBe('1/1 right (100%)');
  });

  it('records a guess once, then offers the next read', () => {
    render(<OramAccessGame />);
    fireEvent.click(screen.getByTestId('oram-guess-0'));
    expect(screen.getByTestId('oram-accuracy-oram').textContent).toMatch(/^\d\/1 right/);
    expect(screen.getByTestId('oram-guess-1').hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByTestId('oram-next'));
    expect(screen.getByTestId('oram-result').textContent).toBe('');
    expect(screen.queryByTestId('oram-next')).toBeNull();
  });
});
