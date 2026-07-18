import { describe, expect, it } from 'vitest';
import { buildCompanyMonogram } from './card-logic';

describe('experience card logic', () => {
  it('builds a compact company monogram for logo fallback', () => {
    expect(buildCompanyMonogram('Connecticut College')).toBe('CC');
    expect(buildCompanyMonogram('Los Angeles County EMS Agency')).toBe('LAC');
  });

  it('tolerates a run of consecutive whitespace between words', () => {
    // Note: \s (single char) vs \s+ (runs) are a confirmed-equivalent mutant
    // here — see the Stryker-disable comment in card-logic.ts. Kept as a
    // behavioral pin on double-spaced input, not a mutation-kill test.
    expect(buildCompanyMonogram('A  B C D')).toBe('ABC');
  });
});
