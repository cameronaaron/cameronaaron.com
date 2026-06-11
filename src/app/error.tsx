'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
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
