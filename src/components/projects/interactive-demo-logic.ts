import type { InteractiveDemo } from '@/data/projects';

/**
 * Naming and copy for the playable companions.
 *
 * A game's own title ("Fatal Feline Attraction") is what makes the pairing
 * legible on the button that opens it — "Try the demo" tells a reader nothing
 * about what they are about to get, and gives them no reason to click. The
 * one-line `teaser` says what the thing actually asks of them.
 *
 * This catalog lives in a logic module rather than inline in the component,
 * per the modularization contract's ban on module-level content catalogs in
 * components.
 */
export interface DemoDescriptor {
  /** The game's own name. */
  title: string;
  /** One line on what the player does and what it shows. */
  teaser: string;
}

export const DEMO_DESCRIPTORS: Record<InteractiveDemo, DemoDescriptor> = {
  'dna-snp-game': {
    title: 'Spot the SNP',
    teaser: 'Find the single base that differs, and see whether it was a transition or a transversion.',
  },
  'reaction-time-game': {
    title: 'Catch the Lapse',
    teaser: 'A brief psychomotor vigilance task — how close are you to the attention-lapse threshold?',
  },
  'predator-prey-chase': {
    title: "Don't Get Caught",
    teaser: 'Steer the prey robot. The predator hunts you through an infrared cone it can lose you from.',
  },
  'toxoplasma-maze': {
    title: 'Fatal Feline Attraction',
    teaser: 'Predict which arm of the maze the rodent enters — infection changes the answer for exactly one odor.',
  },
  'tohoku-dialect-game': {
    title: 'Hear the Shift',
    teaser: 'Pick the Tohoku pronunciation. Every wrong option is a different real sound change.',
  },
  'collective-intelligence-game': {
    title: 'Build the Smartest Team',
    teaser: 'Draft four people and score the group. The four highest IQs are the worst team available.',
  },
  'ephemeral-room-game': {
    title: 'Keep the Room Alive',
    teaser: 'Hold off the fade timer, and find out how many people a room needs to sustain itself.',
  },
  'twice-exceptional-game': {
    title: 'Who Gets Missed?',
    teaser: 'Classify students from their scores. The twice-exceptional ones hide inside an average composite.',
  },
  'divergent-thinking-game': {
    title: 'Unusual Uses',
    teaser: "Guilford's alternative uses task, scored on category spread rather than how many you name.",
  },
};

export function getDemoDescriptor(demo: InteractiveDemo): DemoDescriptor {
  return DEMO_DESCRIPTORS[demo];
}

/** Button copy for the closed and open states of a demo disclosure. */
export function getDemoToggleLabel(demo: InteractiveDemo, open: boolean): string {
  const { title } = DEMO_DESCRIPTORS[demo];
  return open ? `Hide ${title}` : `Play ${title}`;
}

/** Accessible label naming both the game and the project it belongs to. */
export function getDemoToggleAriaLabel(demo: InteractiveDemo, projectTitle: string, open: boolean): string {
  const { title } = DEMO_DESCRIPTORS[demo];
  return `${open ? 'Hide' : 'Play'} ${title}, the playable companion to ${projectTitle}`;
}
