import Link from 'next/link';
import { bridgingTransitions } from '@/data/bridgingTransitions';
import { capstone } from '@/data/capstone';
import { getPageUrl, SITE_URL } from '@/data/site';
import PlaylistTheater from './PlaylistTheater';
import { buildBridgingTransitionsMetadata } from './metadata';

export const dynamic = 'force-static';

const baseUrl = SITE_URL;
const pageUrl = getPageUrl('/bridging-transitions');

export const metadata = buildBridgingTransitionsMetadata(pageUrl);

export default function BridgingTransitionsPage() {
  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: bridgingTransitions.posterTitle,
        description: metadata.description,
        inLanguage: 'en-US',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Bridging Transitions', item: pageUrl },
        ],
      },
      {
        '@type': 'Event',
        '@id': `${pageUrl}#poster-session`,
        name: `${bridgingTransitions.posterTitle} — poster presentation`,
        description: bridgingTransitions.session.detail,
        startDate: '2026-09-19T15:35:00-07:00',
        endDate: '2026-09-19T16:35:00-07:00',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        superEvent: {
          '@type': 'Event',
          name: bridgingTransitions.session.event,
        },
        location: {
          '@type': 'Place',
          name: 'Li Ka Shing Center 101/102, Stanford University',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Stanford',
            addressRegion: 'CA',
            addressCountry: 'US',
          },
        },
        performer: {
          '@type': 'Person',
          name: 'Cameron Aaron, M.Ed.',
          url: baseUrl,
        },
      },
      {
        '@type': 'CreativeWorkSeries',
        '@id': `${pageUrl}#series`,
        name: `${capstone.shortTitle} Video Series`,
        url: capstone.playlistUrl,
        inLanguage: 'en-US',
        isAccessibleForFree: true,
        creator: { '@type': 'Person', name: 'Cameron Aaron, M.Ed.' },
        hasPart: capstone.videos.map((video) => ({
          '@type': 'VideoObject',
          '@id': `${pageUrl}#${video.id}`,
          name: video.title,
          description: video.description,
          duration: video.duration,
          inLanguage: 'en-US',
          isFamilyFriendly: true,
          uploadDate: capstone.datePublished,
          thumbnailUrl: `${baseUrl}/social/opengraph-image.png`,
          url: video.url,
          contentUrl: video.url,
          embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <section
        aria-labelledby="poster-heading"
        className="relative overflow-hidden border-b border-white/10 py-14 md:py-20"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,211,77,0.18),transparent_55%)]" />
        <div className="container relative z-10 mx-auto px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            {bridgingTransitions.session.event} · {bridgingTransitions.kicker}
          </p>
          <h1
            id="poster-heading"
            className="max-w-5xl text-3xl font-bold leading-tight text-white md:text-5xl"
          >
            {bridgingTransitions.posterTitle}
          </h1>
          <p className="mt-5 max-w-3xl text-base text-gray-300 md:text-lg">
            {bridgingTransitions.premise}
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-sm text-gray-300">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              {bridgingTransitions.presenter}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              {bridgingTransitions.advisor}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
              {bridgingTransitions.category}
            </span>
          </div>
          <p className="mt-4 text-sm text-gray-400">{bridgingTransitions.session.detail}</p>
        </div>
      </section>

      <section aria-labelledby="watch-heading" className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <h2 id="watch-heading" className="mb-2 text-2xl font-bold text-white md:text-3xl">
            Watch the series
          </h2>
          <p className="mb-8 max-w-3xl text-gray-300">
            Five short videos, two to five minutes each, on how thrice-exceptional Black male
            students are identified, what happens to their support at the transition into college,
            and what institutions can do about it.
          </p>

          <PlaylistTheater videos={capstone.videos} playlistId={capstone.playlistId} />

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={capstone.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
            >
              Open the playlist on YouTube
            </a>
            <Link
              href="/capstone"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Read the full capstone
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="why-heading"
        className="border-t border-white/10 py-12 md:py-16"
      >
        <div className="container mx-auto px-6">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h2 id="why-heading" className="mb-4 text-2xl font-bold text-white md:text-3xl">
                Why the videos exist
              </h2>
              <p className="text-gray-300">{bridgingTransitions.problem}</p>
              <p className="mt-4 text-gray-300">{bridgingTransitions.method}</p>
            </div>
            <aside className="rounded-2xl border border-white/10 bg-black/25 p-6 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">
                Reviewed by
              </h3>
              <ul className="space-y-5">
                {bridgingTransitions.reviews.map((review) => (
                  <li key={review.reviewer}>
                    <blockquote className="border-l-2 border-amber-300/40 pl-3 text-gray-200">
                      “{review.quote}”
                    </blockquote>
                    <p className="mt-2 text-sm font-semibold text-white">{review.reviewer}</p>
                    <p className="text-xs text-gray-400">{review.role}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="monday-heading"
        className="border-t border-white/10 py-12 md:py-16"
      >
        <div className="container mx-auto px-6">
          <h2 id="monday-heading" className="mb-2 text-2xl font-bold text-white md:text-3xl">
            What institutions can do Monday
          </h2>
          <p className="mb-8 max-w-3xl text-gray-300">
            Each action is addressed to one office, and each is backed by one video in the series.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {bridgingTransitions.actions.map((item) => (
              <article
                key={item.audience}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-md bg-amber-300/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-200">
                    {item.video}
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white">
                    {item.audience}
                  </h3>
                </div>
                <p className="text-gray-300">{item.action}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="takeaway-heading"
        className="border-t border-white/10 py-12 md:py-16"
      >
        <div className="container mx-auto px-6">
          <h2 id="takeaway-heading" className="mb-8 text-2xl font-bold text-white md:text-3xl">
            Take the poster with you
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {bridgingTransitions.downloads.map((download) => (
              <a
                key={download.href}
                href={download.href}
                download
                className="flex min-h-[44px] flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-amber-300/40 hover:bg-amber-300/[0.06]"
              >
                <span className="text-base font-bold text-white">{download.label}</span>
                <span className="mt-1 text-sm text-gray-400">{download.description}</span>
                <span className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                  Download PDF
                </span>
              </a>
            ))}
          </div>

          <figure className="mt-12 border-l-2 border-amber-300/50 pl-5">
            <blockquote className="text-lg font-medium leading-relaxed text-white md:text-xl">
              “{bridgingTransitions.closing.quote}”
            </blockquote>
            <figcaption className="mt-3 text-sm text-gray-400">
              {bridgingTransitions.closing.attribution}
            </figcaption>
          </figure>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to main portfolio
            </Link>
            <Link
              href="/credentials"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View credential archive
            </Link>
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
