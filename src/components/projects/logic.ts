import { sortByDateDesc } from '@/data/dateOrdering';
import type { Project } from '@/data/projects';

export interface ProjectCollections {
  featuredProjects: Project[];
  otherProjects: Project[];
  researchSignals: string[];
}

export function getResearchSignals(items: Project[], limit = 10): string[] {
  return Array.from(new Set(items.flatMap((project) => project.tags))).slice(0, limit);
}

export function buildProjectCollections(items: Project[]): ProjectCollections {
  return {
    featuredProjects: sortByDateDesc(
      items.filter((project) => project.featured),
      (project) => project.period
    ),
    otherProjects: sortByDateDesc(
      items.filter((project) => !project.featured),
      (project) => project.period
    ),
    researchSignals: getResearchSignals(items),
  };
}
