export interface VisibilityGateHandlers {
  /** Element is on-screen AND the tab is foregrounded — safe to run. */
  onResume: () => void;
  /** Element is off-screen OR the tab is hidden — stop computing frames. */
  onPause: () => void;
}

/**
 * Pause/resume driver for an always-mounted continuous animation loop, keyed on
 * whether anyone can actually SEE it — an `IntersectionObserver` (on-screen)
 * combined with the Page Visibility API (tab foregrounded).
 *
 * ENGINEERING-STANDARDS §3.7 requires continuous work to run only while visible.
 * Below-fold widgets get that for free by being `useInView`-unmounted, but the
 * hero particle canvases are always mounted (index 0) and so ran their `draw`
 * loop forever — every frame cleared, advanced, and re-rasterised even after the
 * hero scrolled off, and even in a background tab. That is pure wasted main-
 * thread + raster work computing frames nobody can see. Wiring a loop's
 * start/stop to this gate makes the waste impossible; particle positions live in
 * the caller's closure, so pause/resume is seamless — a viewer notices nothing.
 *
 * Starts in the running state (the hero is on-screen at load); the observer's
 * first callback corrects it if not. O(1) per event, one observer + one
 * listener. Returns a cleanup fn that disconnects both.
 */
export function gateLoopOnVisibility(
  element: Element,
  { onResume, onPause }: VisibilityGateHandlers,
): () => void {
  let onScreen = true;
  let running = true;

  const sync = () => {
    const shouldRun = onScreen && !isDocumentHidden();
    if (shouldRun === running) return;
    running = shouldRun;
    if (shouldRun) onResume();
    else onPause();
  };

  const observer = new IntersectionObserver((entries) => {
    // Last entry is the most recent state for this single observed element.
    onScreen = entries[entries.length - 1].isIntersecting;
    sync();
  });
  observer.observe(element);

  document.addEventListener('visibilitychange', sync, { passive: true });

  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', sync);
  };
}

function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.hidden === true;
}
