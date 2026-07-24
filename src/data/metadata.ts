import type { Metadata } from 'next';
import { getPageUrl, SITE_URL } from './site';

/** SEO keyword catalog for the root layout. Kept as its own named export so
 *  it's independently testable (no duplicates, no empty entries) without
 *  pulling in the rest of the metadata object. */
export const SEO_KEYWORDS: readonly string[] = [
  'Cameron Aaron',
  'Aaron Cameron',
  'Cameron Aaron official site',
  'Cameron Aaron portfolio',
  'Medical Resume',
  'Healthcare Resume',
  'Software Engineer',
  'Security Researcher',
  'Cybersecurity',
  'DevOps',
  'Cloud Engineering',
  'AI Engineer',
  'Machine Learning',
  'Full-Stack Developer',
  'Python Developer',
  'TypeScript Developer',
  'React Developer',
  'Next.js Developer',
  'Systems Administrator',
  'Bioinformatics',
  'EMT',
  'CNA',
  'Advanced Cardiovascular Life Support',
  'Pediatric Advanced Life Support',
  'Basic Life Support',
  'Neonatal Resuscitation Program',
  'Certified EKG Technician',
  'Phlebotomy',
  'Nurse Practitioner',
  'NP School',
  'Nursing Prerequisites',
  'Nursing Program Prerequisite Coursework',
  'Aerospace Medicine',
  'Healthcare Technology',
  'Clinical Research',
  'Biopsychology',
  'Neuroscience',
  'Public Health Operations',
  'Emergency Medical Technician',
  'Patient-Centered Care',
  'Community Health Worker',
  'Clinical Data Analysis',
  'Medical Imaging',
  'EEG Research',
  'Cognitive Diversity',
  'Cognitive Diversity in Education',
  'M.Ed. Cognitive Diversity',
  'Twice Exceptional Education',
  'Thrice-Exceptional',
  'Thrice-Exceptional Black Male Students',
  'Twice-Exceptional',
  'Gifted Education',
  'Higher Education Transition',
  'Higher Education Transition Support',
  'Disability Services',
  'Arts-Based Research',
  'Culturally Responsive Education',
  'Neurodiversity in Education',
  'Black Male Student Success',
  'Black Male Student Success in Higher Education',
  'Intersectionality',
  'Educational Equity',
  'Educational Video Content',
  'Capstone Research',
  'Capstone Defense',
  'Educational Research Methods',
  'Arts-Based Action Research',
  'Community Cultural Wealth',
  'Strength-Based Education',
  'Culturally Responsive Teaching',
  'Disability Services in Higher Education',
  'Educational Equity in Higher Education',
  'Black Male College Achievement',
  'Higher Education Disability Transition',
  'Institutional Training',
  'Educational Video Series',
] as const;

const SITE_TITLE = 'Cameron Aaron, M.Ed. | EMT, CNA, Software Engineer';
const SOCIAL_IMAGE_ALT = 'Cameron Aaron | EMT, CNA, Software Engineer, Security Researcher & Future NP';

/** Assembles the root layout's <head> metadata. Extracted from
 *  src/app/layout.tsx so the ~90-entry keyword catalog and the OpenGraph/
 *  Twitter/robots/icons configuration are independently testable data,
 *  not an inline object the modularization sweep can't see into. */
export function buildRootMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'Cameron Aaron Official Site | EMT, CNA, Software Engineer',
      template: '%s | Cameron Aaron',
    },
    description:
      'Official website of Cameron Aaron, EMT and CNA with software engineering, security research, and graduate arts-based capstone research on thrice-exceptional Black male students in higher education transition.',
    keywords: [...SEO_KEYWORDS],
    authors: [{ name: 'Cameron Aaron, M.Ed.', url: SITE_URL }],
    creator: 'Cameron Aaron, M.Ed.',
    publisher: 'Cameron Aaron, M.Ed.',
    alternates: {
      canonical: getPageUrl('/'),
      languages: {
        'en-US': '/',
        en: '/',
      },
      types: {
        'application/rss+xml': getPageUrl('/feed.xml'),
      },
    },
    icons: {
      icon: [
        { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      other: [
        {
          rel: 'mask-icon',
          url: '/icons/icon-512x512.png',
        },
      ],
    },
    openGraph: {
      title: SITE_TITLE,
      description:
        'Official site of Cameron Aaron, M.Ed. — healthcare credentials, software engineering work, and arts-based capstone research on thrice-exceptional Black male students and higher education transition.',
      url: getPageUrl('/'),
      siteName: 'Cameron Aaron',
      images: [
        {
          url: getPageUrl('/social/opengraph-image.png'),
          width: 1200,
          height: 630,
          alt: SOCIAL_IMAGE_ALT,
          type: 'image/png',
        },
      ],
      locale: 'en_US',
      type: 'profile',
      firstName: 'Cameron',
      lastName: 'Aaron',
      username: 'cameronaaron',
      gender: 'male',
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_TITLE,
      description:
        'Official portfolio of Cameron Aaron, M.Ed. featuring healthcare credentials, technical work, and graduate arts-based research in gifted education and higher education transition.',
      images: {
        url: getPageUrl('/social/twitter-image.png'),
        alt: SOCIAL_IMAGE_ALT,
      },
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    category: 'healthcare and technology',
    classification: 'Professional Resume Website',
    applicationName: 'Cameron Aaron Medical Resume',
    referrer: 'origin-when-cross-origin',
    appleWebApp: {
      capable: true,
      title: 'Cameron Aaron, M.Ed.',
      statusBarStyle: 'black-translucent',
    },
    formatDetection: {
      telephone: false,
      email: true,
      address: false,
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_SITE_VERIFICATION,
      other: process.env.BING_SITE_VERIFICATION
        ? {
            'msvalidate.01': process.env.BING_SITE_VERIFICATION,
          }
        : undefined,
    },
    other: {
      'geo.region': 'US-CA',
      'geo.placename': 'Los Angeles',
      ICBM: '34.0522, -118.2437',
      'theme-color': '#0cbdf2',
    },
  };
}

/** Speculation Rules (rendered as a `type="speculationrules"` script by the
 *  root layout): every page here is a static export, so a prefetched
 *  navigation is the complete document — hover-to-tap latency becomes the
 *  whole page load. `moderate` prefetches on link hover; `conservative`
 *  prerenders on pointerdown (the click is already committed by then, so the
 *  prerender never wastes work). Non-supporting browsers ignore the script
 *  type entirely — pure progressive enhancement. `/resume/*` PDFs are
 *  excluded: multi-hundred-KB downloads a stray hover should never trigger. */
export const SPECULATION_RULES = {
  prefetch: [
    {
      where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/resume/*' } }] },
      eagerness: 'moderate',
    },
  ],
  prerender: [
    {
      where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/resume/*' } }] },
      eagerness: 'conservative',
    },
  ],
} as const;

/** Root layout's <meta name="viewport">-adjacent Next.js viewport export.
 *  Extracted alongside buildRootMetadata for the same reason — data, not
 *  inline component config. */
export function buildRootViewport() {
  return {
    themeColor: [
      { media: '(prefers-color-scheme: dark)', color: '#0cbdf2' },
      { media: '(prefers-color-scheme: light)', color: '#0cbdf2' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
    colorScheme: 'dark',
  };
}
