/**
 * Root error boundary (src/app/error.tsx) — pure decision logic.
 *
 * This site deploys on every push (CLAUDE.md — Cloudflare Pages auto-deploys
 * `master`), and each deploy replaces `_next/static/chunks/**` with a new
 * build's content-hashed filenames; it does not retain the previous deploy's
 * files at the same paths. A visitor who already has the page open across a
 * deploy, then triggers a `next/dynamic` import (e.g. opening a project's
 * playable-demo panel), requests a chunk hash that only exists in the HTML
 * they loaded — which 404s against the new deployment and throws a
 * ChunkLoadError. React's `reset()` cannot fix this: the module registry
 * entry is poisoned, not the render tree. Only a full navigation — a fresh
 * HTML fetch whose chunk references match what is actually deployed — does.
 *
 * `shouldAutoReloadForChunkError` decides IF that reload should happen; the
 * component performs it and guards against a reload loop with a session
 * flag (a genuinely broken deploy would otherwise reload forever).
 */

const CHUNK_LOAD_ERROR_PATTERN = /ChunkLoadError|Loading chunk .* failed|Failed to load chunk/i;

export function isChunkLoadError(error: Error): boolean {
  return error.name === 'ChunkLoadError' || CHUNK_LOAD_ERROR_PATTERN.test(error.message);
}

/** sessionStorage key guarding against reloading more than once per tab session. */
export const CHUNK_RELOAD_GUARD_KEY = 'app-error-chunk-reload-attempted';

export function shouldAutoReloadForChunkError(error: Error, alreadyAttempted: boolean): boolean {
  return isChunkLoadError(error) && !alreadyAttempted;
}
