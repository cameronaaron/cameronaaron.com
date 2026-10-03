import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomesteadOutboxGame from './HomesteadOutboxGame';

describe('HomesteadOutboxGame', () => {
  it('starts with an empty outbox, the clock at zero and nothing to wait for', () => {
    render(<HomesteadOutboxGame />);
    expect(screen.getByTestId('ho-clock').textContent).toBe('T+0 s');
    expect(screen.getByTestId('ho-outbox').textContent).toContain('The outbox is empty.');
    expect((screen.getByTestId('ho-wait') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId('ho-settle') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('ho-discord-up').getAttribute('aria-pressed')).toBe('true');
  });

  it('a harvest goes to Discord and Buffer and lands at once', () => {
    render(<HomesteadOutboxGame />);
    fireEvent.click(screen.getByTestId('ho-log-harvest'));
    expect(screen.getByTestId('ho-delivery-1-discord').getAttribute('data-status')).toBe('delivered');
    expect(screen.getByTestId('ho-delivery-1-buffer').textContent).toContain('Delivered');
    expect(screen.queryByTestId('ho-delivery-1-linear')).toBeNull();
  });

  it('an outage backs off, then dead-letters, and Retry brings it home', () => {
    render(<HomesteadOutboxGame />);
    fireEvent.click(screen.getByTestId('ho-discord-outage'));
    fireEvent.click(screen.getByTestId('ho-log-task'));
    const chip = () => screen.getByTestId('ho-delivery-1-discord');
    expect(chip().textContent).toContain('Attempt 2 in 5 s');
    expect(chip().textContent).toContain('503 from Discord');

    fireEvent.click(screen.getByTestId('ho-wait'));
    expect(screen.getByTestId('ho-clock').textContent).toBe('T+5 s');
    expect(chip().textContent).toContain('Attempt 3 in 10 s');

    fireEvent.click(screen.getByTestId('ho-settle'));
    expect(chip().getAttribute('data-status')).toBe('dead');
    expect(chip().textContent).toContain('Dead letter after 12 attempts');
    expect(screen.getByTestId('ho-clock').textContent).toBe('T+2 h 25 m');

    fireEvent.click(screen.getByTestId('ho-discord-up'));
    fireEvent.click(screen.getByTestId('ho-retry-1-discord'));
    expect(chip().getAttribute('data-status')).toBe('delivered');
  });

  it('a crash mid-delivery leaves one Linear issue with derived ids', () => {
    render(<HomesteadOutboxGame />);
    fireEvent.click(screen.getByTestId('ho-crash'));
    expect(screen.getByTestId('ho-crash').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTestId('ho-log-tracked-task'));
    expect(screen.getByTestId('ho-crash').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('ho-delivery-1-linear').textContent).toContain('lease lapses');

    fireEvent.click(screen.getByTestId('ho-wait'));
    expect(screen.getByTestId('ho-delivery-1-linear').getAttribute('data-status')).toBe('delivered');
    expect(screen.getByTestId('ho-issue-count').textContent).toBe('1');
    expect(screen.getByTestId('ho-linear-verdict').textContent).toMatch(/^No duplicates/);
  });

  it('the same crash with random ids files a duplicate', () => {
    render(<HomesteadOutboxGame />);
    fireEvent.click(screen.getByTestId('ho-scheme-random'));
    fireEvent.click(screen.getByTestId('ho-crash'));
    fireEvent.click(screen.getByTestId('ho-log-tracked-task'));
    fireEvent.click(screen.getByTestId('ho-wait'));
    expect(screen.getByTestId('ho-issue-count').textContent).toBe('2');
    expect(screen.getByTestId('ho-linear-verdict').textContent).toMatch(/^1 duplicate issue/);
  });

  it('switching back to derived ids restores the no-duplicates guarantee', () => {
    render(<HomesteadOutboxGame />);
    fireEvent.click(screen.getByTestId('ho-scheme-random'));
    expect(screen.getByTestId('ho-scheme-random').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByTestId('ho-scheme-derived'));
    expect(screen.getByTestId('ho-scheme-derived').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('ho-scheme-random').getAttribute('aria-pressed')).toBe('false');
  });

  it('disables logging once the outbox is full, and Reset empties it', () => {
    render(<HomesteadOutboxGame />);
    for (let i = 0; i < 6; i += 1) fireEvent.click(screen.getByTestId('ho-log-task'));
    expect((screen.getByTestId('ho-log-harvest') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId('ho-reset'));
    expect((screen.getByTestId('ho-log-harvest') as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByTestId('ho-outbox').textContent).toContain('The outbox is empty.');
  });

  it('keeps every control at a 44px tap target', () => {
    render(<HomesteadOutboxGame />);
    for (const id of ['ho-log-harvest', 'ho-linear-bad-key', 'ho-crash', 'ho-scheme-derived', 'ho-wait', 'ho-reset']) {
      expect(screen.getByTestId(id).className).toContain('min-h-[44px]');
    }
  });
});
