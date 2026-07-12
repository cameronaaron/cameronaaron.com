import type { Metadata } from 'next';

/** Extracted from src/app/credentials/page.tsx — see capstone/metadata.ts
 *  for why page metadata is data, not inline component config. */
export function buildCredentialsMetadata(pageUrl: string): Metadata {
  return {
    title: 'Credentials and Verification Links',
    description:
      'Full credential archive including technical specializations, accessibility training, and official academic verification links.',
    alternates: {
      canonical: '/credentials',
    },
    openGraph: {
      title: 'Credentials and Verification | Cameron Aaron',
      description:
        'Direct links for verifying certifications, coursework credentials, and academic award records.',
      url: pageUrl,
      type: 'article',
    },
  };
}
