import Link from 'next/link';
import {
  academicVerificationResources,
  additionalCredentials,
} from '@/data/additionalCredentials';
import { sortByDateDesc } from '@/data/dateOrdering';
import { getPageUrl } from '@/data/site';
import { buildCredentialsMetadata } from './metadata';
import { SUBPAGE_FONT_PRELOADS, preloadFontFiles } from '../font-preloads';

export const dynamic = 'force-static';

const pageUrl = getPageUrl('/credentials');

export const metadata = buildCredentialsMetadata(pageUrl);

export default function CredentialsPage() {
  preloadFontFiles(SUBPAGE_FONT_PRELOADS);
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
      <section className="relative overflow-hidden border-b border-foreground/10 py-20">
        <div className="container relative z-10 mx-auto px-6">
          <p className="mb-4 text-xs font-semibold text-primary">Verification Hub</p>
          <h1 className="max-w-4xl font-display text-4xl font-medium leading-[1.08] text-foreground md:text-6xl">
            Credentials and Verification Links
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-muted-foreground">
            A dedicated archive for non-clinical certifications, technical training records, and direct academic verification pages.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center min-h-[44px] rounded-full border border-foreground/15 bg-surface px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground/45"
            >
              Back to main portfolio
            </Link>
            <Link
              href="/internet"
              className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-secondary"
            >
              View online features
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="mb-6 text-3xl font-bold text-foreground">Academic Verification</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {academicVerificationResources.map((resource) => (
              <article key={resource.url} className="rounded-2xl border border-foreground/10 bg-surface p-6">
                <p className="text-xs font-semibold text-primary">{resource.institution}</p>
                <h3 className="mt-2 text-xl font-bold text-foreground">{resource.name}</h3>
                <p className="mt-3 text-muted-foreground">{resource.description}</p>
                {resource.credentialId ? (
                  <p className="mt-3 text-sm text-muted-foreground">Credential ID: {resource.credentialId}</p>
                ) : null}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center rounded-full border border-foreground/15 bg-surface px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-foreground/45"
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
          <h2 className="mb-6 text-3xl font-bold text-foreground">Additional Professional Credentials</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sortedCredentials.map((credential) => (
              <article
                key={`${credential.name}-${credential.credentialId}`}
                className="rounded-xl border border-foreground/10 bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-primary">{credential.issuer}</p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{credential.name}</h3>
                  </div>
                  <span className="rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {credential.issued}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">Credential ID: {credential.credentialId}</p>
                {credential.notes ? <p className="mt-1 text-sm text-muted-foreground">{credential.notes}</p> : null}
                <a
                  href={credential.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center rounded-full border border-foreground/15 bg-surface px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-foreground/45"
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
