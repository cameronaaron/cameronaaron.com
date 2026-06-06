export type TechnicalView = 'priority' | 'alphabetical';

export interface TechnicalSkill {
  name: string;
  level: number;
}

export function sortTechnicalSkills(skills: TechnicalSkill[], view: TechnicalView): TechnicalSkill[] {
  if (view === 'alphabetical') {
    return [...skills].sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...skills].sort((a, b) => b.level - a.level);
}

export function getStrongestSkill(skills: TechnicalSkill[]): TechnicalSkill | undefined {
  return skills[0];
}
