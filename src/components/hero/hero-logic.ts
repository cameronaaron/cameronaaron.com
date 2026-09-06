import type { PerformanceTier } from '@/hooks/usePerformanceProfile';

export interface HeroMotionConfig {
  shouldUseParallax: boolean;
  showFloatingBadges: boolean;
  parallaxDepth: number;
  scaleFloor: number;
}

export interface HeroFloatingBadge {
  label: string;
  className: string;
}

export type HeroWorldTone = 'ice' | 'violet' | 'mint' | 'amber';

export interface HeroWorldAtmosphere {
  accent: string;
  halo: string;
  wash: string;
  bloom: string;
  connectionRgb: string;
  particleColors: readonly string[];
}

export interface HeroWorldChangeDetail {
  tone: HeroWorldTone;
  colors: readonly string[];
}

export const HERO_SIGNAL_CHIPS = ['Engineering', 'Security', 'Clinical Care', 'NP Path'] as const;

export const HERO_FLOATING_BADGES: HeroFloatingBadge[] = [
  { label: 'EMT', className: '-left-4 top-10' },
  { label: 'Security', className: 'right-1 top-3' },
  { label: 'Research', className: '-right-8 bottom-24' },
  { label: 'Future NP', className: 'left-2 -bottom-4' },
];

/** Broadcast when the visitor picks a world — CursorComet listens and throws a spark burst. */
export const HERO_WORLD_CHANGE_EVENT = 'hero-world-change';

/**
 * Ice palette is the same four rgba strings as PARTICLE_COLORS in the
 * interactive-particles engine. Kept here so hero-logic does not import the
 * simulation module; hero-logic.test pins the two catalogs stay identical.
 */
const ICE_PARTICLE_COLORS = [
  'rgba(56, 214, 255, 0.65)',
  'rgba(92, 240, 205, 0.6)',
  'rgba(16, 212, 146, 0.55)',
  'rgba(126, 231, 255, 0.6)',
] as const;

const HERO_WORLD_ATMOSPHERE: Record<HeroWorldTone, HeroWorldAtmosphere> = {
  ice: {
    accent: '#7ee7ff',
    halo: 'rgb(56 214 255 / 0.38)',
    wash: 'radial-gradient(circle at 72% 28%, rgba(56,214,255,0.22), transparent 52%)',
    bloom: 'rgba(56, 214, 255, 0.42)',
    connectionRgb: '126, 231, 255',
    particleColors: ICE_PARTICLE_COLORS,
  },
  violet: {
    accent: '#c1acff',
    halo: 'rgb(166 118 255 / 0.4)',
    wash: 'radial-gradient(circle at 72% 28%, rgba(166,118,255,0.26), transparent 52%)',
    bloom: 'rgba(166, 118, 255, 0.45)',
    connectionRgb: '193, 172, 255',
    particleColors: [
      'rgba(193, 172, 255, 0.7)',
      'rgba(166, 118, 255, 0.62)',
      'rgba(232, 180, 255, 0.55)',
      'rgba(126, 180, 255, 0.5)',
    ],
  },
  mint: {
    accent: '#8bf0c4',
    halo: 'rgb(52 232 171 / 0.38)',
    wash: 'radial-gradient(circle at 72% 28%, rgba(52,232,171,0.24), transparent 52%)',
    bloom: 'rgba(52, 232, 171, 0.42)',
    connectionRgb: '139, 240, 196',
    particleColors: [
      'rgba(52, 232, 171, 0.65)',
      'rgba(16, 212, 146, 0.6)',
      'rgba(126, 255, 210, 0.55)',
      'rgba(80, 220, 200, 0.5)',
    ],
  },
  amber: {
    accent: '#ffcf95',
    halo: 'rgb(255 178 87 / 0.38)',
    wash: 'radial-gradient(circle at 72% 28%, rgba(255,178,87,0.24), transparent 52%)',
    bloom: 'rgba(255, 178, 87, 0.42)',
    connectionRgb: '255, 207, 149',
    particleColors: [
      'rgba(255, 178, 87, 0.7)',
      'rgba(255, 207, 149, 0.6)',
      'rgba(255, 140, 90, 0.55)',
      'rgba(255, 220, 170, 0.5)',
    ],
  },
};

export function getHeroMotionConfig(performanceTier: PerformanceTier): HeroMotionConfig {
  const shouldUseParallax = performanceTier === 'full';

  return {
    shouldUseParallax,
    showFloatingBadges: performanceTier === 'full',
    parallaxDepth: performanceTier === 'full' ? 150 : performanceTier === 'balanced' ? 100 : 45,
    scaleFloor: performanceTier === 'full' ? 0.8 : performanceTier === 'balanced' ? 0.88 : 0.94,
  };
}

/** The four entry points use existing portfolio sections, not a second content tree. */
export const HERO_WORLDS = [
  { title: 'Ideas into interfaces.', description: 'Software engineering shaped by curiosity, clarity, and the people using it.', href: '#experience', action: 'Explore my experience', word: 'Build', tone: 'ice' },
  { title: 'Curiosity with a purpose.', description: 'Security research and a habit of asking how things work — and how they could work better.', href: '#projects', action: 'Explore the research', word: 'Question', tone: 'violet' },
  { title: 'People at the center.', description: 'Emergency care, aerospace medicine, and clinical experience grounded in human connection.', href: '#certifications', action: 'View clinical credentials', word: 'Care', tone: 'mint' },
  { title: 'Always becoming.', description: 'Building on a foundation in healthcare and education while preparing for Nurse Practitioner training.', href: '#education', action: 'Follow the learning journey', word: 'Grow', tone: 'amber' },
] as const;

export function getHeroWorldAtmosphere(tone: HeroWorldTone): HeroWorldAtmosphere {
  return HERO_WORLD_ATMOSPHERE[tone];
}

export function getNextHeroWorld(current: number, key: string): number {
  if (key === 'Home') return 0;
  if (key === 'End') return HERO_WORLDS.length - 1;
  if (key === 'ArrowRight') return (current + 1) % HERO_WORLDS.length;
  if (key === 'ArrowLeft') return (current + HERO_WORLDS.length - 1) % HERO_WORLDS.length;
  return current;
}

/** Build the window event fired when a world tab is chosen. */
export function buildHeroWorldChangeEvent(tone: HeroWorldTone): CustomEvent<HeroWorldChangeDetail> {
  return new CustomEvent(HERO_WORLD_CHANGE_EVENT, {
    detail: {
      tone,
      colors: getHeroWorldAtmosphere(tone).particleColors,
    },
  });
}

/** Unique particle colours across every world — CursorComet pre-renders one sprite each. */
export function collectHeroWorldParticleColors(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const atmospheres = Object.values(HERO_WORLD_ATMOSPHERE);
  for (let a = 0; a < atmospheres.length; a += 1) {
    const colors = atmospheres[a].particleColors;
    for (let i = 0; i < colors.length; i += 1) {
      const color = colors[i];
      if (!seen.has(color)) {
        seen.add(color);
        out.push(color);
      }
    }
  }
  return out;
}
