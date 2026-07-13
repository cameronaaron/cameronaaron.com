import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

export type MarqueeDirection = 1 | -1;

export interface MarqueeMotionConfig {
  /** Run the CSS keyframe loop that translates the track. */
  animateTrack: boolean;
  /** Attach the scroll-velocity skew/shift motion layer. */
  velocityReactive: boolean;
}

export interface MarqueeItem {
  key: string;
  text: string;
  /** Alternating display treatment: filled gradient vs. outlined ghost text. */
  outlined: boolean;
}

/**
 * Display copy for the two marquee bands. Content catalogs live in the logic
 * module (RAIL_SECTIONS / SHORTCUTS precedent), never inline in a component.
 */
export const HERO_MARQUEE_PHRASES: readonly string[] = [
  'Emergency Medicine',
  'Software Engineering',
  'Security Research',
  'Neuroscience',
  'Cognitive Diversity',
  'Future Nurse Practitioner',
];

export const CONTACT_MARQUEE_PHRASES: readonly string[] = [
  "Let's Build Together",
  'Open To Connect',
  'Healthcare × Technology',
  'Say Hello',
];

/** |scroll velocity| (px/s) at which the reactive effect saturates. */
export const MARQUEE_VELOCITY_CLAMP_PX_S = 1400;
/** Skew at velocity saturation — subtle on purpose; 90° would shear to nothing. */
export const MARQUEE_MAX_SKEW_DEG = 5;
/** Horizontal shift at velocity saturation, in px. */
export const MARQUEE_MAX_SHIFT_PX = 110;
/** Period of one full CSS loop (seconds) — slow editorial drift, not a ticker. */
export const MARQUEE_TRACK_DURATION_S = 42;

const MARQUEE_TIER_CONFIG: Record<PerformanceTier, MarqueeMotionConfig> = {
  // The velocity layer needs Lenis + fine-pointer scrolling to feel right, and
  // an always-running full-width animation belongs to the same budget class as
  // the ambient orbs: 'full' tier only (ENGINEERING-STANDARDS §4.4). Every
  // other tier gets the same band, statically composed.
  full: { animateTrack: true, velocityReactive: true },
  balanced: { animateTrack: false, velocityReactive: false },
  lite: { animateTrack: false, velocityReactive: false },
  reduced: { animateTrack: false, velocityReactive: false },
};

export function getMarqueeMotionConfig(tier: PerformanceTier): MarqueeMotionConfig {
  return MARQUEE_TIER_CONFIG[tier];
}

/** Clamp a scroll velocity into the saturation window. */
export function clampMarqueeVelocity(velocityPxPerS: number): number {
  if (velocityPxPerS > MARQUEE_VELOCITY_CLAMP_PX_S) return MARQUEE_VELOCITY_CLAMP_PX_S;
  if (velocityPxPerS < -MARQUEE_VELOCITY_CLAMP_PX_S) return -MARQUEE_VELOCITY_CLAMP_PX_S;
  return velocityPxPerS;
}

/** Map a (clamped) scroll velocity to the track's skew, in degrees. */
export function marqueeVelocityToSkewDeg(velocityPxPerS: number): number {
  return (clampMarqueeVelocity(velocityPxPerS) / MARQUEE_VELOCITY_CLAMP_PX_S) * MARQUEE_MAX_SKEW_DEG;
}

/**
 * Map a (clamped) scroll velocity to a horizontal shift so the band lurches
 * with the scroll — with the direction of travel for a forward band, against
 * it for a reversed one.
 */
export function marqueeVelocityToShiftPx(velocityPxPerS: number, direction: MarqueeDirection): number {
  return (clampMarqueeVelocity(velocityPxPerS) / MARQUEE_VELOCITY_CLAMP_PX_S) * MARQUEE_MAX_SHIFT_PX * -direction;
}

/**
 * Section titles share the marquee's velocity graph but at a fraction of the
 * amplitude — the page should lean with the scroll, not shear.
 */
export const SECTION_TITLE_SKEW_RATIO = 0.55;

export function sectionTitleVelocityToSkewDeg(velocityPxPerS: number): number {
  return marqueeVelocityToSkewDeg(velocityPxPerS) * SECTION_TITLE_SKEW_RATIO;
}

/**
 * Duplicate the phrase list so the CSS loop can translate to -50% and wrap
 * seamlessly. Runs once per phrases identity (memoized at the call site).
 */
export function buildMarqueeItems(phrases: readonly string[]): MarqueeItem[] {
  const items: MarqueeItem[] = [];
  for (let copy = 0; copy < 2; copy += 1) {
    for (let index = 0; index < phrases.length; index += 1) {
      items.push({
        key: `${copy}-${index}`,
        text: phrases[index],
        outlined: index % 2 === 1,
      });
    }
  }
  return items;
}
