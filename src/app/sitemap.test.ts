import { describe, expect, it } from 'vitest';
import sitemap, { dynamic } from './sitemap';

describe('sitemap metadata route', () => {
  it('uses static generation', () => {
    expect(dynamic).toBe('force-static');
  });

  it('returns canonical homepage sitemap entry', () => {
    const result = sitemap();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      url: 'https://cameronaaron.com/',
      changeFrequency: 'weekly',
      priority: 1,
    });
    expect(result[0].lastModified).toBeInstanceOf(Date);
  });
});
