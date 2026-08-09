import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ApplicationStatusBadge from './ApplicationStatusBadge';
import { WINDOW_STATUS_STYLES, type ActiveWindow } from './window-logic';

function makeActiveWindow(status: ActiveWindow['status']): ActiveWindow {
  return {
    status,
    window: { term: 'Spring 2027', opens: '2026-01-01', closes: '2027-01-01' },
  };
}

describe('ApplicationStatusBadge', () => {
  it('renders a fallback badge when there is no active window', () => {
    render(<ApplicationStatusBadge activeWindow={null} />);
    expect(screen.getByText(/No application window on file/)).toBeTruthy();
  });

  it('renders the status label and term for an open window, with no ping indicator', () => {
    render(<ApplicationStatusBadge activeWindow={makeActiveWindow('open')} />);
    const badge = screen.getByTestId('application-status-badge');

    expect(badge.getAttribute('data-status')).toBe('open');
    expect(badge.textContent).toContain(WINDOW_STATUS_STYLES.open.label);
    expect(badge.textContent).toContain('Spring 2027');
    expect(badge.querySelector('.animate-ping')).toBeNull();
  });

  it('renders the pulsing ping indicator only for a closing-soon window', () => {
    render(<ApplicationStatusBadge activeWindow={makeActiveWindow('closing-soon')} />);
    const badge = screen.getByTestId('application-status-badge');

    expect(badge.getAttribute('data-status')).toBe('closing-soon');
    expect(badge.querySelector('.animate-ping')).toBeTruthy();
  });
});
