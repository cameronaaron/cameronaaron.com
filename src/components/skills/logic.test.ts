import { describe, expect, it } from 'vitest';

import { getStrongestSkill, sortTechnicalSkills, type TechnicalSkill } from './logic';

const SAMPLE: TechnicalSkill[] = [
  { name: 'B', level: 50 },
  { name: 'A', level: 90 },
  { name: 'C', level: 70 },
];

describe('skills logic', () => {
  it('sorts by priority descending', () => {
    const sorted = sortTechnicalSkills(SAMPLE, 'priority');
    expect(sorted.map((skill) => skill.level)).toEqual([90, 70, 50]);
  });

  it('sorts alphabetically by name', () => {
    const sorted = sortTechnicalSkills(SAMPLE, 'alphabetical');
    expect(sorted.map((skill) => skill.name)).toEqual(['A', 'B', 'C']);
  });

  it('returns strongest skill as first element', () => {
    const strongest = getStrongestSkill(sortTechnicalSkills(SAMPLE, 'priority'));
    expect(strongest?.name).toBe('A');
  });
});
