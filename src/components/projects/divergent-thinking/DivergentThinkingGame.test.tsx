import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DivergentThinkingGame from './DivergentThinkingGame';
import { USE_OBJECTS } from './divergent-thinking-logic';

describe('DivergentThinkingGame', () => {
  it('renders the first object with a zero score and no reached categories', () => {
    render(<DivergentThinkingGame />);

    expect(screen.getByTestId('divergent-thinking-game').textContent).toContain(USE_OBJECTS[0].name);
    expect(screen.getByTestId('dt-total').textContent).toBe('0');
  });

  it('selecting a use updates the score breakdown and marks its category reached', () => {
    render(<DivergentThinkingGame />);
    const firstUse = USE_OBJECTS[0].uses[0];

    const button = screen.getByTestId(`dt-use-${firstUse.id}`);
    fireEvent.click(button);

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('dt-total').textContent).not.toBe('0');
    expect(screen.getByTestId('dt-breakdown').textContent).toContain('Fluency 1');
  });

  it('clicking a selected use again deselects it', () => {
    render(<DivergentThinkingGame />);
    const firstUse = USE_OBJECTS[0].uses[0];
    const button = screen.getByTestId(`dt-use-${firstUse.id}`);

    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('dt-total').textContent).toBe('0');
  });

  it('shows a verdict telling the player to pick uses before anything is selected', () => {
    render(<DivergentThinkingGame />);
    expect(screen.getByTestId('dt-verdict').textContent).toContain('Pick some uses');
  });

  it('"Try a different object" cycles to the next object and resets selections', () => {
    render(<DivergentThinkingGame />);
    const firstUse = USE_OBJECTS[0].uses[0];
    fireEvent.click(screen.getByTestId(`dt-use-${firstUse.id}`));
    expect(screen.getByTestId('dt-total').textContent).not.toBe('0');

    fireEvent.click(screen.getByTestId('dt-next'));

    expect(screen.getByTestId('divergent-thinking-game').textContent).toContain(USE_OBJECTS[1].name);
    expect(screen.getByTestId('dt-total').textContent).toBe('0');
  });
});
