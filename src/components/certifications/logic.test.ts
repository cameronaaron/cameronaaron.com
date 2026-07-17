import { describe, expect, it } from 'vitest';
import { certifications, inProgressCertifications } from '@/data/certifications';
import {
  buildCertificationCollections,
  buildVerificationHref,
  getInProgressAnimationOffset,
  getVerifiedCheckmarkTransition,
  CHECKMARK_DRAW_BASE_DELAY,
  CHECKMARK_DRAW_STAGGER,
  CHECKMARK_DRAW_DURATION,
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

  it('staggers the verified checkmark draw-in after each row fades in', () => {
    expect(getVerifiedCheckmarkTransition(0)).toEqual({
      delay: CHECKMARK_DRAW_BASE_DELAY,
      duration: CHECKMARK_DRAW_DURATION,
    });
    expect(getVerifiedCheckmarkTransition(3)).toEqual({
      delay: CHECKMARK_DRAW_BASE_DELAY + 3 * CHECKMARK_DRAW_STAGGER,
      duration: CHECKMARK_DRAW_DURATION,
    });
    // Later rows always draw later, never sooner.
    expect(getVerifiedCheckmarkTransition(5).delay).toBeGreaterThan(
      getVerifiedCheckmarkTransition(2).delay
    );
  });
});
