import { describe, expect, it } from 'vitest';
import { getSectionGlowTone } from './section-transitions-logic';

describe('getSectionGlowTone', () => {
  it('returns cyan tone for even indexes', () => {
    expect(getSectionGlowTone(0)).toBe('from-cyan-400/10 via-primary/12 to-transparent');
    expect(getSectionGlowTone(2)).toBe('from-cyan-400/10 via-primary/12 to-transparent');
    expect(getSectionGlowTone(4)).toBe('from-cyan-400/10 via-primary/12 to-transparent');
  });

  it('returns emerald tone for odd indexes', () => {
    expect(getSectionGlowTone(1)).toBe('from-emerald-400/10 via-secondary/12 to-transparent');
    expect(getSectionGlowTone(3)).toBe('from-emerald-400/10 via-secondary/12 to-transparent');
    expect(getSectionGlowTone(5)).toBe('from-emerald-400/10 via-secondary/12 to-transparent');
  });

  it('handles large even index', () => {
    expect(getSectionGlowTone(100)).toBe('from-cyan-400/10 via-primary/12 to-transparent');
  });

  it('handles large odd index', () => {
    expect(getSectionGlowTone(101)).toBe('from-emerald-400/10 via-secondary/12 to-transparent');
  });
});
