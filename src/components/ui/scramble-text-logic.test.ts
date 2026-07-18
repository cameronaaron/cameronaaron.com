import { describe, expect, it } from 'vitest';

import {
  SCRAMBLE_GLYPHS,
  SCRAMBLE_REVEAL_PER_FRAME,
  SCRAMBLE_WINDOW,
  isScrambleComplete,
  pickScrambleGlyph,
  scrambleFrame,
  seedScrambleScratch,
} from './scramble-text-logic';

const firstGlyphRandom = () => 0;

describe('pickScrambleGlyph', () => {
  it('indexes the glyph pool by the random draw', () => {
    expect(pickScrambleGlyph(firstGlyphRandom)).toBe(SCRAMBLE_GLYPHS[0]);
    expect(pickScrambleGlyph(() => 0.999)).toBe(SCRAMBLE_GLYPHS[SCRAMBLE_GLYPHS.length - 1]);
  });
});

describe('seedScrambleScratch', () => {
  it('fills the scratch with glyphs, preserving spaces', () => {
    const scratch: string[] = [];
    seedScrambleScratch('ab c', firstGlyphRandom, scratch);
    expect(scratch).toHaveLength(4);
    expect(scratch[2]).toBe(' ');
    expect(scratch[0]).toBe(SCRAMBLE_GLYPHS[0]);
  });

  it('reuses and resizes a previously longer scratch', () => {
    const scratch = ['x', 'x', 'x', 'x', 'x', 'x'];
    seedScrambleScratch('hi', firstGlyphRandom, scratch);
    expect(scratch).toHaveLength(2);
  });
});

describe('scrambleFrame', () => {
  it('reveals characters before the reveal point and churns only the window', () => {
    const target = 'Cameron';
    const scratch: string[] = [];
    seedScrambleScratch(target, firstGlyphRandom, scratch);

    const frame = scrambleFrame(target, 3, firstGlyphRandom, scratch);
    expect(frame.slice(0, 3)).toBe('Cam');
    // Window characters are glyphs, not the target letters.
    for (let i = 3; i < Math.min(target.length, 3 + SCRAMBLE_WINDOW); i += 1) {
      expect(SCRAMBLE_GLYPHS).toContain(frame[i]);
    }
    expect(frame).toHaveLength(target.length);
  });

  it('returns the full target once revealed passes the length', () => {
    const target = 'hi';
    const scratch: string[] = [];
    seedScrambleScratch(target, firstGlyphRandom, scratch);
    expect(scrambleFrame(target, 5, firstGlyphRandom, scratch)).toBe('hi');
  });

  it('keeps spaces as spaces inside the churn window', () => {
    const target = 'a b';
    const scratch: string[] = [];
    seedScrambleScratch(target, firstGlyphRandom, scratch);
    const frame = scrambleFrame(target, 1, firstGlyphRandom, scratch);
    expect(frame[1]).toBe(' ');
  });

  it('churns exactly the SCRAMBLE_WINDOW characters past reveal, touching nothing beyond it', () => {
    // A mutant that computes windowEnd via `revealedCount - SCRAMBLE_WINDOW`
    // (instead of +) makes the churn loop never run — verify positions
    // inside the window actually get overwritten, and the very next
    // position just past the window is left untouched.
    const target = 'HelloWorld'; // 10 chars
    const scratch = ['S', 'E', 'N', 'T', 'I', 'N', 'E', 'L', '!', '?'];
    const frame = scrambleFrame(target, 2, firstGlyphRandom, scratch);

    expect(frame.slice(0, 2)).toBe('He'); // revealed chars come from target
    // Window is [2, 5): these sentinel slots must be overwritten with glyphs.
    expect(SCRAMBLE_GLYPHS).toContain(scratch[2]);
    expect(SCRAMBLE_GLYPHS).toContain(scratch[3]);
    expect(SCRAMBLE_GLYPHS).toContain(scratch[4]);
    // Position 5 is past the window — must remain the untouched sentinel.
    expect(scratch[5]).toBe('N');
  });
});

describe('isScrambleComplete', () => {
  it('completes exactly when the reveal point reaches the length', () => {
    expect(isScrambleComplete('abc', 2.9)).toBe(false);
    expect(isScrambleComplete('abc', 3)).toBe(true);
  });
});

describe('SCRAMBLE_REVEAL_PER_FRAME', () => {
  it('advances by a positive sub-character step', () => {
    expect(SCRAMBLE_REVEAL_PER_FRAME).toBeGreaterThan(0);
    expect(SCRAMBLE_REVEAL_PER_FRAME).toBeLessThanOrEqual(1);
  });
});
