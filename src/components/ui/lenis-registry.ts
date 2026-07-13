import type Lenis from 'lenis';

/**
 * The single active Lenis instance, if any (null on touch devices, where
 * SmoothScroll never constructs one). Lets components outside SmoothScroll
 * — e.g. SectionRail — drive scroll through Lenis instead of a raw
 * scrollIntoView() call that Lenis's own raf loop would immediately fight.
 */
let activeLenis: Lenis | null = null;

export function setActiveLenis(instance: Lenis | null): void {
  activeLenis = instance;
}

export function getActiveLenis(): Lenis | null {
  return activeLenis;
}
