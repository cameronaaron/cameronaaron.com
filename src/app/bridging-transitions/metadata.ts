import type { Metadata } from 'next';
import { getPageUrl } from '@/data/site';

const TITLE = 'Bridging Transitions | Stanford Neurodiversity Summit 2026';

const DESCRIPTION =
  'Watch the five-video Bridging Transitions series on thrice-exceptional Black male students and the K–12 to higher-education transition — the companion page to Cameron Aaron’s Stanford Neurodiversity Summit 2026 poster.';

/** Page metadata for /bridging-transitions, extracted from page.tsx per the
 *  module-level-data-catalog sweep (ENGINEERING-STANDARDS §6 item 7), same
 *  shape as every other route's metadata module.
 *
 *  This route is the destination of a QR code on a physically printed poster,
 *  which makes its URL effectively permanent: paper cannot be redeployed.
 *  Never rename the route or change `alternates.canonical` — every printed
 *  copy would 404 with no way to fix it. */
export function buildBridgingTransitionsMetadata(pageUrl: string): Metadata {
  return {
    title: 'Bridging Transitions — Video Series',
    description: DESCRIPTION,
    alternates: {
      canonical: '/bridging-transitions',
    },
    keywords: [
      'Bridging Transitions',
      'Stanford Neurodiversity Summit 2026',
      'thrice-exceptional Black male students',
      'twice exceptional higher education',
      'neurodiversity summit poster',
      'gifted education and disability',
      'K-12 to college transition',
      'strength-based education',
      'culturally responsive education',
      'educational video series',
    ],
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: pageUrl,
      type: 'article',
      images: [
        {
          url: getPageUrl('/social/opengraph-image.png'),
          width: 1200,
          height: 630,
          alt: 'Bridging Transitions — a strength-based video series for thrice-exceptional Black male students',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description:
        'Five short videos on thrice-exceptional Black male students and the transition into higher education. Poster companion, Stanford Neurodiversity Summit 2026.',
      images: [getPageUrl('/social/twitter-image.png')],
    },
  };
}
