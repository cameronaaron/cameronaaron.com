import { describe, expect, it } from 'vitest';
import { certifications, inProgressCertifications } from '@/data/certifications';
import {
  buildCertificationCollections,
  buildVerificationHref,
  evaluateCertificationStatus,
  EXPIRY_WARNING_WINDOW_MONTHS,
  STATUS_ICON_PATH,
  STATUS_ICON_STYLES,
  type CertificationStatusKind,
} from '@/components/certifications/certifications-logic';

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

  it('never appends a query parameter for certifications with none configured', () => {
    const plainCertification = certifications.find((cert) => !cert.verificationQueryParam);
    expect(plainCertification).toBeTruthy();

    if (!plainCertification) return;

    const href = buildVerificationHref(plainCertification);
    expect(href).toBe(plainCertification.verificationUrl);
  });

  it('sorts certifications and in-progress certifications for display', () => {
    const { sortedCertifications, sortedInProgressCertifications } = buildCertificationCollections(
      certifications,
      inProgressCertifications
    );

    expect(sortedCertifications[0]?.name).toBe('Certified Nursing Assistant (CNA)');
    expect(sortedInProgressCertifications).toHaveLength(inProgressCertifications.length);
  });

  it('orders in-progress certifications by expected completion date, not just by length', () => {
    const { sortedInProgressCertifications } = buildCertificationCollections([], [
      { name: 'Sooner', expectedCompletion: 'Jan 2026', status: 'In Progress' },
      { name: 'Later', expectedCompletion: 'Dec 2026', status: 'In Progress' },
    ]);

    expect(sortedInProgressCertifications.map((cert) => cert.name)).toEqual(['Later', 'Sooner']);
  });

  describe('evaluateCertificationStatus', () => {
    it('reads as verified when the status names no expiry date', () => {
      expect(evaluateCertificationStatus('Active', new Date(2030, 0, 1))).toEqual({ kind: 'verified' });
      expect(evaluateCertificationStatus('Earned (Dec 2025)', new Date(2030, 0, 1))).toEqual({ kind: 'verified' });
    });

    it('parses the expiry month/year through extra whitespace on either side', () => {
      const now = new Date(2027, 0, 15); // Jan 2027
      expect(evaluateCertificationStatus('Active (Expires  Dec 2027)', now).monthsUntilExpiry).toBe(11);
      expect(evaluateCertificationStatus('Active (Expires Dec  2027)', now).monthsUntilExpiry).toBe(11);
    });

    it('reads as verified while comfortably before the expiry month', () => {
      const now = new Date(2027, 0, 15); // Jan 2027
      const info = evaluateCertificationStatus('Active (Expires Dec 2027)', now);
      expect(info.kind).toBe('verified');
      expect(info.monthsUntilExpiry).toBe(11);
    });

    it('reads as expiring-soon at exactly the warning-window boundary', () => {
      const now = new Date(2027, 8, 1); // Sep 2027 -> Dec 2027 is 3 months out
      const info = evaluateCertificationStatus('Active (Expires Dec 2027)', now);
      expect(info.kind).toBe('expiring-soon');
      expect(info.monthsUntilExpiry).toBe(EXPIRY_WARNING_WINDOW_MONTHS);
    });

    it('reads as verified one month outside the warning window', () => {
      const now = new Date(2027, 7, 1); // Aug 2027 -> Dec 2027 is 4 months out
      const info = evaluateCertificationStatus('Active (Expires Dec 2027)', now);
      expect(info.kind).toBe('verified');
      expect(info.monthsUntilExpiry).toBe(EXPIRY_WARNING_WINDOW_MONTHS + 1);
    });

    it('reads as expiring-soon in the expiry month itself', () => {
      const now = new Date(2027, 11, 20); // Dec 2027
      const info = evaluateCertificationStatus('Active (Expires Dec 2027)', now);
      expect(info.kind).toBe('expiring-soon');
      expect(info.monthsUntilExpiry).toBe(0);
    });

    it('reads as expired the month after expiry', () => {
      const now = new Date(2028, 0, 5); // Jan 2028
      const info = evaluateCertificationStatus('Active (Expires Dec 2027)', now);
      expect(info.kind).toBe('expired');
      expect(info.monthsUntilExpiry).toBe(-1);
    });

    it('reads as expired long past expiry', () => {
      const now = new Date(2031, 5, 1);
      const info = evaluateCertificationStatus('Active (Expires Dec 2027)', now);
      expect(info.kind).toBe('expired');
      expect(info.monthsUntilExpiry).toBeLessThan(-1);
    });

    // Intentionally time-sensitive, like the external-links freshness contract:
    // once a real credential is within EXPIRY_WARNING_WINDOW_MONTHS of its
    // printed expiry, this starts failing — the prompt to actually renew it
    // and update src/data/certifications.ts, not a bug in this logic.
    it('every real certification reads as verified today', () => {
      for (const cert of certifications) {
        expect(evaluateCertificationStatus(cert.status, new Date()).kind).toBe('verified');
      }
    });
  });

  describe('STATUS_ICON_STYLES / STATUS_ICON_PATH', () => {
    const kinds: CertificationStatusKind[] = ['verified', 'expiring-soon', 'expired'];

    it('maps every status kind to its exact Tailwind color class', () => {
      expect(STATUS_ICON_STYLES).toEqual({
        verified: 'text-emerald-400',
        'expiring-soon': 'text-amber-400',
        expired: 'text-red-400',
      });
    });

    it('maps every status kind to its exact SVG path data', () => {
      expect(STATUS_ICON_PATH).toEqual({
        verified: 'M4 12.5 9.5 18 20 6',
        'expiring-soon': 'M12 3 21.5 20H2.5L12 3ZM12 9.5V14M12 17.25V17.5',
        expired: 'M5 5 19 19M19 5 5 19',
      });
    });

    it('gives every kind a distinct color and a distinct path (no two icons render identically)', () => {
      const colors = kinds.map((kind) => STATUS_ICON_STYLES[kind]);
      const paths = kinds.map((kind) => STATUS_ICON_PATH[kind]);
      expect(new Set(colors).size).toBe(kinds.length);
      expect(new Set(paths).size).toBe(kinds.length);
    });
  });
});
