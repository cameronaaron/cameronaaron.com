import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import UdsDecoderGame from './UdsDecoderGame';

describe('UdsDecoderGame', () => {
  it('shows the first test vector as colour-coded bytes with its request', () => {
    render(<UdsDecoderGame />);
    expect(screen.getByTestId('uds-byte-0').textContent).toBe('62');
    expect(screen.getByTestId('uds-byte-0').getAttribute('data-role')).toBe('sid');
    expect(screen.getByTestId('uds-byte-1').getAttribute('data-role')).toBe('did');
    expect(screen.getByTestId('uds-byte-4').getAttribute('data-role')).toBe('data');
    expect(screen.getByTestId('uds-decoder-game').textContent).toContain('22 1E 1C');
    expect(screen.getByTestId('uds-score').textContent).toBe('0');
  });

  it('scores the correct reading and confirms it against the vector', () => {
    render(<UdsDecoderGame />);
    fireEvent.click(screen.getByTestId('uds-option-correct'));
    expect(screen.getByTestId('uds-score').textContent).toBe('1');
    expect(screen.getByTestId('uds-message').textContent).toMatch(/^Correct — 50 °C/);
    expect(screen.getByTestId('uds-option-correct').hasAttribute('disabled')).toBe(true);
  });

  it('explains a byte-order mistake and does not score it', () => {
    render(<UdsDecoderGame />);
    fireEvent.click(screen.getByTestId('uds-option-byte-order'));
    expect(screen.getByTestId('uds-score').textContent).toBe('0');
    expect(screen.getByTestId('uds-message').textContent).toContain('little-endian');
  });

  it('advances to the next vector and clears the result', () => {
    render(<UdsDecoderGame />);
    fireEvent.click(screen.getByTestId('uds-option-correct'));
    fireEvent.click(screen.getByTestId('uds-next'));
    expect(screen.getByTestId('uds-byte-1').textContent).toBe('03');
    expect(screen.getByTestId('uds-byte-2').textContent).toBe('34');
    expect(screen.getByTestId('uds-message').textContent).toBe('');
    expect(screen.queryByTestId('uds-next')).toBeNull();
  });
});
