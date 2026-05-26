'use client';

import { motion } from 'framer-motion';
import SectionHeader from '@/components/ui/SectionHeader';
import { certifications, inProgressCertifications, type Certification } from '@/data/certifications';
import { sortByDateDesc } from '@/data/dateOrdering';

function buildVerificationHref(cert: Certification): string {
  const url = new URL(cert.verificationUrl);
  if (cert.verificationQueryParam) {
    url.searchParams.set(cert.verificationQueryParam, cert.credentialId);
  }
  return url.toString();
}

export default function Certifications() {
  const sortedCertifications = sortByDateDesc(certifications, (certification) => certification.status);
  const sortedInProgressCertifications = sortByDateDesc(
    inProgressCertifications,
    (certification) => certification.expectedCompletion
  );

  return (
    <section id="certifications" className="py-20 bg-background relative overflow-hidden" aria-labelledby="certifications-heading">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
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
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
            >
              <p className="col-span-4 text-foreground font-semibold">{cert.name}</p>
              <p className="col-span-3 text-muted-foreground">{cert.issuer}</p>
              <p className="col-span-3 text-cyan-300">{cert.status}</p>
              <a
                href={buildVerificationHref(cert)}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 text-cyan-300 text-sm underline decoration-cyan-500/40 underline-offset-4 hover:text-cyan-200 transition-colors"
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
              <p className="text-foreground font-semibold mb-2">{cert.name}</p>
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
                initial={{ opacity: 0, x: index % 2 === 0 ? -16 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-5"
              >
                <p className="text-foreground font-semibold">{cert.name}</p>
                <p className="text-emerald-300 text-sm mt-1">Expected: {cert.expectedCompletion}</p>
                <p className="text-muted-foreground text-sm mt-1">{cert.status}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
