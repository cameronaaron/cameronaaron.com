import { sortByDateDesc } from '@/data/dateOrdering';
import type { Project } from '@/data/projects';

export interface ProjectCollections {
  featuredProjects: Project[];
  otherProjects: Project[];
  researchSignals: string[];
}

export function getResearchSignals(items: Project[], limit = 10): string[] {
  // Early-exit single pass: stop scanning the moment `limit` unique tags are
  // collected instead of building the full unique set and slicing.
  const seen = new Set<string>();
  const signals: string[] = [];
  outer: for (const project of items) {
    for (const tag of project.tags) {
      if (seen.has(tag)) continue;
      seen.add(tag);
      signals.push(tag);
      if (signals.length >= limit) break outer;
    }
  }
  return signals;
}

export function buildProjectCollections(items: Project[]): ProjectCollections {
  // Single-pass partition instead of two full .filter() traversals.
  const featured: Project[] = [];
  const other: Project[] = [];
  for (const project of items) {
    (project.featured ? featured : other).push(project);
  }

  return {
    featuredProjects: sortByDateDesc(featured, (project) => project.period),
    otherProjects: sortByDateDesc(other, (project) => project.period),
    researchSignals: getResearchSignals(items),
  };
}
