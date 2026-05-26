import { describe, expect, it } from 'vitest';
import robots, { dynamic } from './robots';

describe('robots metadata route', () => {
  it('uses static generation', () => {
    expect(dynamic).toBe('force-static');
  });

  it('returns expected robots policy', () => {
    const result = robots();

    expect(result.host).toBe('cameronaaron.com');
    expect(result.sitemap).toEqual([
      'https://cameronaaron.com/sitemap.xml',
      'https://cameronaaron.com/sitemap-images.xml',
    ]);

    expect(result.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userAgent: '*', allow: '/', disallow: ['/api/'] }),
        expect.objectContaining({ userAgent: 'GPTBot', allow: '/' }),
        expect.objectContaining({ userAgent: 'Google-Extended', allow: '/' }),
      ])
    );
  });
});
