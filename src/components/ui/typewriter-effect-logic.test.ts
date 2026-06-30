import { describe, expect, it } from 'vitest';
import { getVisibleTypedText } from '@/components/ui/typewriter-effect-logic';

describe('typewriter effect logic', () => {
  it('returns the in-progress displayed text when typing has started', () => {
    expect(getVisibleTypedText('Cam', 'Cameron Aaron')).toBe('Cam');
  });

  it('falls back to the first character before any text has been typed', () => {
    expect(getVisibleTypedText('', 'Cameron Aaron')).toBe('C');
  });
});
