'use client';

import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { navItems } from '@/data/navigation';
import { profile } from '@/data/profile';
import { isEditableTarget } from '@/components/ui/keyboard-shortcuts-logic';
import {
  type Command,
  buildCommandCatalog,
  buildEmptyResults,
  clampActiveIndex,
  createLru,
  isPaletteOpenShortcut,
  lruKeys,
  lruTouch,
  moveActiveIndex,
  rankCommands,
  splitByMatches,
} from '@/components/ui/command-palette-logic';

/**
 * ⌘K / Ctrl+K / "/" command palette. Reuses the section jump targets and
 * social links as a searchable command catalog. Non-empty queries are ranked
 * by a positional fuzzy score (decorate-sort, computed once per keystroke —
 * never per frame); the empty state leads with recently-run commands from an
 * LRU cache (Map + doubly-linked list, O(1) per run). The catalog itself is
 * built exactly once. Keyboard-first, works on every performance tier because
 * it's navigation, not decorative motion.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  // MRU-ordered recent command ids, mirrored out of the LRU cache below so the
  // empty state re-derives when a command runs (the ref itself is mutated only
  // in the event handler, never read during render).
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const prefersReducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  // One LRU instance for the component's lifetime — recents persist across opens.
  const recentsRef = useRef(createLru());

  const catalog = useMemo(() => buildCommandCatalog(navItems, profile.social), []);
  const results = useMemo(() => {
    if (query.trim().length === 0) {
      return buildEmptyResults(catalog, recentIds);
    }
    return rankCommands(catalog, query);
  }, [catalog, query, recentIds]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const runCommand = useCallback(
    (command: Command | undefined) => {
      if (!command) return;
      lruTouch(recentsRef.current, command.id);
      setRecentIds(lruKeys(recentsRef.current));
      if (command.action.kind === 'jump') {
        const el = document.getElementById(command.action.targetId);
        el?.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      } else {
        window.open(command.action.url, '_blank', 'noopener,noreferrer');
      }
      close();
    },
    [close, prefersReducedMotion]
  );

  // Global open shortcut. Kept separate from the in-dialog handler so the
  // trigger works from anywhere, including while focus is elsewhere.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) && event.key === '/') return;
      if (isPaletteOpenShortcut(event)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Clamp at read-time (not via a state-syncing effect) so a filtered list that
  // shrinks under typing never leaves the active row out of range.
  const activeRow = clampActiveIndex(activeIndex, results.length);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(moveActiveIndex(activeRow, 1, results.length));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(moveActiveIndex(activeRow, -1, results.length));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(results[activeRow]?.command);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono-accent fixed bottom-5 left-40 z-40 hidden h-9 items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-100 backdrop-blur-md transition-colors hover:border-cyan-300/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 md:inline-flex"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid="command-palette-trigger"
      >
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] tracking-normal text-white">⌘K</kbd>
        Search
      </button>

      <AnimatePresence>
        {open ? (
          <m.div
            key="command-palette-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[95] flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-sm sm:pt-32"
            onClick={close}
            onKeyDown={handleKeyDown}
            data-testid="command-palette-backdrop"
          >
            <m.div
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              id="command-palette-dialog"
              initial={{ y: 14, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 14, scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-background/95 shadow-2xl shadow-black/50"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-white/10 px-4">
                <span aria-hidden="true" className="text-cyan-300/80">⌕</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder="Jump to a section or open a link…"
                  aria-label="Search commands"
                  className="w-full bg-transparent py-4 text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                  data-testid="command-palette-input"
                />
                <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">Esc</kbd>
              </div>

              <ul ref={listRef} role="listbox" aria-label="Commands" className="max-h-[min(60vh,22rem)] overflow-y-auto p-2">
                {results.length === 0 ? (
                  <li className="px-3 py-6 text-center text-sm text-muted-foreground" data-testid="command-palette-empty">
                    No matches for “{query}”
                  </li>
                ) : (
                  results.map((match, index) => (
                    <li key={match.command.id} role="option" aria-selected={index === activeRow}>
                      <button
                        type="button"
                        onClick={() => runCommand(match.command)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          index === activeRow
                            ? 'bg-cyan-300/15 text-cyan-100'
                            : 'text-foreground hover:bg-white/[0.04]'
                        }`}
                        data-testid="command-palette-item"
                      >
                        <span className="text-sm font-medium">
                          {splitByMatches(match.command.label, match.labelMatches).map((segment, segmentIndex) =>
                            segment.matched ? (
                              <mark
                                key={segmentIndex}
                                className="bg-transparent font-semibold text-cyan-300"
                                data-testid="command-palette-match"
                              >
                                {segment.text}
                              </mark>
                            ) : (
                              <span key={segmentIndex}>{segment.text}</span>
                            )
                          )}
                        </span>
                        <span className="font-mono-accent text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
                          {match.recent ? 'Recent' : match.command.hint}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </m.div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
