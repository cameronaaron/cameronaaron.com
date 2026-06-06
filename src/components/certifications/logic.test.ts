import { describe, expect, it } from 'vitest';
import { certifications, inProgressCertifications } from '@/data/certifications';
import {
  buildCertificationCollections,
  buildVerificationHref,
  getInProgressAnimationOffset,
} from '@/components/certifications/logic';

describe('certifications logic', () => {
  it('builds verification urls and appends query parameter when configured', () => {
    const nihCertification = certifications.find((cert) => cert.verificationQueryParam === 'certificateId');
    expect(nihCertification).toBeTruthy();

    if (!nihCertification) {
      return;
    }

    const href = buildVerificationHref(nihCertification);
    const parsed = new URL(href);

    expect(parsed.searchParams.get('certificateId')).toBe(nihCertification.credentialId);
  });

  it('sorts certifications and in-progress certifications for display', () => {
    const { sortedCertifications, sortedInProgressCertifications } = buildCertificationCollections(
      certifications,
      inProgressCertifications
    );

    expect(sortedCertifications[0]?.name).toBe('Certified Nursing Assistant (CNA)');
    expect(sortedInProgressCertifications).toHaveLength(inProgressCertifications.length);
  });

  it('returns alternating animation offsets for in-progress cards', () => {
    expect(getInProgressAnimationOffset(0)).toBe(-16);
    expect(getInProgressAnimationOffset(1)).toBe(16);
    expect(getInProgressAnimationOffset(2)).toBe(-16);
  });
});
