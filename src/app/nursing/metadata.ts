import type { Metadata } from 'next';

/**
 * Unlisted by design: this page tracks Cameron's own nursing-school
 * applications (GPA, transcript detail, admissions-readiness notes) and
 * must stay reachable only by direct URL. `robots: { index: false, follow:
 * false }` is the visibility mechanism — it's deliberately omitted from
 * sitemap.ts and navigation.ts too (see the plan file), and no JSON-LD is
 * emitted on this page.
 */
export function buildNursingMetadata(pageUrl: string): Metadata {
  return {
    title: 'Nursing Program Tracker',
    description: 'Private application tracker for California BSN and MSN-entry nursing programs.',
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: '/nursing',
    },
    openGraph: {
      title: 'Nursing Program Tracker',
      description: 'Private application tracker for California BSN and MSN-entry nursing programs.',
      url: pageUrl,
      type: 'website',
    },
  };
}
