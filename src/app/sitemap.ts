import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/data/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/capstone`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/credentials`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      // The QR code on the printed SNS26 poster resolves here. Highest
      // priority of the detail pages because it is the only one with an
      // off-web entry point that cannot be redeployed.
      url: `${baseUrl}/bridging-transitions`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/internet`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
  ]
}
