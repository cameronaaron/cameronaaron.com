/**
 * Per-frame decisions for an in-page section jump that keeps re-aiming while
 * its target moves.
 *
 * Why the target moves: every below-the-fold section is a `.cv-section`
 * (`content-visibility: auto` + a 1200px intrinsic-size placeholder). A jump
 * aims at the target's position computed from those placeholders, then the
 * sections it scrolls past render at their real, taller heights and push the
 * target further down. Measured 2026-09 on the live site: a nav click to
 * #contact stopped 11,708px short on desktop; #education 9,496px short on
 * mobile. A smooth scroll never re-targets on its own, so the visitor was
 * stranded mid-page.
 *
 * Re-issuing the scroll mid-flight whenever the target's absolute position
 * drifts past a tolerance turns that into one continuous motion. Prototyped
 * against /out on a 375px viewport: every section landed within the page's
 * normal landing offset, with 0-7 re-aims and ~4.2s to #contact, versus ~6s
 * for a scroll-stop-scroll-again approach and never arriving at all before.
 */

/** Drift in the target's absolute position that triggers a re-aim. Larger
 *  than sub-pixel/snap noise, far smaller than one section's height delta. */
export const SECTION_REAIM_TOLERANCE_PX = 24;

/** Upper bound on re-aims for one jump — the page has nine sections, so a
 *  healthy jump needs well under this; the cap only stops a runaway loop. */
export const SECTION_REAIM_MAX = 20;

/** Consecutive frames with an unchanged scroll position that count as
 *  "the scroll has come to rest". */
export const SECTION_SETTLE_FRAMES = 6;

export type SectionScrollStep = 'reaim' | 'continue' | 'done';

export interface SectionScrollState {
  /** Absolute document offset the in-flight scroll is heading for. */
  aimedAt: number;
  reaims: number;
  lastScrollY: number;
  stableFrames: number;
}

export function createSectionScrollState(targetAbsoluteTop: number, scrollY: number): SectionScrollState {
  return { aimedAt: targetAbsoluteTop, reaims: 0, lastScrollY: scrollY, stableFrames: 0 };
}

/**
 * Advances one animation frame. Mutates `state` in place (it runs every frame
 * of a jump, so it allocates nothing — ENGINEERING-STANDARDS §2.8).
 *
 * `targetAbsoluteTop` is the target's top in document coordinates this frame
 * (scrollY + its bounding-rect top); `scrollY` is the current scroll offset.
 */
export function stepSectionScroll(
  state: SectionScrollState,
  targetAbsoluteTop: number,
  scrollY: number,
): SectionScrollStep {
  if (Math.abs(targetAbsoluteTop - state.aimedAt) > SECTION_REAIM_TOLERANCE_PX && state.reaims < SECTION_REAIM_MAX) {
    state.aimedAt = targetAbsoluteTop;
    state.reaims += 1;
    state.stableFrames = 0;
    state.lastScrollY = scrollY;
    return 'reaim';
  }

  state.stableFrames = scrollY === state.lastScrollY ? state.stableFrames + 1 : 0;
  state.lastScrollY = scrollY;
  return state.stableFrames >= SECTION_SETTLE_FRAMES ? 'done' : 'continue';
}
