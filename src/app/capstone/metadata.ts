import type { Metadata } from 'next';
import { getPageUrl } from '@/data/site';

const TITLE = 'Bridging Transitions | Capstone Defense';

/** Extracted from src/app/capstone/page.tsx — page metadata is data, not
 *  inline component config (same rationale as src/data/metadata.ts).
 *  Takes the page's own computed URL rather than recomputing it, so there's
 *  one source of truth per page (shared with the JSON-LD schema graph). */
export function buildCapstoneMetadata(pageUrl: string): Metadata {
  return {
    title: 'Bridging Transitions Capstone Defense',
    description:
      "Bridging Transitions is Cameron Aaron's Spring 2026 M.Ed. capstone: a five-part educational video series on thrice-exceptional Black male students and higher education transition.",
    alternates: {
      canonical: '/capstone',
    },
    keywords: [
      'Bridging Transitions capstone',
      'capstone defense spring 2026',
      'thrice-exceptional Black male students',
      'arts-based research education',
      'higher education transition support',
      'gifted education and disability',
      'culturally responsive education',
      'community cultural wealth',
      'strength-based education',
      'educational video series',
    ],
    openGraph: {
      title: TITLE,
      description:
        'A five-video arts-based capstone project translating scholarship and lived experience into practical institutional recommendations for supporting thrice-exceptional Black male students.',
      url: pageUrl,
      type: 'article',
      images: [
        {
          url: getPageUrl('/social/opengraph-image.png'),
          width: 1200,
          height: 630,
          alt: 'Bridging Transitions Capstone Defense',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description:
        'Spring 2026 capstone on thrice-exceptional Black male students, higher education transition, and institutional change.',
      images: [getPageUrl('/social/twitter-image.png')],
    },
  };
}
