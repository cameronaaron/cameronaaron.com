import { describe, expect, it } from 'vitest';

import { capstone, type CapstoneVideo } from '@/data/capstone';
import {
  buildEmbedSrc,
  buildEpisodeViews,
  EMBED_ORIGIN,
  formatRuntime,
  SECONDS_PER_MINUTE,
  toEpisodeView,
} from './playlist-theater-logic';

/** A video shaped like the data file's, with individual fields overridden. */
function makeVideo(overrides: Partial<CapstoneVideo> = {}): CapstoneVideo {
  return {
    id: 'video-1',
    youtubeId: 'zVz1OpLugZo',
    title: 'Video 1: Intro - How identification systems fail thrice-exceptional Black males',
    description: 'Fallback description.',
    duration: 'PT2M30S',
    focusArea: 'Identification challenges',
    url: 'https://youtu.be/zVz1OpLugZo',
    ...overrides,
  };
}

describe('formatRuntime', () => {
  it('renders minutes and zero-padded seconds', () => {
    expect(formatRuntime('PT2M30S')).toBe('2:30');
    expect(formatRuntime('PT2M5S')).toBe('2:05');
  });

  it('handles a duration missing either component', () => {
    expect(formatRuntime('PT3M')).toBe('3:00');
    expect(formatRuntime('PT45S')).toBe('0:45');
  });

  it('carries overflowing seconds into minutes rather than printing 1:90', () => {
    expect(formatRuntime('PT1M90S')).toBe('2:30');
    expect(formatRuntime(`PT0M${SECONDS_PER_MINUTE}S`)).toBe('1:00');
  });

  it('returns undefined rather than a partial parse for a shape it does not understand', () => {
    // Anchored regex: an hour component or trailing junk must not silently
    // parse as "the minutes and seconds I happened to recognise".
    expect(formatRuntime('PT1H2M30S')).toBeUndefined();
    expect(formatRuntime('2:30')).toBeUndefined();
    expect(formatRuntime('')).toBeUndefined();
    expect(formatRuntime('PT')).toBeUndefined();
  });

  it('is anchored at both ends — surrounding junk rejects the whole string', () => {
    // Both anchors carry weight, and each is checked against a string whose
    // VALID part would otherwise parse cleanly. Without them this returns
    // '2:30' for input that is not a duration at all.
    expect(formatRuntime('PT2M30Sand more')).toBeUndefined();
    expect(formatRuntime('about PT2M30S')).toBeUndefined();
  });

  it('reads multi-digit minutes, not just the first digit', () => {
    expect(formatRuntime('PT12M30S')).toBe('12:30');
    expect(formatRuntime('PT120M')).toBe('120:00');
  });

  it('treats a zero-length duration as absent', () => {
    expect(formatRuntime('PT0M0S')).toBeUndefined();
  });
});

describe('buildEmbedSrc', () => {
  it('targets the no-cookie origin and keeps the queue on this playlist', () => {
    const src = buildEmbedSrc('zVz1OpLugZo', 'PL123', false);

    expect(src.startsWith(`${EMBED_ORIGIN}/embed/zVz1OpLugZo?`)).toBe(true);

    const params = new URL(src).searchParams;
    expect(params.get('list')).toBe('PL123');
    expect(params.get('listType')).toBe('playlist');
    expect(params.get('rel')).toBe('0');
    expect(params.get('playsinline')).toBe('1');
  });

  it('omits autoplay unless the visitor initiated playback', () => {
    expect(new URL(buildEmbedSrc('abc', 'PL1', false)).searchParams.has('autoplay')).toBe(false);
    expect(new URL(buildEmbedSrc('abc', 'PL1', true)).searchParams.get('autoplay')).toBe('1');
  });

  it('never points at the cookie-setting youtube.com origin', () => {
    expect(EMBED_ORIGIN).toBe('https://www.youtube-nocookie.com');
    expect(buildEmbedSrc('abc', 'PL1', true)).not.toContain('//www.youtube.com');
  });
});

describe('toEpisodeView', () => {
  it('splits a well-formed title into rank, headline and summary', () => {
    const view = toEpisodeView(makeVideo(), 0);

    expect(view.badge).toBe('V1');
    expect(view.rank).toBe('Video 1');
    expect(view.headline).toBe('Intro');
    expect(view.summary).toBe('How identification systems fail thrice-exceptional Black males');
    expect(view.runtime).toBe('2:30');
    expect(view.youtubeId).toBe('zVz1OpLugZo');
  });

  it('splits on the first " - " only, so hyphenated words survive', () => {
    const view = toEpisodeView(
      makeVideo({
        title: 'Video 2: Transition Barriers - The cliff between K-12 support and higher education',
      }),
      1,
    );

    expect(view.headline).toBe('Transition Barriers');
    expect(view.summary).toBe('The cliff between K-12 support and higher education');
    expect(view.badge).toBe('V2');
  });

  it('only matches a title that STARTS with the rank, not one that merely contains it', () => {
    const view = toEpisodeView(
      makeVideo({ title: 'Bonus Video 1: Intro - Summary', description: 'Fallback description.' }),
      0,
    );

    // Unanchored, this would silently relabel a differently-titled video as
    // "Video 1" and throw away the words before the match.
    expect(view.headline).toBe('Bonus Video 1: Intro - Summary');
    expect(view.summary).toBe('Fallback description.');
  });

  it('reads a multi-digit episode number', () => {
    const view = toEpisodeView(makeVideo({ title: 'Video 12: Coda - The last one' }), 11);

    expect(view.rank).toBe('Video 12');
    expect(view.headline).toBe('Coda');
  });

  it('tolerates irregular spacing without letting it bleed into the parsed text', () => {
    // Each case pins that the separator is consumed WHOLE. A looser pattern
    // still "matches" but leaves the stray space attached to the neighbouring
    // field, which shows up as a ragged indent in the rail.
    expect(toEpisodeView(makeVideo({ title: 'Video 1:Intro - Summary' }), 0).headline).toBe('Intro');

    const wideBefore = toEpisodeView(makeVideo({ title: 'Video 1: Intro  - Summary' }), 0);
    expect(wideBefore.headline).toBe('Intro');

    const wideAfter = toEpisodeView(makeVideo({ title: 'Video 1: Intro -  Summary' }), 0);
    expect(wideAfter.summary).toBe('Summary');
  });

  it('degrades to the raw title and description when the title is worded differently', () => {
    const view = toEpisodeView(
      makeVideo({ title: 'A differently worded title', description: 'Fallback description.' }),
      2,
    );

    expect(view.rank).toBe('Video 3');
    expect(view.headline).toBe('A differently worded title');
    expect(view.summary).toBe('Fallback description.');
  });

  it('renders an empty runtime rather than "undefined" for an unparseable duration', () => {
    expect(toEpisodeView(makeVideo({ duration: 'PT1H' }), 0).runtime).toBe('');
  });
});

describe('buildEpisodeViews', () => {
  it('preserves playlist order and numbers episodes from one', () => {
    const views = buildEpisodeViews(capstone.videos);

    expect(views).toHaveLength(capstone.videos.length);
    expect(views.map((view) => view.badge)).toEqual(['V1', 'V2', 'V3', 'V4', 'V5']);
    expect(views.map((view) => view.youtubeId)).toEqual(
      capstone.videos.map((video) => video.youtubeId),
    );
  });

  it('gives every real episode a headline, summary and runtime', () => {
    for (const view of buildEpisodeViews(capstone.videos)) {
      expect(view.headline.length, `${view.badge} has no headline`).toBeGreaterThan(0);
      expect(view.summary.length, `${view.badge} has no summary`).toBeGreaterThan(0);
      expect(view.runtime, `${view.badge} has no runtime`).toMatch(/^\d+:\d{2}$/);
    }
  });

  it('returns an empty list for an empty series', () => {
    expect(buildEpisodeViews([])).toEqual([]);
  });
});
