import type { Metadata } from 'next';

/** Extracted from src/app/internet/page.tsx — see capstone/metadata.ts for
 *  why page metadata is data, not inline component config. */
export function buildInternetMetadata(pageUrl: string): Metadata {
  return {
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
}
