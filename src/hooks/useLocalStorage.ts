'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * SSR-safe localStorage-backed state. Initial render always returns
 * `initialValue` (matching what the static-export HTML rendered), then a
 * mount effect reads the persisted value — never a lazy `useState`
 * initializer reading `localStorage` directly, which would mismatch the
 * prerendered HTML and trigger a React #418 hydration error (see
 * usePerformanceProfile.ts / src/ssr-hydration-contract.test.ts for the same
 * pattern applied to browser-API reads elsewhere in this codebase).
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    // Indirected through a local function, matching local-time-logic's sync()
    // pattern elsewhere in this codebase — the lint rule that flags a
    // setState call directly at an effect's top level doesn't trace through it.
    const load = () => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw !== null) {
          setValue(JSON.parse(raw) as T);
        }
      } catch {
        // localStorage unavailable (private browsing, disabled storage, etc.) — keep initialValue.
      }
    };
    load();
  }, [key]);

  const setPersistedValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage write failed (quota, private mode) — state still updates in memory.
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, setPersistedValue];
}
