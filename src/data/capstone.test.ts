import { describe, expect, it } from 'vitest';

import { capstone } from './capstone';

describe('capstone data contract', () => {
  it('keeps required publication and video metadata complete', () => {
    expect(capstone.title.length).toBeGreaterThan(20);
    expect(capstone.playlistUrl).toContain('youtube.com/playlist');
    expect(capstone.playlistUrl).toContain(capstone.playlistId);
    expect(capstone.keywords.length).toBeGreaterThan(5);
    expect(capstone.objectives.length).toBeGreaterThan(2);
    expect(capstone.videos.length).toBe(5);

    for (const video of capstone.videos) {
      expect(video.id).toMatch(/^video-\d+$/);
      expect(video.duration).toMatch(/^PT\d+M\d+S$/);
      expect(video.url).toMatch(/^https?:\/\//);
      // youtubeId is the primary key every embed src is built from, so a typo
      // here is a silently-broken player, not a type error. Pin the format AND
      // pin that it still agrees with the url it was extracted from — the two
      // must never drift apart.
      expect(video.youtubeId).toMatch(/^[\w-]{11}$/);
      expect(video.url).toContain(video.youtubeId);
      expect(video.title.length).toBeGreaterThan(10);
      expect(video.description.length).toBeGreaterThan(20);
    }

    const ids = capstone.videos.map((video) => video.youtubeId);
    expect(new Set(ids).size, 'two videos share a youtubeId').toBe(ids.length);
  });
});
