import { describe, expect, it } from 'vitest';
import {
  SHORTCUTS,
  buildShortcutJumpMap,
  isEditableTarget,
  processKeySequence,
  shouldIgnoreShortcutEvent,
  type KeySequenceState,
} from '@/components/ui/keyboard-shortcuts-logic';

describe('keyboard shortcuts logic', () => {
  it('pins the exact documented shortcut catalog (keys, labels, and jump targets)', () => {
    // These strings drive real runtime behavior via buildShortcutJumpMap
    // (which key sequence maps to which DOM section id) — not decorative
    // copy — so pin every entry exactly, not just the array length.
    expect(SHORTCUTS).toEqual([
      { keys: ['?'], label: 'Open or close this shortcut overlay' },
      { keys: ['Esc'], label: 'Close any open overlay or menu' },
      { keys: ['g', 'h'], label: 'Jump to Home', targetId: 'home' },
      { keys: ['g', 'c'], label: 'Jump to Credentials', targetId: 'certifications' },
      { keys: ['g', 'e'], label: 'Jump to Experience', targetId: 'experience' },
      { keys: ['g', 'd'], label: 'Jump to Education', targetId: 'education' },
      { keys: ['g', 'r'], label: 'Jump to Research', targetId: 'projects' },
      { keys: ['g', 's'], label: 'Jump to Skills', targetId: 'skills' },
      { keys: ['g', 't'], label: 'Jump to Testimonials', targetId: 'testimonials' },
      { keys: ['g', 'm'], label: 'Jump to Contact (message me)', targetId: 'contact' },
    ]);
  });

  it('builds jump map for g-prefixed target shortcuts', () => {
    const map = buildShortcutJumpMap([
      { keys: ['g', 'h'], targetId: 'home' },
      { keys: ['g', 'e'], targetId: 'experience' },
      { keys: ['?'] },
    ]);

    expect(map).toEqual({ h: 'home', e: 'experience' });
  });

  it('detects editable event targets', () => {
    const input = document.createElement('input');
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');

    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(div)).toBe(true);
    expect(isEditableTarget(document.createElement('button'))).toBe(false);
  });

  it('does not treat a key as the second half of a "g" sequence when no "g" was pressed first', () => {
    // A mutant that replaces `state.leader === 'g'` with `true` would treat
    // ANY leftover state (even leader: null, or a stale non-'g' leader) as if
    // a "g" sequence were active, as long as the timer hasn't expired — wiring
    // an unrelated keystroke straight to a jump target.
    const state: KeySequenceState = { leader: null, expires: Date.now() + 10_000 };
    const jumpMap = { h: 'home' };
    const { action, nextState } = processKeySequence(state, 'h', jumpMap, Date.now());
    expect(action).toEqual({ kind: 'none' });
    expect(nextState).toBe(state); // unchanged — 'h' alone starts no sequence
  });

  it('ignores keyboard events that are prevented, modified, or editable-target based', () => {
    const prevented = new KeyboardEvent('keydown', { key: '?', cancelable: true });
    prevented.preventDefault();

    const modified = new KeyboardEvent('keydown', { key: '?', metaKey: true });

    const input = document.createElement('input');
    const editableEvent = new KeyboardEvent('keydown', { key: '?' });
    Object.defineProperty(editableEvent, 'target', { configurable: true, value: input });

    expect(shouldIgnoreShortcutEvent(prevented)).toBe(true);
    expect(shouldIgnoreShortcutEvent(modified)).toBe(true);
    expect(shouldIgnoreShortcutEvent(editableEvent)).toBe(true);
  });
});
