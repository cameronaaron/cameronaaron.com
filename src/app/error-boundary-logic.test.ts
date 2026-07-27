import { describe, expect, it } from 'vitest';

import { CHUNK_RELOAD_GUARD_KEY, isChunkLoadError, shouldAutoReloadForChunkError } from './error-boundary-logic';

describe('isChunkLoadError', () => {
  it('recognizes webpack/turbopack ChunkLoadError by name', () => {
    const error = new Error('anything');
    error.name = 'ChunkLoadError';
    expect(isChunkLoadError(error)).toBe(true);
  });

  it('recognizes the "Loading chunk ... failed" message shape', () => {
    expect(isChunkLoadError(new Error('Loading chunk 42 failed.'))).toBe(true);
  });

  it('recognizes the "Failed to load chunk" message shape', () => {
    expect(isChunkLoadError(new Error('Failed to load chunk /_next/static/chunks/foo.js from module 123'))).toBe(
      true
    );
  });

  it('does not misclassify an ordinary application error', () => {
    expect(isChunkLoadError(new Error('boom'))).toBe(false);
    expect(isChunkLoadError(new TypeError('Cannot read properties of undefined'))).toBe(false);
  });
});

describe('shouldAutoReloadForChunkError', () => {
  it('reloads on a fresh chunk error not yet attempted', () => {
    const error = new Error('Loading chunk 7 failed.');
    expect(shouldAutoReloadForChunkError(error, false)).toBe(true);
  });

  it('never reloads a second time in the same session — the loop guard', () => {
    const error = new Error('Loading chunk 7 failed.');
    expect(shouldAutoReloadForChunkError(error, true)).toBe(false);
  });

  it('never reloads for a non-chunk error, attempted or not', () => {
    const error = new Error('boom');
    expect(shouldAutoReloadForChunkError(error, false)).toBe(false);
    expect(shouldAutoReloadForChunkError(error, true)).toBe(false);
  });

  it('pins the sessionStorage guard key', () => {
    expect(CHUNK_RELOAD_GUARD_KEY).toBe('app-error-chunk-reload-attempted');
  });
});
