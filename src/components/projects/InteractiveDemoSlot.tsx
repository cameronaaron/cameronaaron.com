'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

import type { InteractiveDemo } from '@/data/projects';

/**
 * Renders whichever interactive demo a project names.
 *
 * A `Record<InteractiveDemo, ComponentType>` dispatch table, not the chain of
 * `{project.interactiveDemo === '…' && <X />}` expressions this replaced: that
 * chain re-tested every branch for every project on every render and grew one
 * comparison per new game (ENGINEERING-STANDARDS §2.2 — dispatch tables over
 * if-chains). Adding a game is now one entry, and TypeScript makes the record
 * exhaustive, so a new `InteractiveDemo` member cannot be declared and then
 * silently never rendered.
 *
 * Every entry is code-split with `ssr: false` (§3.8, measured in §4.7 item 8):
 * these are interactive-only widgets far below the fold with nothing
 * indexable in them, so their code has no business in the initial bundle a
 * visitor parses on a throttled phone. The surrounding project cards — which
 * ARE content — stay statically rendered.
 */
const DEMO_COMPONENTS: Record<InteractiveDemo, ComponentType> = {
  'dna-snp-game': dynamic(() => import('@/components/projects/dna-game/DnaSnpGame'), { ssr: false }),
  'reaction-time-game': dynamic(() => import('@/components/projects/reaction-game/ReactionTimeGame'), {
    ssr: false,
  }),
  'predator-prey-chase': dynamic(() => import('@/components/projects/predator-prey/PredatorPreyChase'), {
    ssr: false,
  }),
  'toxoplasma-maze': dynamic(() => import('@/components/projects/toxoplasma/ToxoplasmaMaze'), { ssr: false }),
  'tohoku-dialect-game': dynamic(() => import('@/components/projects/tohoku/TohokuDialectGame'), {
    ssr: false,
  }),
  'collective-intelligence-game': dynamic(
    () => import('@/components/projects/collective-intelligence/CollectiveIntelligenceGame'),
    { ssr: false }
  ),
  'ephemeral-room-game': dynamic(() => import('@/components/projects/ephemeral-room/EphemeralRoomGame'), {
    ssr: false,
  }),
  'twice-exceptional-game': dynamic(
    () => import('@/components/projects/twice-exceptional/TwiceExceptionalGame'),
    { ssr: false }
  ),
  'divergent-thinking-game': dynamic(
    () => import('@/components/projects/divergent-thinking/DivergentThinkingGame'),
    { ssr: false }
  ),
};

interface InteractiveDemoSlotProps {
  demo: InteractiveDemo;
}

export default function InteractiveDemoSlot({ demo }: InteractiveDemoSlotProps) {
  const Demo = DEMO_COMPONENTS[demo];
  return <Demo />;
}
