import { describe, expect, it } from 'vitest';
import sitemap, { dynamic } from './sitemap';

describe('sitemap metadata route', () => {
  it('uses static generation', () => {
    expect(dynamic).toBe('force-static');
  });

  it('returns homepage and static detail page sitemap entries', () => {
    const result = sitemap();

    // Keyed by URL rather than by array index: the previous index-based form
    // meant inserting a route in the middle silently re-pointed four
    // assertions at the wrong entries instead of failing.
    const byUrl = new Map(result.map((entry) => [entry.url, entry]));

    expect([...byUrl.keys()]).toEqual([
      'https://cameronaaron.com/',
      'https://cameronaaron.com/capstone',
      'https://cameronaaron.com/credentials',
      'https://cameronaaron.com/bridging-transitions',
      'https://cameronaaron.com/internet',
    ]);
    expect(byUrl.size, 'a duplicate URL would collapse in the map above').toBe(result.length);

    expect(byUrl.get('https://cameronaaron.com/')).toMatchObject({
      changeFrequency: 'weekly',
      priority: 1,
    });
    expect(byUrl.get('https://cameronaaron.com/capstone')).toMatchObject({
      changeFrequency: 'monthly',
      priority: 0.9,
    });
    expect(byUrl.get('https://cameronaaron.com/credentials')).toMatchObject({
      changeFrequency: 'monthly',
      priority: 0.9,
    });
    expect(byUrl.get('https://cameronaaron.com/bridging-transitions')).toMatchObject({
      changeFrequency: 'monthly',
      priority: 0.9,
    });
    expect(byUrl.get('https://cameronaaron.com/internet')).toMatchObject({
      changeFrequency: 'monthly',
      priority: 0.85,
    });

    for (const entry of result) {
      expect(entry.lastModified, `${entry.url} is missing lastModified`).toBeInstanceOf(Date);
    }
  });
});
