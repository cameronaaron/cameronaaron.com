import ledger from '../../scripts/checks/repo-visibility-ledger.json';

export type RepoVisibility = 'public' | 'private';

export interface RepoVisibilityEntry {
  visibility: RepoVisibility;
  lastChecked: string;
}

export const REPO_VISIBILITY: Record<string, RepoVisibilityEntry> = ledger as Record<string, RepoVisibilityEntry>;

export const PRIVATE_REPOSITORY_CTA = 'Private repository';
export const PUBLIC_REPOSITORY_CTA = 'View on GitHub';

export interface RepositoryFields {
  repository: string;
  link?: string;
  cta: string;
}

/**
 * Link and call to action for a project that lives in a GitHub repository,
 * decided by the checked-in visibility ledger (pnpm run check:repos), never
 * by hand. A repository that goes public starts linking the moment the
 * ledger is refreshed; one that is private never links to a visitor's 404.
 */
export function repositoryFields(repository: string): RepositoryFields {
  if (REPO_VISIBILITY[repository]?.visibility === 'public') {
    return { repository, link: `https://github.com/${repository}`, cta: PUBLIC_REPOSITORY_CTA };
  }
  return { repository, cta: PRIVATE_REPOSITORY_CTA };
}
