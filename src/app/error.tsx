'use client';

import { useEffect } from 'react';

import { CHUNK_RELOAD_GUARD_KEY, shouldAutoReloadForChunkError } from '@/app/error-boundary-logic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);

    // A stale tab whose HTML references a chunk hash that no longer exists
    // after a newer deploy — reset() can't fix this (the module registry
    // entry is poisoned, not the render tree), only a fresh navigation can.
    // Guarded to at most once per tab session so a genuinely broken deploy
    // doesn't reload forever.
    const alreadyAttempted = window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) === 'true';
    if (shouldAutoReloadForChunkError(error, alreadyAttempted)) {
      window.sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, 'true');
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        <h2 className="text-3xl font-bold text-foreground mb-3">Something went wrong</h2>
        <p className="text-muted-foreground mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-6 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 hover:border-cyan-300/50"
        >
          Try again
        </button>
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
      </div>
    </div>
  );
}
