import { getActiveLenis } from './lenis-registry';
import { createSectionScrollState, stepSectionScroll } from './section-scroll-logic';

/**
 * The one way this site scrolls to an in-page section. Issues the scroll
 * through Lenis when it is running (a raw scrollIntoView gets fought by its
 * raf loop) or natively otherwise, then keeps re-aiming while `.cv-section`
 * placeholders resolve and move the target — see section-scroll-logic.ts for
 * the measured failure this exists to fix.
 *
 * `issueInitialScroll: false` is for same-page anchor clicks, where the
 * browser (or Lenis's `anchors` option) already starts the scroll and keeps
 * native hash + focus-start-point semantics; this only follows it up.
 *
 * One jump runs at a time: a new call replaces the previous one, and any
 * wheel, touch or key input hands the page straight back to the visitor.
 */

const USER_INPUT_EVENTS = ['wheel', 'touchstart', 'keydown'] as const;

let activeFrame = 0;
let stopActiveJump: (() => void) | null = null;

export function cancelSectionScroll(): void {
  stopActiveJump?.();
}

function issueScroll(target: HTMLElement, reducedMotion: boolean): void {
  const lenis = getActiveLenis();
  if (lenis) {
    // Lenis clamps every scrollTo to its cached scroll limit, which was
    // measured while the sections below were still short placeholders; a
    // re-aim past that stale ceiling would stop at it. Re-measure first.
    lenis.resize();
    lenis.scrollTo(target, { immediate: reducedMotion });
  } else {
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

function absoluteTop(target: HTMLElement): number {
  return window.scrollY + target.getBoundingClientRect().top;
}

export function scrollToSection(
  target: HTMLElement,
  { reducedMotion, issueInitialScroll = true }: { reducedMotion: boolean; issueInitialScroll?: boolean },
): void {
  cancelSectionScroll();
  if (issueInitialScroll) issueScroll(target, reducedMotion);

  const state = createSectionScrollState(absoluteTop(target), window.scrollY);

  const stop = () => {
    cancelAnimationFrame(activeFrame);
    for (const type of USER_INPUT_EVENTS) window.removeEventListener(type, stop);
    if (stopActiveJump === stop) stopActiveJump = null;
  };

  let listening = false;
  const tick = () => {
    // Attached on the first frame, not synchronously: a jump started from a
    // keydown handler (the ⌘K palette) would otherwise receive that same
    // keydown when it bubbles on to window, and cancel itself on the spot.
    if (!listening) {
      listening = true;
      for (const type of USER_INPUT_EVENTS) window.addEventListener(type, stop, { passive: true });
    }
    const step = stepSectionScroll(state, absoluteTop(target), window.scrollY);
    if (step === 'done') {
      stop();
      return;
    }
    if (step === 'reaim') issueScroll(target, reducedMotion);
    activeFrame = requestAnimationFrame(tick);
  };

  stopActiveJump = stop;
  activeFrame = requestAnimationFrame(tick);
}
