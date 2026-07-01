import { describe, expect, it } from 'vitest';
import { buildCompanyMonogram } from './card-logic';

describe('experience card logic', () => {
  it('builds a compact company monogram for logo fallback', () => {
    expect(buildCompanyMonogram('Connecticut College')).toBe('CC');
    expect(buildCompanyMonogram('Los Angeles County EMS Agency')).toBe('LAC');
  });
});
