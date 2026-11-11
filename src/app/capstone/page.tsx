import Link from 'next/link';
import { capstone } from '@/data/capstone';
import { getPageUrl, SITE_URL } from '@/data/site';
import { toYouTubeEmbedUrl } from './capstone-logic';
import { buildCapstoneMetadata } from './metadata';
import { SUBPAGE_FONT_PRELOADS, preloadFontFiles } from '../font-preloads';

export const dynamic = 'force-static';

const baseUrl = SITE_URL;
const pageUrl = getPageUrl('/capstone');

export const metadata = buildCapstoneMetadata(pageUrl);

export default function CapstonePage() {
  preloadFontFiles(SUBPAGE_FONT_PRELOADS);
  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${capstone.shortTitle} | Capstone Defense`,
        description: capstone.abstract,
        inLanguage: 'en-US',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Capstone',
            item: pageUrl,
          },
        ],
      },
      {
        '@type': 'ScholarlyArticle',
        '@id': `${pageUrl}#article`,
        headline: capstone.title,
        alternativeHeadline: 'Capstone Defense, Spring 2026',
        abstract: capstone.abstract,
        inLanguage: 'en-US',
        isAccessibleForFree: true,
        datePublished: capstone.datePublished,
        dateModified: capstone.datePublished,
        url: pageUrl,
        mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
        author: {
          '@type': 'Person',
          name: 'Cameron Aaron, M.Ed.',
          url: baseUrl,
        },
        publisher: {
          '@type': 'CollegeOrUniversity',
          name: capstone.institution,
        },
        educationalUse: 'Professional development and institutional training',
        learningResourceType: 'Video series',
        keywords: capstone.keywords.join(', '),
        advisor: {
          '@type': 'Person',
          name: capstone.advisor,
        },
      },
      {
        '@type': 'LearningResource',
        '@id': `${pageUrl}#learning-resource`,
        name: `${capstone.shortTitle} Educational Resource`,
        url: capstone.playlistUrl,
        inLanguage: 'en-US',
        educationalUse: 'Professional development',
        learningResourceType: ['Video', 'Training material'],
        teaches: [
          'Identification challenges for thrice-exceptional Black male students',
          'Transition barriers between K-12 and higher education',
          'Strength-based and culturally responsive support design',
          'Institution-level recommendations for student success',
        ],
        audience: {
          '@type': 'EducationalAudience',
          educationalRole: 'educator',
        },
      },
      {
        '@type': 'CreativeWorkSeries',
        '@id': `${pageUrl}#series`,
        name: `${capstone.shortTitle} Video Series`,
        creator: {
          '@type': 'Person',
          name: 'Cameron Aaron, M.Ed.',
        },
        inLanguage: 'en-US',
        isAccessibleForFree: true,
        url: capstone.playlistUrl,
        hasPart: capstone.videos.map((video) => ({
          '@type': 'VideoObject',
          '@id': `${pageUrl}#${video.id}`,
          name: video.title,
          description: video.description,
          duration: video.duration,
          inLanguage: 'en-US',
          isFamilyFriendly: true,
          thumbnailUrl: `${baseUrl}/social/opengraph-image.png`,
          url: video.url,
          contentUrl: video.url,
          ...(toYouTubeEmbedUrl(video.url) ? { embedUrl: toYouTubeEmbedUrl(video.url) } : {}),
          keywords: [video.focusArea, ...capstone.keywords.slice(0, 4)].join(', '),
          uploadDate: capstone.datePublished,
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-foreground/10 py-20">
        <div className="container relative z-10 mx-auto px-6">
          <p className="mb-4 text-xs font-semibold text-primary">Capstone Defense</p>
          <h1 className="max-w-5xl font-display text-4xl font-medium leading-[1.08] text-foreground md:text-6xl">
            {capstone.title}
          </h1>
          <p className="mt-6 max-w-4xl text-lg text-muted-foreground">{capstone.abstract}</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1">{capstone.institution}</span>
            <span className="rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1">{capstone.term}</span>
            <span className="rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1">Advisor: {capstone.advisor}</span>
          </div>
          <div className="mt-8">
            <div className="flex flex-wrap gap-3">
              <a
                href={capstone.playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-secondary"
              >
                Watch Full YouTube Playlist
              </a>
              <Link
                href="/"
                className="inline-flex items-center min-h-[44px] rounded-full border border-foreground/15 bg-surface px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground/45"
              >
                Back to main portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <article className="rounded-2xl border border-foreground/10 bg-surface p-8 lg:col-span-3">
              <h2 className="mb-4 text-2xl font-bold text-foreground">Project Objectives</h2>
              <ul className="space-y-3 text-muted-foreground">
                {capstone.objectives.map((objective) => (
                  <li key={objective} className="rounded-lg border border-foreground/10 bg-surface/20 px-4 py-3">
                    {objective}
                  </li>
                ))}
              </ul>

              <h2 className="mb-4 mt-10 text-2xl font-bold text-foreground">Audience and Practical Use</h2>
              <p className="text-muted-foreground">
                This capstone was designed as an applied professional-development resource for higher-education teams.
                It focuses on translation: turning research and lived experience into concrete recommendations that can
                be used in disability services, advising, training, and institutional policy conversations.
              </p>
            </article>

            <aside className="rounded-2xl border border-foreground/10 bg-surface p-8 lg:col-span-2">
              <h2 className="mb-4 text-xl font-bold text-foreground">High-Intent Topics</h2>
              <div className="flex flex-wrap gap-2">
                {capstone.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-md border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6">
          <h2 className="mb-8 text-3xl font-bold text-foreground">Five-Video Series</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {capstone.videos.map((video) => (
              <article
                id={video.id}
                key={video.id}
                className="rounded-2xl border border-foreground/10 bg-surface p-6"
              >
                <p className="mb-2 text-xs font-semibold text-primary">{video.focusArea}</p>
                <h3 className="text-lg font-bold text-foreground">{video.title}</h3>
                <p className="mt-3 text-muted-foreground">{video.description}</p>
                <p className="mt-4 text-sm text-muted-foreground">Estimated runtime: {video.duration.replace('PT', '').toLowerCase()}</p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center rounded-full border border-foreground/15 bg-surface px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-foreground/45"
                >
                  Watch on YouTube
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
