import { describe, expect, it } from 'vitest';
import {
  buildShortcutJumpMap,
  isEditableTarget,
  processKeySequence,
  SEQUENCE_TIMEOUT_MS,
  shouldIgnoreShortcutEvent,
} from '@/components/ui/keyboard-shortcuts-logic';

describe('keyboard-shortcuts-logic — coverage hardening', () => {
  // ─── buildShortcutJumpMap ────────────────────────────────────────────────

  describe('buildShortcutJumpMap', () => {
    it('returns empty map for empty array', () => {
      expect(buildShortcutJumpMap([])).toEqual({});
    });

    it('excludes shortcuts that have no targetId', () => {
      const map = buildShortcutJumpMap([{ keys: ['g', 'x'] }]);
      expect(map).toEqual({});
    });

    it('excludes shortcuts whose first key is not "g"', () => {
      const map = buildShortcutJumpMap([{ keys: ['?'], targetId: 'home' }]);
      expect(map).toEqual({});
    });

    it('includes only shortcuts with first key "g" and a targetId', () => {
      const map = buildShortcutJumpMap([
        { keys: ['g', 'h'], targetId: 'home' },
        { keys: ['g', 'e'], targetId: 'experience' },
        { keys: ['?'], targetId: 'nope' },
        { keys: ['g', 'z'] }, // no targetId
      ]);
      expect(map).toEqual({ h: 'home', e: 'experience' });
    });
  });

  // ─── isEditableTarget ────────────────────────────────────────────────────

  describe('isEditableTarget', () => {
    it('returns false for null', () => {
      expect(isEditableTarget(null)).toBe(false);
    });

    it('returns false for a non-HTMLElement EventTarget', () => {
      const nonElement = new EventTarget();
      expect(isEditableTarget(nonElement)).toBe(false);
    });

    it('returns true for TEXTAREA element', () => {
      const textarea = document.createElement('textarea');
      expect(isEditableTarget(textarea)).toBe(true);
    });

    it('returns true for SELECT element', () => {
      const select = document.createElement('select');
      expect(isEditableTarget(select)).toBe(true);
    });

    it('returns true for INPUT element', () => {
      const input = document.createElement('input');
      expect(isEditableTarget(input)).toBe(true);
    });

    it('returns true for element with isContentEditable true (via property override)', () => {
      // jsdom does not implement isContentEditable, so we override the property
      const div = document.createElement('div');
      Object.defineProperty(div, 'isContentEditable', { configurable: true, get: () => true });
      expect(isEditableTarget(div)).toBe(true);
    });

    it('returns true for element with contenteditable="true" (via getAttribute branch)', () => {
      // In jsdom isContentEditable is undefined/falsy, so getAttribute branch fires
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      expect(isEditableTarget(div)).toBe(true);
    });

    it('returns true for element with contenteditable="" (empty string)', () => {
      const div = document.createElement('div');
      div.setAttribute('contenteditable', '');
      expect(isEditableTarget(div)).toBe(true);
    });

    it('returns true for element with contenteditable="plaintext-only"', () => {
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'plaintext-only');
      expect(isEditableTarget(div)).toBe(true);
    });

    it('returns false for a regular div with no contenteditable', () => {
      const div = document.createElement('div');
      expect(isEditableTarget(div)).toBe(false);
    });

    it('returns false for element with contenteditable="false"', () => {
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'false');
      expect(isEditableTarget(div)).toBe(false);
    });
  });

  // ─── shouldIgnoreShortcutEvent ───────────────────────────────────────────

  describe('shouldIgnoreShortcutEvent', () => {
    it('returns true when event.defaultPrevented', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
      event.preventDefault();
      expect(shouldIgnoreShortcutEvent(event)).toBe(true);
    });

    it('returns true when metaKey is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', metaKey: true });
      expect(shouldIgnoreShortcutEvent(event)).toBe(true);
    });

    it('returns true when ctrlKey is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      expect(shouldIgnoreShortcutEvent(event)).toBe(true);
    });

    it('returns true when altKey is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', altKey: true });
      expect(shouldIgnoreShortcutEvent(event)).toBe(true);
    });

    it('returns true when target is an editable element', () => {
      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', { key: 'a' });
      Object.defineProperty(event, 'target', { configurable: true, value: input });
      expect(shouldIgnoreShortcutEvent(event)).toBe(true);
    });

    it('returns false for a normal key event on a non-editable element', () => {
      const button = document.createElement('button');
      const event = new KeyboardEvent('keydown', { key: 'g' });
      Object.defineProperty(event, 'target', { configurable: true, value: button });
      expect(shouldIgnoreShortcutEvent(event)).toBe(false);
    });

    it('returns false when target is null', () => {
      const event = new KeyboardEvent('keydown', { key: 'g' });
      // default target for a detached event is null
      expect(shouldIgnoreShortcutEvent(event)).toBe(false);
    });
  });

  // ─── processKeySequence ──────────────────────────────────────────────────

  describe('processKeySequence', () => {
    const jumpMap = { h: 'home', e: 'experience', d: 'education' };
    const idle = { leader: null, expires: 0 };

    it('starts a leader sequence when g is pressed', () => {
      const { action, nextState } = processKeySequence(idle, 'g', jumpMap, 1000);
      expect(action.kind).toBe('none');
      expect(nextState.leader).toBe('g');
      expect(nextState.expires).toBe(1000 + SEQUENCE_TIMEOUT_MS);
    });

    it('resolves a jump when the second key is in the map and sequence is active', () => {
      const active = { leader: 'g', expires: 2000 };
      const { action, nextState } = processKeySequence(active, 'h', jumpMap, 1500);
      expect(action).toEqual({ kind: 'jump', targetId: 'home' });
      expect(nextState).toEqual({ leader: null, expires: 0 });
    });

    it('resolves no-op and clears state when second key is not in the map', () => {
      const active = { leader: 'g', expires: 2000 };
      const { action, nextState } = processKeySequence(active, 'z', jumpMap, 1500);
      expect(action.kind).toBe('none');
      expect(nextState).toEqual({ leader: null, expires: 0 });
    });

    it('ignores the sequence when it has expired', () => {
      const expired = { leader: 'g', expires: 1000 };
      const { action, nextState } = processKeySequence(expired, 'h', jumpMap, 2500);
      // 'h' is not a leader key, so state is unchanged and no jump occurs
      expect(action.kind).toBe('none');
      expect(nextState).toEqual(expired);
    });

    it('is case-insensitive for the second key', () => {
      const active = { leader: 'g', expires: 2000 };
      const { action } = processKeySequence(active, 'H', jumpMap, 1500);
      expect(action).toEqual({ kind: 'jump', targetId: 'home' });
    });

    it('accepts a jump exactly at the boundary (now === expires - 1)', () => {
      const active = { leader: 'g', expires: 2000 };
      const { action } = processKeySequence(active, 'e', jumpMap, 1999);
      expect(action).toEqual({ kind: 'jump', targetId: 'experience' });
    });

    it('rejects a jump exactly at expiry (now === expires)', () => {
      const active = { leader: 'g', expires: 2000 };
      const { action } = processKeySequence(active, 'e', jumpMap, 2000);
      expect(action.kind).toBe('none');
    });

    it('returns no-op for arbitrary non-leader keys with idle state', () => {
      const { action, nextState } = processKeySequence(idle, 'x', jumpMap, 1000);
      expect(action.kind).toBe('none');
      expect(nextState).toEqual(idle);
    });
  });
});
