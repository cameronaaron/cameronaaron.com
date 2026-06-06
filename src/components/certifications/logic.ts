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
