export interface TrailPoint {
  id: number;
  x: number;
  y: number;
  life: number;
}

export interface Ripple {
  id: number;
  x: number;
  y: number;
}

export const CURSOR_INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, [data-cursor="interactive"]';
export const TRAIL_SAMPLE_INTERVAL_MS = 16;
export const TRAIL_MAX_POINTS = 20;
export const RIPPLE_LIFETIME_MS = 420;

export function shouldSampleTrail(lastSampleAt: number, now: number, minInterval = TRAIL_SAMPLE_INTERVAL_MS): boolean {
  return now - lastSampleAt >= minInterval;
}

export function appendTrailPoint(
  previous: TrailPoint[],
  id: number,
  x: number,
  y: number,
  maxPoints = TRAIL_MAX_POINTS
): TrailPoint[] {
  return [
    ...previous,
    {
      id,
      x,
      y,
      life: 1,
    },
  ].slice(-maxPoints);
}

export function decayTrailPoints(previous: TrailPoint[]): TrailPoint[] {
  return previous
    .map((point, index, all) => {
      const relativeAge = 1 - index / Math.max(1, all.length);
      const decay = 0.035 + relativeAge * 0.02;

      return {
        ...point,
        life: point.life - decay,
      };
    })
    .filter((point) => point.life > 0);
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest(CURSOR_INTERACTIVE_SELECTOR));
}

export function createRipple(id: number, x: number, y: number): Ripple {
  return { id, x, y };
}

export function getTrailVisualState(index: number, totalPoints: number, life: number): { opacity: number; scale: number } {
  const progress = (index + 1) / Math.max(1, totalPoints);
  return {
    opacity: Math.max(0.1, life * 0.7 * progress),
    scale: 0.5 + progress * 0.45,
  };
}
