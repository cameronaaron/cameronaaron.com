'use client';

import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildShortcutJumpMap,
  processKeySequence,
  shouldIgnoreShortcutEvent,
  SHORTCUTS,
  type KeySequenceState,
} from '@/components/ui/keyboard-shortcuts-logic';

const JUMP_MAP: Record<string, string> = buildShortcutJumpMap(SHORTCUTS);

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const sequenceRef = useRef<KeySequenceState>({ leader: null, expires: 0 });
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  const jumpTo = useCallback(
    (targetId: string) => {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      if (typeof history !== 'undefined' && history.replaceState) {
        history.replaceState(null, '', `#${targetId}`);
      }
    },
    [prefersReducedMotion]
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (shouldIgnoreShortcutEvent(event)) return;

      if (event.key === 'Escape') {
        if (open) {
          event.preventDefault();
          close();
        }
        sequenceRef.current = { leader: null, expires: 0 };
        return;
      }

      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        setOpen((prev) => !prev);
        sequenceRef.current = { leader: null, expires: 0 };
        return;
      }

      const { action, nextState } = processKeySequence(
        sequenceRef.current,
        event.key,
        JUMP_MAP,
        Date.now()
      );
      sequenceRef.current = nextState;

      if (action.kind === 'jump') {
        event.preventDefault();
        jumpTo(action.targetId);
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close, jumpTo, open]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 hidden h-9 items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur-md transition-colors hover:border-cyan-300/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 md:inline-flex"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? 'keyboard-shortcuts-dialog' : undefined}
        data-testid="keyboard-shortcuts-trigger"
      >
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] tracking-normal text-white">?</kbd>
        Shortcuts
      </button>

      <AnimatePresence>
        {open ? (
          <m.div
            key="keyboard-shortcuts-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-16 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={close}
            data-testid="keyboard-shortcuts-backdrop"
          >
            <m.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="keyboard-shortcuts-title"
              id="keyboard-shortcuts-dialog"
              initial={{ y: 18, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 18, scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-background/95 p-6 shadow-2xl shadow-black/40"
              onClick={(event) => event.stopPropagation()}
              data-testid="keyboard-shortcuts-dialog"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="keyboard-shortcuts-title" className="text-lg font-bold text-foreground">
                    Keyboard shortcuts
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white">?</kbd> any time to toggle this panel.
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={close}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-cyan-300/40 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                  aria-label="Close keyboard shortcuts"
                  data-testid="keyboard-shortcuts-close"
                >
                  Close
                </button>
              </div>

              <ul className="mt-5 space-y-2.5" role="list">
                {SHORTCUTS.map((shortcut) => (
                  <li
                    key={shortcut.keys.join('-')}
                    className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
                  >
                    <span className="text-sm text-muted-foreground">{shortcut.label}</span>
                    <span className="flex items-center gap-1 text-xs" aria-hidden="true">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 ? <span className="text-muted-foreground/50">then</span> : null}
                          <kbd className="min-w-[1.75rem] rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-center font-mono text-[11px] text-white">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
