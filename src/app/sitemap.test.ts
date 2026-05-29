import { describe, expect, it } from 'vitest';
import sitemap, { dynamic } from './sitemap';

describe('sitemap metadata route', () => {
  it('uses static generation', () => {
    expect(dynamic).toBe('force-static');
  });

  it('returns homepage and static detail page sitemap entries', () => {
    const result = sitemap();

    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({
      url: 'https://cameronaaron.com/',
      changeFrequency: 'weekly',
      priority: 1,
    });
    expect(result[1]).toMatchObject({
      url: 'https://cameronaaron.com/capstone',
      changeFrequency: 'monthly',
      priority: 0.9,
    });
    expect(result[2]).toMatchObject({
      url: 'https://cameronaaron.com/credentials',
      changeFrequency: 'monthly',
      priority: 0.9,
    });
    expect(result[3]).toMatchObject({
      url: 'https://cameronaaron.com/internet',
      changeFrequency: 'monthly',
      priority: 0.85,
    });
    expect(result[0].lastModified).toBeInstanceOf(Date);
    expect(result[1].lastModified).toBeInstanceOf(Date);
    expect(result[2].lastModified).toBeInstanceOf(Date);
    expect(result[3].lastModified).toBeInstanceOf(Date);
  });
});
