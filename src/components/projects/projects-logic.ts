import { sortByDateDesc } from '@/data/dateOrdering';
import type { Project } from '@/data/projects';

export interface ProjectCollections {
  featuredProjects: Project[];
  /**
   * Non-featured projects that ship a playable companion. They are split out
   * of `otherProjects` so each one can render beside its own game.
   *
   * Before this split (2026-07-26) every non-featured demo rendered in a stack
   * BELOW the whole project grid, captioned "Try it — paired with <title>".
   * With one such game that read fine; with seven it did not — the caption was
   * doing all the pairing work while the card it referred to sat several
   * screens away. Proximity is the only pairing a reader actually perceives.
   */
  playableProjects: Project[];
  /** Non-featured projects with no companion — the compact grid. */
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
  // Single-pass three-way partition instead of three full .filter() traversals.
  const featured: Project[] = [];
  const playable: Project[] = [];
  const other: Project[] = [];
  for (const project of items) {
    if (project.featured) {
      featured.push(project);
    } else if (project.interactiveDemo !== undefined) {
      playable.push(project);
    } else {
      other.push(project);
    }
  }

  return {
    featuredProjects: sortByDateDesc(featured, (project) => project.period),
    playableProjects: sortByDateDesc(playable, (project) => project.period),
    otherProjects: sortByDateDesc(other, (project) => project.period),
    researchSignals: getResearchSignals(items),
  };
}
