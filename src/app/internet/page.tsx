import type { Metadata } from 'next';
import Link from 'next/link';
import { internetFeatures } from '@/data/internetFeatures';
import { sortByDateDesc } from '@/data/dateOrdering';
import { groupFeaturesByCategory } from './logic';

export const dynamic = 'force-static';

const baseUrl = 'https://cameronaaron.com';
const pageUrl = `${baseUrl}/internet`;

export const metadata: Metadata = {
  title: 'Cameron Aaron on the Internet',
  description:
    'Curated links to speaking pages, media features, research publications, and public professional profiles.',
  alternates: {
    canonical: '/internet',
  },
  openGraph: {
    title: 'On the Internet | Cameron Aaron',
    description:
      'Speaking, research, and media links gathered in one place for recruiters, collaborators, and institutions.',
    url: pageUrl,
    type: 'article',
  },
};

export default function InternetPage() {
  const sortedFeatures = sortByDateDesc(internetFeatures, (item) => item.period);
  const featureGroups = groupFeaturesByCategory(sortedFeatures);

  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: 'Cameron Aaron on the Internet',
        description: metadata.description,
        inLanguage: 'en-US',
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl}#internet-features`,
        name: 'Internet Features and Mentions',
        itemListElement: sortedFeatures.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'CreativeWork',
            name: item.title,
            publisher: {
              '@type': 'Organization',
              name: item.organization,
            },
            description: item.summary,
            ...(item.url ? { url: item.url } : {}),
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-white/10 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_55%)]" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Public Presence</p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white md:text-5xl">
            Cameron Aaron on the Internet
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-gray-300">
            A curated index of speaking pages, media write-ups, project features, publication links, and profile pages.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to main portfolio
            </Link>
            <Link
              href="/credentials"
              className="inline-flex items-center rounded-lg border border-emerald-300/35 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
            >
              View credential archive
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="space-y-10">
            {featureGroups.map(({ category, items }) => {
              return (
                <div key={category}>
                  <h2 className="mb-4 text-2xl font-bold text-white">{category}</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {items.map((item) => (
                      <article
                        key={`${item.title}-${item.period}`}
                        className="rounded-xl border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                            {item.period}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-cyan-200/85">{item.organization}</p>
                        <p className="mt-3 text-gray-300">{item.summary}</p>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center rounded-md border border-emerald-300/35 bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
                          >
                            Open link
                          </a>
                        ) : (
                          <p className="mt-4 text-sm text-gray-400">Public recording link not provided in source notes.</p>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
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
