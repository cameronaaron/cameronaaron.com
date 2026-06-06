import { describe, expect, it } from 'vitest';

import { capstone } from './capstone';

describe('capstone data contract', () => {
  it('keeps required publication and video metadata complete', () => {
    expect(capstone.title.length).toBeGreaterThan(20);
    expect(capstone.playlistUrl).toContain('youtube.com/playlist');
    expect(capstone.keywords.length).toBeGreaterThan(5);
    expect(capstone.objectives.length).toBeGreaterThan(2);
    expect(capstone.videos.length).toBe(5);

    for (const video of capstone.videos) {
      expect(video.id).toMatch(/^video-\d+$/);
      expect(video.duration).toMatch(/^PT\d+M\d+S$/);
      expect(video.url).toMatch(/^https?:\/\//);
      expect(video.title.length).toBeGreaterThan(10);
      expect(video.description.length).toBeGreaterThan(20);
    }
  });
});
