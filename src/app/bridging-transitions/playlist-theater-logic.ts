import type { CapstoneVideo } from '@/data/capstone';

/** youtube-nocookie.com, not youtube.com: it is the same player without the
 *  tracking cookies being set before the visitor has chosen to press play.
 *  This page is handed to strangers by a printed QR code, so the default has
 *  to be the private one. */
export const EMBED_ORIGIN = 'https://www.youtube-nocookie.com';

/** Seconds of ISO-8601 minute/second duration per unit — named so the parse
 *  below reads as arithmetic rather than as two magic numbers. */
export const SECONDS_PER_MINUTE = 60;

/** `PT2M30S` → `{ minutes: 2, seconds: 30 }`. Anchored and fully matched, so a
 *  duration in any other shape returns undefined rather than a partial parse.
 *
 *  Stryker reports this line's three regex mutants (drop `^`, drop `$`,
 *  `\d+`→`\d`) as Survived. They are not — that is the known
 *  Stryker↔Vitest false positive documented at the top of `stryker.config.mjs`.
 *  Verified 2026-09-05 the way that note prescribes: applying each mutation to
 *  this source by hand and running
 *  `npx vitest run src/app/bridging-transitions/playlist-theater-logic.test.ts`
 *  fails the suite in all three cases (the tests are "is anchored at both ends"
 *  and "reads multi-digit minutes"). Don't spend a second session re-chasing
 *  them; re-verify by hand before believing any future Survived result here. */
const ISO_DURATION = /^PT(?:(\d+)M)?(?:(\d+)S)?$/;

/** `Video 1: Intro - How identification systems fail …` splits into a rank
 *  (`Video 1`), a headline (`Intro`) and the rest. Non-greedy up to the FIRST
 *  ` - ` so hyphenated words inside the summary (`K-12`) are not split on.
 *
 *  Anchored at the start only: a trailing `$` would be dead weight here, since
 *  the greedy `(.+)` already runs to the end of a single-line title. */
const EPISODE_TITLE = /^(Video \d+):\s*(.+?)\s+-\s+(.+)/;

export interface EpisodeView {
  /** Stable DOM id / React key — the data file's own `video-N`. */
  id: string;
  youtubeId: string;
  /** Poster shorthand for the same video: `V1` … `V5`. The printed poster
   *  cites videos this way, so the page has to label them the same. */
  badge: string;
  /** `Video 1`, for screen readers and the numbered rail. */
  rank: string;
  /** Short human headline — `Intro`, `Transition Barriers`. */
  headline: string;
  /** The sentence after the headline. */
  summary: string;
  focusArea: string;
  /** `2:30`, from the ISO-8601 duration. */
  runtime: string;
  url: string;
}

/** ISO-8601 duration → `M:SS`. Returns undefined on anything it cannot fully
 *  parse, so a malformed duration surfaces as a missing runtime rather than as
 *  a confident lie like `NaN:aN`. */
export function formatRuntime(isoDuration: string): string | undefined {
  const match = ISO_DURATION.exec(isoDuration);
  if (!match) return undefined;

  const minutes = Number(match[1] ?? 0);
  const seconds = Number(match[2] ?? 0);
  if (minutes === 0 && seconds === 0) return undefined;

  const carriedMinutes = minutes + Math.floor(seconds / SECONDS_PER_MINUTE);
  const remainingSeconds = seconds % SECONDS_PER_MINUTE;

  return `${carriedMinutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

/** Build the embed src for one episode.
 *
 *  `list` + `listType=playlist` keeps YouTube's own up-next queue pointed at
 *  this series, so finishing V1 rolls into V2 instead of into whatever the
 *  recommendation engine picks. `rel=0` keeps the end-screen suggestions
 *  inside the same channel.
 *
 *  `autoplay` is passed only for a play the visitor actually initiated — the
 *  facade never mounts an autoplaying iframe on load. */
export function buildEmbedSrc(youtubeId: string, playlistId: string, autoplay: boolean): string {
  const params = new URLSearchParams({
    list: playlistId,
    listType: 'playlist',
    rel: '0',
    playsinline: '1',
  });
  if (autoplay) params.set('autoplay', '1');

  return `${EMBED_ORIGIN}/embed/${youtubeId}?${params.toString()}`;
}

/** Data-file video → everything the rail and the player need to render, with
 *  all parsing done once here instead of inline in JSX.
 *
 *  Titles that do not match the `Video N: Headline - Summary` shape degrade
 *  gracefully: the whole title becomes the headline and the summary falls back
 *  to the video's own description. A new video worded differently renders
 *  plainly rather than rendering blank. */
export function toEpisodeView(video: CapstoneVideo, index: number): EpisodeView {
  const match = EPISODE_TITLE.exec(video.title);
  const position = index + 1;

  return {
    id: video.id,
    youtubeId: video.youtubeId,
    badge: `V${position}`,
    rank: match?.[1] ?? `Video ${position}`,
    headline: match?.[2] ?? video.title,
    summary: match?.[3] ?? video.description,
    focusArea: video.focusArea,
    runtime: formatRuntime(video.duration) ?? '',
    url: video.url,
  };
}

/** Whole series, in playlist order. One linear pass, run once per render of a
 *  five-item list — no intermediate array (§2.8: no map+filter chains). */
export function buildEpisodeViews(videos: readonly CapstoneVideo[]): EpisodeView[] {
  const views: EpisodeView[] = [];
  for (let i = 0; i < videos.length; i += 1) {
    views.push(toEpisodeView(videos[i], i));
  }
  return views;
}
