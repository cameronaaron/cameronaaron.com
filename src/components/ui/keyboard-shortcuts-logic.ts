interface JumpShortcutLike {
  keys: string[];
  targetId?: string;
}

export function buildShortcutJumpMap(shortcuts: JumpShortcutLike[]): Record<string, string> {
  return shortcuts
    .filter((shortcut) => shortcut.targetId && shortcut.keys[0] === 'g')
    .reduce((acc, shortcut) => {
      acc[shortcut.keys[1]] = shortcut.targetId!;
      return acc;
    }, {} as Record<string, string>);
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  const editable = target.getAttribute('contenteditable');
  return editable === '' || editable === 'true' || editable === 'plaintext-only';
}

export function shouldIgnoreShortcutEvent(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) return true;
  if (event.metaKey || event.ctrlKey || event.altKey) return true;
  return isEditableTarget(event.target);
}

export const SEQUENCE_TIMEOUT_MS = 1200;

export interface KeySequenceState {
  leader: string | null;
  expires: number;
}

export type KeySequenceAction = { kind: 'jump'; targetId: string } | { kind: 'none' };

export function processKeySequence(
  state: KeySequenceState,
  key: string,
  jumpMap: Record<string, string>,
  now: number
): { action: KeySequenceAction; nextState: KeySequenceState } {
  if (state.leader === 'g' && now < state.expires) {
    const targetId = jumpMap[key.toLowerCase()];
    const nextState: KeySequenceState = { leader: null, expires: 0 };
    if (targetId) {
      return { action: { kind: 'jump', targetId }, nextState };
    }
    return { action: { kind: 'none' }, nextState };
  }

  if (key === 'g') {
    return {
      action: { kind: 'none' },
      nextState: { leader: 'g', expires: now + SEQUENCE_TIMEOUT_MS },
    };
  }

  return { action: { kind: 'none' }, nextState: state };
}
