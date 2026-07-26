'use client';

import { useCallback, useState } from 'react';

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
 * Two problems solved together. The first is pairing: a game only reads as
 * belonging to a project if it sits with it, and this keeps the game's own
 * title, its one-line teaser and the game itself inside the project's block
 * rather than in a stack further down the page.
 *
 * The second is weight. Nine games all mounting on load means nine lazy chunks
 * fetched and nine components hydrated for a visitor who may play none of
 * them — several of which run their own frame loop. Because
 * `InteractiveDemoSlot` is only RENDERED once opened, `next/dynamic` does not
 * request the chunk until then, so an unopened companion costs a button.
 * Featured projects opt into `defaultOpen` because they are the showcase and
 * are meant to be playing when you arrive.
 */
export default function ProjectDemoDisclosure({
  demo,
  projectTitle,
  defaultOpen = false,
}: ProjectDemoDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const descriptor = getDemoDescriptor(demo);
  // A button reporting aria-expanded MUST name the region it expands, or a
  // screen-reader user is told something opened with no way to find it
  // (WCAG 2.2; caught by wcag-contract). Demo ids are unique per page, so they
  // make a stable panel id without a generated one.
  const panelId = `demo-panel-${demo}`;

  const handleToggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  return (
    <div className="mt-6" data-testid={`demo-disclosure-${demo}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.04] p-4">
        <div className="min-w-0 flex-1">
          <span className="block text-xs uppercase tracking-[0.14em] text-cyan-300/80">Playable companion</span>
          <strong className="mt-1 block text-base text-white">{descriptor.title}</strong>
          <span className="mt-1 block text-sm text-muted-foreground">{descriptor.teaser}</span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={getDemoToggleAriaLabel(demo, projectTitle, open)}
          data-testid={`demo-toggle-${demo}`}
          className="min-h-[44px] whitespace-nowrap rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
        >
          {getDemoToggleLabel(demo, open)}
        </button>
      </div>

      <div id={panelId} role="region" aria-label={descriptor.title}>
        {open ? <InteractiveDemoSlot demo={demo} /> : null}
      </div>
    </div>
  );
}
