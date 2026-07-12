import type { MetadataRoute } from 'next'
import { getPageUrl, SITE_URL } from '@/data/site'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      // Explicitly allow common AI crawlers for AI indexing
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
    sitemap: [
      getPageUrl('/sitemap.xml'),
      getPageUrl('/sitemap-images.xml'),
    ],
    host: SITE_URL.replace(/^https?:\/\//, ''),
  }
}
