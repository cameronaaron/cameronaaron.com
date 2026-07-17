import { sortByDateDesc } from '@/data/dateOrdering';
import type { Certification, InProgressCertification } from '@/data/certifications';

export interface CertificationCollections {
  sortedCertifications: Certification[];
  sortedInProgressCertifications: InProgressCertification[];
}

export function buildVerificationHref(cert: Certification): string {
  const url = new URL(cert.verificationUrl);

  if (cert.verificationQueryParam) {
    url.searchParams.set(cert.verificationQueryParam, cert.credentialId);
  }

  return url.toString();
}

export function buildCertificationCollections(
  certifications: Certification[],
  inProgressCertifications: InProgressCertification[]
): CertificationCollections {
  return {
    sortedCertifications: sortByDateDesc(certifications, (certification) => certification.status),
    sortedInProgressCertifications: sortByDateDesc(
      inProgressCertifications,
      (certification) => certification.expectedCompletion
    ),
  };
}

export function getInProgressAnimationOffset(index: number): number {
  return index % 2 === 0 ? -16 : 16;
}

/** Verified-row checkmark draw: starts once the row itself has faded in. */
export const CHECKMARK_DRAW_BASE_DELAY = 0.25;
export const CHECKMARK_DRAW_STAGGER = 0.04;
export const CHECKMARK_DRAW_DURATION = 0.45;

export interface CheckmarkDrawTransition {
  delay: number;
  duration: number;
}

/**
 * Stroke-draw timing for the verified-credential checkmark icon: an
 * `pathLength: 0 -> 1` animation that starts just after the row's own
 * fade-in, staggered by row index like the rest of the table.
 */
export function getVerifiedCheckmarkTransition(index: number): CheckmarkDrawTransition {
  return {
    delay: CHECKMARK_DRAW_BASE_DELAY + index * CHECKMARK_DRAW_STAGGER,
    duration: CHECKMARK_DRAW_DURATION,
  };
}
