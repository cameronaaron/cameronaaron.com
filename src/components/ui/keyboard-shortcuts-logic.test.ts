import { describe, expect, it } from 'vitest';
import {
  buildShortcutJumpMap,
  isEditableTarget,
  shouldIgnoreShortcutEvent,
} from '@/components/ui/keyboard-shortcuts-logic';

describe('keyboard shortcuts logic', () => {
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
