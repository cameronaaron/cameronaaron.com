import Link from 'next/link';
import {
  academicVerificationResources,
  additionalCredentials,
} from '@/data/additionalCredentials';
import { sortByDateDesc } from '@/data/dateOrdering';
import { getPageUrl } from '@/data/site';
import { buildCredentialsMetadata } from './metadata';

export const dynamic = 'force-static';

const pageUrl = getPageUrl('/credentials');

export const metadata = buildCredentialsMetadata(pageUrl);

export default function CredentialsPage() {
  const sortedCredentials = sortByDateDesc(additionalCredentials, (credential) => credential.issued);

  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: 'Credentials and Verification Links',
        description: metadata.description,
        inLanguage: 'en-US',
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl}#credential-list`,
        name: 'Additional Credentials',
        itemListElement: sortedCredentials.map((credential, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'EducationalOccupationalCredential',
            name: credential.name,
            recognizedBy: {
              '@type': 'Organization',
              name: credential.issuer,
            },
            identifier: credential.credentialId,
            url: credential.verificationUrl,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-white/10 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_52%)]" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Verification Hub</p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white md:text-5xl">
            Credentials and Verification Links
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-gray-300">
            A dedicated archive for non-clinical certifications, technical training records, and direct academic verification pages.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to main portfolio
            </Link>
            <Link
              href="/internet"
              className="inline-flex items-center rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
            >
              View online features
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="mb-6 text-3xl font-bold text-white">Academic Verification</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {academicVerificationResources.map((resource) => (
              <article key={resource.url} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">{resource.institution}</p>
                <h3 className="mt-2 text-xl font-bold text-white">{resource.name}</h3>
                <p className="mt-3 text-gray-300">{resource.description}</p>
                {resource.credentialId ? (
                  <p className="mt-3 text-sm text-gray-300">Credential ID: {resource.credentialId}</p>
                ) : null}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                >
                  Open verification page
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6">
          <h2 className="mb-6 text-3xl font-bold text-white">Additional Professional Credentials</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {sortedCredentials.map((credential) => (
              <article
                key={`${credential.name}-${credential.credentialId}`}
                className="rounded-xl border border-white/10 bg-black/20 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">{credential.issuer}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{credential.name}</h3>
                  </div>
                  <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                    {credential.issued}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-300">Credential ID: {credential.credentialId}</p>
                {credential.notes ? <p className="mt-1 text-sm text-gray-400">{credential.notes}</p> : null}
                <a
                  href={credential.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                >
                  Verify credential
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />
    </main>
  );
}
