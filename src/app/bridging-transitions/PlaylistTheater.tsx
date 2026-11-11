'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import type { CapstoneVideo } from '@/data/capstone';
import {
  buildEmbedSrc,
  buildEpisodeViews,
  seriesSummary,
  type EpisodeView,
} from './playlist-theater-logic';

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
            ? 'border-warning/60 bg-warning/10'
            : 'border-foreground/10 bg-foreground/[0.03] hover:border-foreground/25 hover:bg-foreground/[0.06]'
        }`}
      >
        <span className="flex w-full items-center gap-2">
          <span
            className={`rounded-md px-1.5 py-0.5 font-mono text-xs font-bold ${
              isActive ? 'bg-warning text-foreground' : 'bg-foreground/10 text-muted-foreground'
            }`}
          >
            {episode.badge}
          </span>
          <span className="text-sm font-semibold text-foreground">{episode.headline}</span>
          {episode.runtime ? (
            <span className="ml-auto font-mono text-xs text-muted-foreground">{episode.runtime}</span>
          ) : null}
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">{episode.summary}</span>
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
  const summary = useMemo(() => seriesSummary(videos), [videos]);
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-foreground shadow-xl shadow-foreground/15">
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
              className="group absolute inset-0 flex h-full w-full flex-col justify-end bg-foreground p-5 text-left sm:p-8"
            >
              <span className="absolute left-1/2 top-[42%] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform duration-200 group-hover:scale-110 sm:h-20 sm:w-20">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                  className="ml-1 h-6 w-6 fill-current sm:h-9 sm:w-9"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="relative text-xs font-semibold text-accent sm:text-sm">
                {active.badge} · {active.focusArea}
              </span>
              <span className="relative mt-1 text-lg font-bold leading-tight text-background sm:mt-2 sm:text-2xl">
                {active.headline}
              </span>
              <span className="relative mt-1.5 text-[11px] text-background/75 sm:text-xs">
                {active.runtime ? `${active.runtime} · ` : ''}Loads YouTube only when you press play
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="mb-3 text-xs font-semibold text-warning">
          {summary}
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
