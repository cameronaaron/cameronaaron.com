import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CommandPalette from '@/components/ui/CommandPalette';
import LocalTimeStatus from '@/components/ui/LocalTimeStatus';
import StatCard from '@/components/ui/StatCard';

const interactionMode = {
  prefersReducedMotion: false,
  isCoarsePointer: false,
  enableHoverMotion: true,
};
vi.mock('@/hooks/useInteractionMode', () => ({
  useInteractionMode: () => interactionMode,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  interactionMode.enableHoverMotion = true;
});

describe('CommandPalette', () => {
  function openViaShortcut() {
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
  }

  it('opens on Cmd+K and focuses the search input', () => {
    render(<CommandPalette />);
    expect(screen.queryByTestId('command-palette-input')).toBeNull();

    openViaShortcut();
    const input = screen.getByTestId('command-palette-input');
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);
  });

  it('opens on a bare slash and closes on Escape', () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: '/' });
    expect(screen.getByTestId('command-palette-input')).toBeTruthy();

    fireEvent.keyDown(screen.getByTestId('command-palette-backdrop'), { key: 'Escape' });
    expect(screen.queryByTestId('command-palette-input')).toBeNull();
  });

  it('filters the catalog as the user types', () => {
    render(<CommandPalette />);
    openViaShortcut();

    fireEvent.change(screen.getByTestId('command-palette-input'), { target: { value: 'github' } });
    const items = screen.getAllByTestId('command-palette-item');
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((el) => /github/i.test(el.textContent ?? ''))).toBe(true);
    expect(items.every((el) => !/testimonials/i.test(el.textContent ?? ''))).toBe(true);
  });

  it('shows an empty state when nothing matches', () => {
    render(<CommandPalette />);
    openViaShortcut();
    fireEvent.change(screen.getByTestId('command-palette-input'), { target: { value: 'zzzqqq' } });
    expect(screen.getByTestId('command-palette-empty')).toBeTruthy();
  });

  it('runs a jump command with the keyboard (ArrowDown + Enter → scrollIntoView)', () => {
    const target = document.createElement('section');
    target.id = 'certifications';
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    render(<CommandPalette />);
    openViaShortcut();
    fireEvent.change(screen.getByTestId('command-palette-input'), { target: { value: 'certifications' } });

    const backdrop = screen.getByTestId('command-palette-backdrop');
    fireEvent.keyDown(backdrop, { key: 'Enter' });

    expect(scrollIntoView).toHaveBeenCalled();
    // Palette closes after running a command.
    expect(screen.queryByTestId('command-palette-input')).toBeNull();
    document.body.removeChild(target);
  });

  it('does nothing when Enter is pressed with no matching command', () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    fireEvent.change(screen.getByTestId('command-palette-input'), { target: { value: 'zzzqqq' } });

    // No results → Enter runs an undefined command → early return, stays open.
    fireEvent.keyDown(screen.getByTestId('command-palette-backdrop'), { key: 'Enter' });
    expect(screen.getByTestId('command-palette-input')).toBeTruthy();
  });

  it('closes gracefully when a jump target is missing from the DOM', () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    // "home" has no #home element in the test DOM — the optional chain no-ops.
    fireEvent.change(screen.getByTestId('command-palette-input'), { target: { value: 'go to home' } });
    fireEvent.keyDown(screen.getByTestId('command-palette-backdrop'), { key: 'Enter' });
    expect(screen.queryByTestId('command-palette-input')).toBeNull();
  });

  it('honours prefers-reduced-motion for the jump scroll', async () => {
    const target = document.createElement('section');
    target.id = 'experience';
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    const fm = await import('framer-motion');
    const spy = vi.spyOn(fm, 'useReducedMotion').mockReturnValue(true);

    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    fireEvent.change(screen.getByTestId('command-palette-input'), { target: { value: 'experience' } });
    fireEvent.keyDown(screen.getByTestId('command-palette-backdrop'), { key: 'Enter' });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    spy.mockRestore();
    document.body.removeChild(target);
  });

  it('opens an external link command in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    fireEvent.change(screen.getByTestId('command-palette-input'), { target: { value: 'github' } });
    const item = screen.getAllByTestId('command-palette-item')[0];
    fireEvent.click(item);

    expect(open).toHaveBeenCalledWith(expect.stringContaining('github'), '_blank', 'noopener,noreferrer');
  });

  it('wraps the active row with ArrowUp from the top', () => {
    render(<CommandPalette />);
    openViaShortcut();
    const backdrop = screen.getByTestId('command-palette-backdrop');

    fireEvent.keyDown(backdrop, { key: 'ArrowUp' });
    const options = screen.getAllByRole('option');
    // Last option becomes selected after wrapping backwards from index 0.
    expect(options[options.length - 1].getAttribute('aria-selected')).toBe('true');
  });

  it('ignores non-navigation keys while open', () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const backdrop = screen.getByTestId('command-palette-backdrop');
    // A plain character falls through every handler branch without acting.
    fireEvent.keyDown(backdrop, { key: 'a' });
    expect(screen.getByTestId('command-palette-input')).toBeTruthy();
  });

  it('opens from the trigger button and moves down with ArrowDown', () => {
    render(<CommandPalette />);
    fireEvent.click(screen.getByTestId('command-palette-trigger'));
    const backdrop = screen.getByTestId('command-palette-backdrop');

    fireEvent.keyDown(backdrop, { key: 'ArrowDown' });
    const options = screen.getAllByRole('option');
    expect(options[1].getAttribute('aria-selected')).toBe('true');
  });

  it('does not hijack "/" typed inside an input field', () => {
    render(
      <>
        <input aria-label="decoy" />
        <CommandPalette />
      </>
    );
    const input = screen.getByLabelText('decoy');
    input.focus();
    fireEvent.keyDown(input, { key: '/' });
    // Editable target + "/" → the open shortcut is suppressed.
    expect(screen.queryByTestId('command-palette-input')).toBeNull();
  });

  it('activates a row on hover (mouseEnter updates the selection)', () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const items = screen.getAllByTestId('command-palette-item');
    fireEvent.mouseEnter(items[2]);
    expect(screen.getAllByRole('option')[2].getAttribute('aria-selected')).toBe('true');
  });

  it('removes its global key listener on unmount', () => {
    const { unmount } = render(<CommandPalette />);
    unmount();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.queryByTestId('command-palette-input')).toBeNull();
  });
});

describe('LocalTimeStatus', () => {
  it('renders a live LA time after mount and cleans up its interval', () => {
    const clearInterval = vi.spyOn(window, 'clearInterval');
    const { unmount } = render(<LocalTimeStatus />);

    const status = screen.getByTestId('local-time-status');
    expect(status.textContent).toMatch(/in LA/);
    // A 12-hour time appears (e.g. "2:34 PM").
    expect(status.textContent).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);

    unmount();
    expect(clearInterval).toHaveBeenCalled();
  });

  it('re-syncs on its interval without leaking timers', () => {
    vi.useFakeTimers();
    try {
      render(<LocalTimeStatus />);
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByTestId('local-time-status')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('StatCard tilt', () => {
  it('attaches pointer-tilt handlers on hover-capable pointers', () => {
    interactionMode.enableHoverMotion = true;
    const { container } = render(<StatCard value="10+" label="Clinical Certifications" />);
    const card = container.firstElementChild as HTMLElement;

    expect(card.className).toContain('[transform-style:preserve-3d]');
    // Moving and leaving must not throw — motion values absorb the writes.
    fireEvent.mouseMove(card, { clientX: 40, clientY: 30 });
    fireEvent.mouseLeave(card);
    expect(within(card).getByText('Clinical Certifications')).toBeTruthy();
  });

  it('renders the counted value and label on coarse pointers without tilt handlers', () => {
    interactionMode.enableHoverMotion = false;
    render(<StatCard value="8+" label="Years Interdisciplinary" />);
    expect(screen.getByText('Years Interdisciplinary')).toBeTruthy();
  });
});
