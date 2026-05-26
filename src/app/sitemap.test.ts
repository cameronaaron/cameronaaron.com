import { describe, expect, it } from 'vitest';
import sitemap, { dynamic } from './sitemap';

describe('sitemap metadata route', () => {
  it('uses static generation', () => {
    expect(dynamic).toBe('force-static');
  });

  it('returns homepage and capstone sitemap entries', () => {
    const result = sitemap();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      url: 'https://cameronaaron.com/',
      changeFrequency: 'weekly',
      priority: 1,
    });
    expect(result[1]).toMatchObject({
      url: 'https://cameronaaron.com/capstone.html',
      changeFrequency: 'monthly',
      priority: 0.9,
    });
    expect(result[0].lastModified).toBeInstanceOf(Date);
    expect(result[1].lastModified).toBeInstanceOf(Date);
  });
});
