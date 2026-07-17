'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import { certifications, inProgressCertifications } from '@/data/certifications';
import {
  buildCertificationCollections,
  buildVerificationHref,
  getInProgressAnimationOffset,
  getVerifiedCheckmarkTransition,
} from '@/components/certifications/logic';

/** Animated checkmark that draws itself in once, when its row scrolls into view. */
function VerifiedCheckmark({ index }: { index: number }) {
  const transition = getVerifiedCheckmarkTransition(index);
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="h-4 w-4 flex-shrink-0 text-emerald-400"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={transition}
    >
      <path d="M4 12.5 9.5 18 20 6" />
    </motion.svg>
  );
}

export default function Certifications() {
  const { sortedCertifications, sortedInProgressCertifications } = useMemo(
    () => buildCertificationCollections(certifications, inProgressCertifications),
    []
  );

  return (
    <section id="certifications" className="py-20 bg-background relative overflow-hidden" aria-labelledby="certifications-heading">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          headingId="certifications-heading"
          index="01"
          title="Clinical Certifications & Licenses"
          subtitle="Current emergency and healthcare credentials with verifiable status"
          className="[&>h2]:font-display"
        />

        <div className="hidden lg:block overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
            <p className="col-span-4">Certification</p>
            <p className="col-span-3">Issuing Organization</p>
            <p className="col-span-3">Status</p>
            <p className="col-span-2">Credential ID</p>
          </div>
          {sortedCertifications.map((cert, index) => (
            <motion.div
              key={`${cert.name}-${cert.credentialId}`}
              data-testid={`cert-row-${index}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="group grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 last:border-b-0 hover:bg-cyan-500/5 hover:border-cyan-500/10 transition-colors duration-200 cursor-default"
            >
              <p className="col-span-4 flex items-center gap-2 text-foreground font-semibold group-hover:text-cyan-50 transition-colors">
                <VerifiedCheckmark index={index} />
                {cert.name}
              </p>
              <p className="col-span-3 text-muted-foreground group-hover:text-foreground/70 transition-colors">{cert.issuer}</p>
              <p className="col-span-3 text-cyan-300">{cert.status}</p>
              <a
                href={buildVerificationHref(cert)}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 text-cyan-300/70 text-sm underline decoration-cyan-500/30 underline-offset-4 hover:text-cyan-200 group-hover:text-cyan-300 group-hover:decoration-cyan-400/60 transition-colors"
                aria-label={`Verify ${cert.name} credential ${cert.credentialId}`}
              >
                {cert.credentialId}
              </a>
            </motion.div>
          ))}
        </div>

        <div className="lg:hidden space-y-4">
          {sortedCertifications.map((cert, index) => (
            <motion.article
              key={`${cert.name}-${cert.credentialId}-mobile`}
              data-testid={`cert-mobile-row-${index}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5"
            >
              <p className="flex items-center gap-2 text-foreground font-semibold mb-2">
                <VerifiedCheckmark index={index} />
                {cert.name}
              </p>
              <p className="text-muted-foreground text-sm mb-1">{cert.issuer}</p>
              <p className="text-cyan-300 text-sm mb-1">{cert.status}</p>
              <p className="text-muted-foreground text-xs">
                Credential:{' '}
                <a
                  href={buildVerificationHref(cert)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 underline decoration-cyan-500/40 underline-offset-4 hover:text-cyan-200 transition-colors"
                  aria-label={`Verify ${cert.name} credential ${cert.credentialId}`}
                >
                  {cert.credentialId}
                </a>
              </p>
            </motion.article>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-bold text-foreground mb-4 font-display">Certifications In Progress</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {sortedInProgressCertifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, x: getInProgressAnimationOffset(index) }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-foreground font-semibold">{cert.name}</p>
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0 mt-1" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                </div>
                <p className="text-emerald-300 text-sm mt-1">Expected: {cert.expectedCompletion}</p>
                <p className="text-muted-foreground text-sm mt-1">{cert.status}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-6">
          <h3 className="text-xl font-bold text-foreground font-display">Need the full credential archive?</h3>
          <p className="mt-2 text-muted-foreground">
            This section highlights active clinical licenses. For additional technical certificates, diploma verification,
            and public-facing credential links, use the dedicated pages below.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/credentials"
              className="inline-flex items-center rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
            >
              View Full Credentials Page
            </a>
            <a
              href="/internet"
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View Online Features Page
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
