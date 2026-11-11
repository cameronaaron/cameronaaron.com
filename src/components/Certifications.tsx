import SectionHeader from '@/components/ui/SectionHeader';
import HeartbeatMonitor from '@/components/certifications/HeartbeatMonitor';
import { certifications, inProgressCertifications } from '@/data/certifications';
import {
  buildCertificationCollections,
  buildVerificationHref,
  evaluateCertificationStatus,
  STATUS_ICON_PATH,
  STATUS_ICON_STYLES,
  type CertificationStatusInfo,
} from '@/components/certifications/certifications-logic';

// Server Component (no 'use client', RSC islands, 2026-07 — see the Education
// conversion in §5 for the full rationale): this section is display content —
// a credential table, in-progress cards, a CTA — with no interactive state
// besides HeartbeatMonitor, which stays its own client island.
//
// `now` used to be a hydration-anchored useState (PRE_HYDRATION_STATUS_ANCHOR,
// removed) because a static export has no server runtime, so "now" could only
// come from the client's clock, and reading it during the first client render
// would mismatch the static HTML. A Server Component sidesteps the whole
// problem: `new Date()` here runs exactly once, at BUILD time, and its result
// IS the static HTML — there is no second client render to mismatch against.
// This is strictly more honest than the anchor trick, not a compromise: a
// visitor now sees status computed as of the last deploy (this site
// auto-deploys on push) instead of a screen that briefly claimed every
// credential was "verified" before the real clock kicked in a frame later.

/** Feedback strip shown under an expiring/expired credential's status cell — the "say something" requirement. */
function StatusFeedback({ info }: { info: CertificationStatusInfo }) {
  if (info.kind === 'verified' || info.monthsUntilExpiry === undefined) return null;

  if (info.kind === 'expired') {
    // 'expired' only classifies monthsUntilExpiry < 0 (see evaluateCertificationStatus),
    // so the magnitude here is always >= 1 — no "this month" (0-month) case is reachable.
    const months = Math.abs(info.monthsUntilExpiry);
    return (
      <p className="text-danger text-xs mt-0.5" role="status">
        Expired {months} month{months === 1 ? '' : 's'} ago — renewal needed
      </p>
    );
  }

  return (
    <p className="text-warning text-xs mt-0.5" role="status">
      Expires in {info.monthsUntilExpiry} month{info.monthsUntilExpiry === 1 ? '' : 's'} — renew soon
    </p>
  );
}

/** Status icon: a check, a warning triangle, or an X — reacting to how close the credential is to expiry. */
function StatusIcon({ info }: { info: CertificationStatusInfo }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 flex-shrink-0 ${STATUS_ICON_STYLES[info.kind]}`}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={STATUS_ICON_PATH[info.kind]} />
    </svg>
  );
}

export default function Certifications() {
  const { sortedCertifications, sortedInProgressCertifications } = buildCertificationCollections(
    certifications,
    inProgressCertifications,
  );
  const now = new Date();

  return (
    <section id="certifications" className="py-20 md:py-28" aria-labelledby="certifications-heading">
      <div className="container mx-auto px-6">
        <SectionHeader
          headingId="certifications-heading"
          title="Clinical Certifications & Licenses"
          subtitle="Current emergency and healthcare credentials with verifiable status"
        />

        <div className="-mt-8 mb-8">
          <HeartbeatMonitor />
        </div>

        <div className="hidden lg:block overflow-hidden rounded-2xl border border-foreground/10 bg-surface">
          <div className="grid grid-cols-12 gap-4 px-6 py-3.5 text-sm text-muted-foreground border-b border-foreground/10">
            <p className="col-span-4">Certification</p>
            <p className="col-span-3">Issuing Organization</p>
            <p className="col-span-3">Status</p>
            <p className="col-span-2">Credential ID</p>
          </div>
          {sortedCertifications.map((cert, index) => (
            <div
              key={`${cert.name}-${cert.credentialId}`}
              data-testid={`cert-row-${index}`}
              className="group grid grid-cols-12 gap-4 px-6 py-4 border-b border-foreground/10 last:border-b-0 hover:bg-background transition-colors duration-200 cursor-default"
            >
              <p className="col-span-4 flex items-center gap-2.5 text-foreground font-semibold">
                <StatusIcon info={evaluateCertificationStatus(cert.status, now)} />
                {cert.name}
              </p>
              <p className="col-span-3 text-muted-foreground">{cert.issuer}</p>
              <div className="col-span-3">
                <p className="font-data text-foreground">{cert.status}</p>
                <StatusFeedback info={evaluateCertificationStatus(cert.status, now)} />
              </div>
              <a
                href={buildVerificationHref(cert)}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 font-data break-all text-primary text-sm underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors"
                aria-label={`Verify ${cert.name} credential ${cert.credentialId}`}
              >
                {cert.credentialId}
              </a>
            </div>
          ))}
        </div>

        <div className="lg:hidden space-y-4">
          {sortedCertifications.map((cert, index) => (
            <article
              key={`${cert.name}-${cert.credentialId}-mobile`}
              data-testid={`cert-mobile-row-${index}`}
              className="rounded-2xl border border-foreground/10 bg-surface p-5"
            >
              <p className="flex items-center gap-2 text-foreground font-semibold mb-2">
                <StatusIcon info={evaluateCertificationStatus(cert.status, now)} />
                {cert.name}
              </p>
              <p className="text-muted-foreground text-sm mb-1">{cert.issuer}</p>
              <p className="font-data text-foreground text-sm mb-1">{cert.status}</p>
              <StatusFeedback info={evaluateCertificationStatus(cert.status, now)} />
              <p className="text-muted-foreground text-xs">
                Credential:{' '}
                <a
                  href={buildVerificationHref(cert)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline decoration-primary/40 underline-offset-4 hover:text-primary transition-colors"
                  aria-label={`Verify ${cert.name} credential ${cert.credentialId}`}
                >
                  {cert.credentialId}
                </a>
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-3xl font-medium text-foreground mb-5 font-display">Certifications in progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedInProgressCertifications.map((cert) => (
              <div
                key={cert.name}
                className="rounded-2xl border border-foreground/10 bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-foreground font-semibold">{cert.name}</p>
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0 mt-1" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>
                </div>
                <p className="text-foreground text-sm mt-1">Expected: {cert.expectedCompletion}</p>
                <p className="text-muted-foreground text-sm mt-1">{cert.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-muted p-6 md:p-8">
          <h3 className="text-2xl font-medium text-foreground font-display">Need the full credential archive?</h3>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            This section highlights active clinical licenses. For additional technical certificates, diploma verification,
            and public-facing credential links, use the dedicated pages below.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/credentials"
              className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-secondary"
            >
              View Full Credentials Page
            </a>
            <a
              href="/internet"
              className="inline-flex min-h-[44px] items-center rounded-full border border-foreground/15 bg-surface px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground/45"
            >
              View Online Features Page
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
