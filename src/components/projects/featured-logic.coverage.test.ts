import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFeaturedProjectLeadToken } from '@/components/projects/featured-logic';

// This file targets the one uncovered branch on line 33:
//   return title.split(' ')[0] ?? title;
// The right-hand side of ?? is unreachable via normal strings (split always
// returns at least one element), so we mock String.prototype.split to return
// an array whose [0] element is undefined, forcing the fallback to execute.

describe('getFeaturedProjectLeadToken – nullish-coalescing fallback branch', () => {
  let splitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    splitSpy = vi.spyOn(String.prototype, 'split').mockImplementation(
      function (this: string) {
        // Return an array that has no index-0 property so that [0] is undefined.
        return [] as unknown as string[];
      }
    );
  });

  afterEach(() => {
    splitSpy.mockRestore();
  });

  it('falls back to title when split returns an empty array (covers line-33 ?? branch)', () => {
    const title = 'SomeTitleWithNoSpaces';
    const result = getFeaturedProjectLeadToken(title);
    // split()[0] is undefined → ?? fires → returns title
    expect(result).toBe(title);
  });
});
