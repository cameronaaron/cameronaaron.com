import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import KeyboardShortcuts, { SHORTCUTS } from './KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    for (const id of ['home', 'experience', 'projects', 'skills', 'contact', 'certifications', 'education', 'testimonials']) {
      const el = document.createElement('section');
      el.id = id;
      el.scrollIntoView = vi.fn();
      document.body.appendChild(el);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes a trigger button with proper ARIA wiring', () => {
    render(<KeyboardShortcuts />);
    const trigger = screen.getByTestId('keyboard-shortcuts-trigger');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('keyboard-shortcuts-dialog');
  });

  it('opens via the trigger and renders an accessible dialog', () => {
    render(<KeyboardShortcuts />);
    fireEvent.click(screen.getByTestId('keyboard-shortcuts-trigger'));
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('keyboard-shortcuts-title');
  });

  it('toggles open and closed when "?" is pressed', () => {
    render(<KeyboardShortcuts />);
    expect(screen.queryByRole('dialog')).toBeNull();

    act(() => {
      fireEvent.keyDown(window, { key: '?' });
    });
    expect(screen.getByRole('dialog')).toBeTruthy();

    act(() => {
      fireEvent.keyDown(window, { key: '?' });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens when Shift+/ is pressed (since "?" is shift+/ on most keyboards)', () => {
    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(window, { key: '/', shiftKey: true });
    });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('closes on Escape', () => {
    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(window, { key: '?' });
    });
    expect(screen.getByRole('dialog')).toBeTruthy();

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does nothing on Escape when already closed', () => {
    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('jumps to a section with the "g h" sequence', () => {
    const target = document.getElementById('home');
    const scrollSpy = vi.fn();
    target!.scrollIntoView = scrollSpy;

    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(window, { key: 'g' });
      fireEvent.keyDown(window, { key: 'h' });
    });
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('handles every documented jump shortcut', () => {
    render(<KeyboardShortcuts />);
    const jumpShortcuts = SHORTCUTS.filter((s) => s.targetId);
    for (const shortcut of jumpShortcuts) {
      const target = document.getElementById(shortcut.targetId!);
      const scrollSpy = vi.fn();
      target!.scrollIntoView = scrollSpy;

      act(() => {
        fireEvent.keyDown(window, { key: shortcut.keys[0] });
        fireEvent.keyDown(window, { key: shortcut.keys[1] });
      });
      expect(scrollSpy).toHaveBeenCalledTimes(1);
    }
  });

  it('aborts the g-sequence if the second key is unknown', () => {
    const target = document.getElementById('home');
    const scrollSpy = vi.fn();
    target!.scrollIntoView = scrollSpy;

    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(window, { key: 'g' });
      fireEvent.keyDown(window, { key: 'x' });
      fireEvent.keyDown(window, { key: 'h' });
    });
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('expires the g-sequence after 1.2 seconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const target = document.getElementById('home');
    const scrollSpy = vi.fn();
    target!.scrollIntoView = scrollSpy;

    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(window, { key: 'g' });
    });
    vi.setSystemTime(new Date('2026-01-01T00:00:02Z'));
    act(() => {
      fireEvent.keyDown(window, { key: 'h' });
    });
    expect(scrollSpy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('does nothing when the user is typing in an input', () => {
    const target = document.getElementById('home');
    const scrollSpy = vi.fn();
    target!.scrollIntoView = scrollSpy;

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(input, { key: '?' });
      fireEvent.keyDown(input, { key: 'g' });
      fireEvent.keyDown(input, { key: 'h' });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('ignores shortcuts pressed in contentEditable surfaces', () => {
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    document.body.appendChild(editable);

    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(editable, { key: '?' });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ignores shortcuts pressed in textarea and select elements', () => {
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    document.body.append(textarea, select);

    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(textarea, { key: '?' });
      fireEvent.keyDown(select, { key: '?' });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ignores keys when a modifier is held', () => {
    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(window, { key: '?', metaKey: true });
      fireEvent.keyDown(window, { key: '?', ctrlKey: true });
      fireEvent.keyDown(window, { key: '?', altKey: true });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ignores events whose default has already been prevented', () => {
    render(<KeyboardShortcuts />);
    act(() => {
      const event = new KeyboardEvent('keydown', { key: '?', cancelable: true });
      event.preventDefault();
      window.dispatchEvent(event);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes when clicking the backdrop and stays open when clicking the dialog', () => {
    render(<KeyboardShortcuts />);
    fireEvent.click(screen.getByTestId('keyboard-shortcuts-trigger'));
    fireEvent.click(screen.getByTestId('keyboard-shortcuts-dialog'));
    expect(screen.queryByRole('dialog')).toBeTruthy();

    fireEvent.click(screen.getByTestId('keyboard-shortcuts-backdrop'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes when the Close button is clicked', () => {
    render(<KeyboardShortcuts />);
    fireEvent.click(screen.getByTestId('keyboard-shortcuts-trigger'));
    fireEvent.click(screen.getByTestId('keyboard-shortcuts-close'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('moves focus to the Close button when the dialog opens', () => {
    render(<KeyboardShortcuts />);
    fireEvent.click(screen.getByTestId('keyboard-shortcuts-trigger'));
    expect(document.activeElement).toBe(screen.getByTestId('keyboard-shortcuts-close'));
  });

  it('is a no-op when the jump target does not exist in the DOM', () => {
    document.getElementById('home')?.remove();
    render(<KeyboardShortcuts />);
    expect(() => {
      act(() => {
        fireEvent.keyDown(window, { key: 'g' });
        fireEvent.keyDown(window, { key: 'h' });
      });
    }).not.toThrow();
  });

  it('honours prefers-reduced-motion for the jump animation', async () => {
    const target = document.getElementById('skills');
    const scrollSpy = vi.fn();
    target!.scrollIntoView = scrollSpy;

    const fm = await import('framer-motion');
    const spy = vi.spyOn(fm, 'useReducedMotion').mockReturnValue(true);

    render(<KeyboardShortcuts />);
    act(() => {
      fireEvent.keyDown(window, { key: 'g' });
      fireEvent.keyDown(window, { key: 's' });
    });
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });

    spy.mockRestore();
  });

  it('removes its keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<KeyboardShortcuts />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('lists all documented shortcuts in the dialog body', () => {
    render(<KeyboardShortcuts />);
    fireEvent.click(screen.getByTestId('keyboard-shortcuts-trigger'));
    for (const shortcut of SHORTCUTS) {
      expect(screen.getByText(shortcut.label)).toBeTruthy();
    }
  });
});
