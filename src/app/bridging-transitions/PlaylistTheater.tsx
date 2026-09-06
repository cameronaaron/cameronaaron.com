'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import type { CapstoneVideo } from '@/data/capstone';
import { buildEmbedSrc, buildEpisodeViews, type EpisodeView } from './playlist-theater-logic';

interface EpisodeButtonProps {
  episode: EpisodeView;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
}

/** Memoized per constraint #13: every item in this rail re-renders whenever the
 *  parent's active index changes, so an inline `onSelect={() => …}` closure
 *  would defeat the memo and re-render all five on every tap. The handler is
 *  stable and the item passes its own index back. */
const EpisodeButton = memo(function EpisodeButton({
  episode,
  index,
  isActive,
  onSelect,
}: EpisodeButtonProps) {
  const handleClick = useCallback(() => onSelect(index), [onSelect, index]);

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        aria-current={isActive ? 'true' : undefined}
        className={`group flex min-h-[44px] w-full flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition ${
          isActive
            ? 'border-amber-300/60 bg-amber-300/10'
            : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
        }`}
      >
        <span className="flex w-full items-center gap-2">
          <span
            className={`rounded-md px-1.5 py-0.5 font-mono text-xs font-bold ${
              isActive ? 'bg-amber-300 text-black' : 'bg-white/10 text-gray-300'
            }`}
          >
            {episode.badge}
          </span>
          <span className="text-sm font-semibold text-white">{episode.headline}</span>
          {episode.runtime ? (
            <span className="ml-auto font-mono text-xs text-gray-400">{episode.runtime}</span>
          ) : null}
        </span>
        <span className="text-xs leading-relaxed text-gray-400">{episode.summary}</span>
      </button>
    </li>
  );
});

interface PlaylistTheaterProps {
  videos: readonly CapstoneVideo[];
  playlistId: string;
}

/**
 * The playlist player for /bridging-transitions.
 *
 * Loads as a facade, not as an iframe. Nothing is requested from YouTube until
 * the visitor presses play — which matters twice over here: this page is
 * reached by scanning a printed code, often on conference wifi, and the person
 * scanning it never opted into third-party tracking by walking past a poster.
 * Pressing play mounts the real youtube-nocookie iframe with autoplay, so the
 * cost is one tap, not one tap plus a manual second play.
 */
export default function PlaylistTheater({ videos, playlistId }: PlaylistTheaterProps) {
  const episodes = useMemo(() => buildEpisodeViews(videos), [videos]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const active = episodes[activeIndex];

  // Selecting from the rail keeps whatever mode the theater is already in:
  // browsing before play swaps the facade, switching mid-series swaps the
  // iframe straight to the new episode rather than dumping the viewer back to
  // a second play button.
  const handleSelect = useCallback((index: number) => setActiveIndex(index), []);
  const handlePlay = useCallback(() => setIsPlaying(true), []);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/12 bg-black shadow-2xl shadow-black/50">
          {isPlaying ? (
            <iframe
              // Keyed by episode so switching swaps the document outright
              // instead of mutating src on a live player, which leaves the
              // previous video's audio running in some mobile browsers.
              key={active.youtubeId}
              src={buildEmbedSrc(active.youtubeId, playlistId, true)}
              title={`${active.rank}: ${active.headline} — Bridging Transitions`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              className="group absolute inset-0 flex h-full w-full flex-col justify-end bg-[radial-gradient(circle_at_30%_20%,rgba(252,211,77,0.22),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(56,214,255,0.18),transparent_55%)] p-5 text-left transition hover:brightness-110 sm:p-8"
            >
              <span className="absolute left-1/2 top-[42%] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-300 text-black shadow-lg shadow-amber-300/25 transition group-hover:scale-110 sm:h-20 sm:w-20">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                  className="ml-1 h-6 w-6 fill-current sm:h-9 sm:w-9"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
              <span className="relative font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200 sm:text-xs">
                {active.badge} · {active.focusArea}
              </span>
              <span className="relative mt-1 text-lg font-bold leading-tight text-white sm:mt-2 sm:text-2xl">
                {active.headline}
              </span>
              <span className="relative mt-1.5 text-[11px] text-gray-300 sm:text-xs">
                {active.runtime ? `${active.runtime} · ` : ''}Loads YouTube only when you press play
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          Five videos, about twelve minutes
        </h3>
        <ul aria-label="Episodes in the Bridging Transitions series" className="flex flex-col gap-2">
          {episodes.map((episode, index) => (
            <EpisodeButton
              key={episode.id}
              episode={episode}
              index={index}
              isActive={index === activeIndex}
              onSelect={handleSelect}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
