import { getDateSortKey, sortByDateDesc } from '@/data/dateOrdering';
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

/** Verified-row status icon draw: starts once the row itself has faded in. */
export const CHECKMARK_DRAW_BASE_DELAY = 0.25;
export const CHECKMARK_DRAW_STAGGER = 0.04;
export const CHECKMARK_DRAW_DURATION = 0.45;

export interface CheckmarkDrawTransition {
  delay: number;
  duration: number;
}

/**
 * Stroke-draw timing for a row's status icon (check / warning / X): a
 * `pathLength: 0 -> 1` animation that starts just after the row's own
 * fade-in, staggered by row index like the rest of the table.
 */
export function getVerifiedCheckmarkTransition(index: number): CheckmarkDrawTransition {
  return {
    delay: CHECKMARK_DRAW_BASE_DELAY + index * CHECKMARK_DRAW_STAGGER,
    duration: CHECKMARK_DRAW_DURATION,
  };
}

/** A credential within this many months of its expiry month reads as "expiring soon" rather than "verified". */
export const EXPIRY_WARNING_WINDOW_MONTHS = 3;

/**
 * Pre-hydration anchor for expiry evaluation. The static export has no
 * server runtime, so the real "now" must come from the client's clock — but
 * reading `new Date()` during the very first client render (before
 * `useEffect` runs) would compute a different value than the statically
 * built HTML, tripping a React hydration mismatch (the same class of bug as
 * constraint #10 in CLAUDE.md). Every real certification here expires no
 * earlier than 2027, so anchoring the pre-hydration render at the Unix epoch
 * deterministically yields 'verified' on both the server and the first
 * client paint; the real clock takes over once `useEffect` fires.
 */
export const PRE_HYDRATION_STATUS_ANCHOR = new Date(0);

const EXPIRES_MONTH_YEAR_RE = /expires\s+([a-z]{3,9})\s+(\d{4})/i;

export type CertificationStatusKind = 'verified' | 'expiring-soon' | 'expired';

export const STATUS_ICON_STYLES: Record<CertificationStatusKind, string> = {
  verified: 'text-emerald-400',
  'expiring-soon': 'text-amber-400',
  expired: 'text-red-400',
};

export const STATUS_ICON_PATH: Record<CertificationStatusKind, string> = {
  verified: 'M4 12.5 9.5 18 20 6',
  'expiring-soon': 'M12 3 21.5 20H2.5L12 3ZM12 9.5V14M12 17.25V17.5',
  expired: 'M5 5 19 19M19 5 5 19',
};

export interface CertificationStatusInfo {
  kind: CertificationStatusKind;
  /** Whole months until expiry (negative once expired). Absent when the status names no expiry date. */
  monthsUntilExpiry?: number;
}

/**
 * Classifies a certification's live status from its `"... (Expires <Month>
 * <Year>)"` status string. Statuses with no "Expires" clause (permanent
 * "Earned (...)" certificates, or bare "Active" training records) always
 * read as 'verified' — there is nothing to count down to.
 */
export function evaluateCertificationStatus(status: string, now: Date): CertificationStatusInfo {
  const match = status.match(EXPIRES_MONTH_YEAR_RE);
  if (!match) {
    return { kind: 'verified' };
  }

  const expiryKey = getDateSortKey(`${match[1]} ${match[2]}`);
  const nowKey = now.getFullYear() * 12 + now.getMonth();
  const monthsUntilExpiry = expiryKey - nowKey;

  if (monthsUntilExpiry < 0) {
    return { kind: 'expired', monthsUntilExpiry };
  }

  if (monthsUntilExpiry <= EXPIRY_WARNING_WINDOW_MONTHS) {
    return { kind: 'expiring-soon', monthsUntilExpiry };
  }

  return { kind: 'verified', monthsUntilExpiry };
}
