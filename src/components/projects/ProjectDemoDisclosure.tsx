'use client';

import { useCallback, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

import InteractiveDemoSlot from '@/components/projects/InteractiveDemoSlot';
import {
  getDemoDescriptor,
  getDemoToggleAriaLabel,
  getDemoToggleLabel,
} from '@/components/projects/interactive-demo-logic';
import type { InteractiveDemo } from '@/data/projects';

interface ProjectDemoDisclosureProps {
  demo: InteractiveDemo;
  /** The project this game belongs to — named in the accessible label. */
  projectTitle: string;
  /** Featured projects open their companion by default; grid projects do not. */
  defaultOpen?: boolean;
}

/**
 * The named, openable companion attached to a project.
 *
 * Three problems solved together. The first is pairing: a game only reads as
 * belonging to a project if it sits with it, and this keeps the game's own
 * title, its one-line teaser and the game itself inside the project's block
 * rather than in a stack further down the page.
 *
 * The second is weight. Nine games all mounting on load means nine lazy chunks
 * fetched and nine components hydrated for a visitor who may play none of
 * them — several of which run their own frame loop. `InteractiveDemoSlot`
 * only renders once `shouldMount` is true, so `next/dynamic` never requests
 * the chunk before then.
 *
 * The third is `defaultOpen` (featured projects) on its own defeating the
 * second: a plain `useState(defaultOpen)` would mount the two showcase games
 * the instant the page hydrates, regardless of how far below the fold they
 * sit — the exact eager-load the disclosure exists to prevent, just moved
 * from "on page load" to "on default state" instead of fixed. `hasBeenSeen`
 * (framer's `useInView`, `once: true` — the same real-IntersectionObserver
 * primitive §3.7 already uses for animation loops, here gating MOUNTING
 * itself) makes every game — featured or not — wait for its own container to
 * actually scroll into view at least once before it ever mounts. `once: true`
 * means that flag never reverts, so a game already playing is never torn down
 * and its state lost just because the visitor scrolled past it.
 */
export default function ProjectDemoDisclosure({
  demo,
  projectTitle,
  defaultOpen = false,
}: ProjectDemoDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasBeenSeen = useInView(containerRef, { amount: 0.2, once: true });
  const shouldMount = open && hasBeenSeen;
  const descriptor = getDemoDescriptor(demo);
  // A button reporting aria-expanded MUST name the region it expands, or a
  // screen-reader user is told something opened with no way to find it
  // (WCAG 2.2; caught by wcag-contract). Demo ids are unique per page, so they
  // make a stable panel id without a generated one. aria-expanded reflects
  // shouldMount (what actually rendered), not the raw `open` intent, so a
  // screen reader is never told something expanded before it's really there.
  const panelId = `demo-panel-${demo}`;

  const handleToggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  return (
    <div ref={containerRef} className="mt-6" data-testid={`demo-disclosure-${demo}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.04] p-4">
        <div className="min-w-0 flex-1">
          <span className="block text-xs uppercase tracking-[0.14em] text-cyan-300/80">Playable companion</span>
          <strong className="mt-1 block text-base text-white">{descriptor.title}</strong>
          <span className="mt-1 block text-sm text-muted-foreground">{descriptor.teaser}</span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={shouldMount}
          aria-controls={panelId}
          aria-label={getDemoToggleAriaLabel(demo, projectTitle, shouldMount)}
          data-testid={`demo-toggle-${demo}`}
          className="min-h-[44px] whitespace-nowrap rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
        >
          {getDemoToggleLabel(demo, shouldMount)}
        </button>
      </div>

      <div id={panelId} role="region" aria-label={descriptor.title}>
        {shouldMount ? <InteractiveDemoSlot demo={demo} /> : null}
      </div>
    </div>
  );
}
