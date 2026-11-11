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
        className="relative overflow-hidden border-b border-foreground/10 py-14 md:py-20"
      >
        <div className="container relative z-10 mx-auto px-6">
          <p className="mb-4 text-xs font-semibold text-warning">
            {bridgingTransitions.session.event} · {bridgingTransitions.kicker}
          </p>
          <h1
            id="poster-heading"
            className="max-w-5xl text-3xl font-bold leading-tight text-foreground md:text-5xl"
          >
            {bridgingTransitions.posterTitle}
          </h1>
          <p className="mt-5 max-w-3xl text-base text-muted-foreground md:text-lg">
            {bridgingTransitions.premise}
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1">
              {bridgingTransitions.presenter}
            </span>
            <span className="rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1">
              {bridgingTransitions.advisor}
            </span>
            <span className="rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1">
              {bridgingTransitions.category}
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{bridgingTransitions.session.detail}</p>
        </div>
      </section>

      <section aria-labelledby="watch-heading" className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <h2 id="watch-heading" className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
            Watch the series
          </h2>
          <p className="mb-8 max-w-3xl text-muted-foreground">
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
              className="inline-flex min-h-[44px] items-center rounded-lg border border-warning/40 bg-warning/10 px-4 py-2 text-sm font-semibold text-warning transition hover:bg-warning/20"
            >
              Open the playlist on YouTube
            </a>
            <Link
              href="/capstone"
              className="inline-flex min-h-[44px] items-center min-h-[44px] rounded-full border border-foreground/15 bg-surface px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground/45"
            >
              Read the full capstone
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="why-heading"
        className="border-t border-foreground/10 py-12 md:py-16"
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h2 id="why-heading" className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
                Why the videos exist
              </h2>
              <p className="text-muted-foreground">{bridgingTransitions.problem}</p>
              <p className="mt-4 text-muted-foreground">{bridgingTransitions.method}</p>
            </div>
            <aside className="rounded-2xl border border-foreground/10 bg-surface p-6 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-warning">
                Reviewed by
              </h3>
              <ul className="space-y-5">
                {bridgingTransitions.reviews.map((review) => (
                  <li key={review.reviewer}>
                    <blockquote className="border-l-2 border-warning/40 pl-3 text-muted-foreground">
                      “{review.quote}”
                    </blockquote>
                    <p className="mt-2 text-sm font-semibold text-foreground">{review.reviewer}</p>
                    <p className="text-xs text-muted-foreground">{review.role}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="monday-heading"
        className="border-t border-foreground/10 py-12 md:py-16"
      >
        <div className="container mx-auto px-6">
          <h2 id="monday-heading" className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
            What institutions can do Monday
          </h2>
          <p className="mb-8 max-w-3xl text-muted-foreground">
            Each action is addressed to one office, and each is backed by one video in the series.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bridgingTransitions.actions.map((item) => (
              <article
                key={item.audience}
                className="rounded-2xl border border-foreground/10 bg-surface p-6"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-md bg-warning/15 px-2 py-0.5 font-mono text-xs font-bold text-warning">
                    {item.video}
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    {item.audience}
                  </h3>
                </div>
                <p className="text-muted-foreground">{item.action}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="takeaway-heading"
        className="border-t border-foreground/10 py-12 md:py-16"
      >
        <div className="container mx-auto px-6">
          <h2 id="takeaway-heading" className="mb-8 text-2xl font-bold text-foreground md:text-3xl">
            Take the poster with you
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bridgingTransitions.downloads.map((download) => (
              <a
                key={download.href}
                href={download.href}
                download
                className="flex min-h-[44px] flex-col rounded-2xl border border-foreground/10 bg-surface p-6 transition hover:border-warning/40 hover:bg-warning/[0.06]"
              >
                <span className="text-base font-bold text-foreground">{download.label}</span>
                <span className="mt-1 text-sm text-muted-foreground">{download.description}</span>
                <span className="mt-3 text-xs font-semibold text-warning">
                  Download PDF
                </span>
              </a>
            ))}
          </div>

          <figure className="mt-12 border-l-2 border-warning/50 pl-5">
            <blockquote className="text-lg font-medium leading-relaxed text-foreground md:text-xl">
              “{bridgingTransitions.closing.quote}”
            </blockquote>
            <figcaption className="mt-3 text-sm text-muted-foreground">
              {bridgingTransitions.closing.attribution}
            </figcaption>
          </figure>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center min-h-[44px] rounded-full border border-foreground/15 bg-surface px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground/45"
            >
              Back to main portfolio
            </Link>
            <Link
              href="/credentials"
              className="inline-flex min-h-[44px] items-center min-h-[44px] rounded-full border border-foreground/15 bg-surface px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground/45"
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
