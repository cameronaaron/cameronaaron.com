import { describe, expect, it } from 'vitest';
import { toYouTubeEmbedUrl } from './capstone-logic';

describe('toYouTubeEmbedUrl', () => {
  it('converts youtu.be short URL', () => {
    expect(toYouTubeEmbedUrl('https://youtu.be/abc123xyz')).toBe(
      'https://www.youtube.com/embed/abc123xyz'
    );
  });

  it('converts http youtu.be short URL', () => {
    expect(toYouTubeEmbedUrl('http://youtu.be/vidID99')).toBe(
      'https://www.youtube.com/embed/vidID99'
    );
  });

  it('converts long watch URL with v= param', () => {
    expect(toYouTubeEmbedUrl('https://www.youtube.com/watch?v=abc123xyz')).toBe(
      'https://www.youtube.com/embed/abc123xyz'
    );
  });

  it('converts long URL with additional query params after v=', () => {
    expect(toYouTubeEmbedUrl('https://www.youtube.com/watch?v=abc123xyz&feature=share')).toBe(
      'https://www.youtube.com/embed/abc123xyz'
    );
  });

  it('converts URL where v= is not the first param', () => {
    expect(toYouTubeEmbedUrl('https://www.youtube.com/watch?feature=share&v=def456')).toBe(
      'https://www.youtube.com/embed/def456'
    );
  });

  it('requires the youtu.be short-URL pattern to be anchored at the start', () => {
    // Without the `^` anchor, this substring would still match mid-string
    // even though the URL isn't actually a youtu.be link.
    expect(toYouTubeEmbedUrl('not-a-url https://youtu.be/abc123')).toBeUndefined();
  });

  it('returns undefined for a non-YouTube URL', () => {
    expect(toYouTubeEmbedUrl('https://example.com/not-youtube')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(toYouTubeEmbedUrl('')).toBeUndefined();
  });

  it('strips trailing slash from youtu.be id — captures only up to the slash', () => {
    // The regex [^?&/]+ stops at the trailing slash, capturing 'abc123'
    expect(toYouTubeEmbedUrl('https://youtu.be/abc123/')).toBe(
      'https://www.youtube.com/embed/abc123'
    );
  });
});
