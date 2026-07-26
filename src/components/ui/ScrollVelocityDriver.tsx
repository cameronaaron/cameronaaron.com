'use client';

import { useEffect } from 'react';

import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import { getMarqueeMotionConfig } from '@/components/ui/velocity-marquee-logic';
import {
  VELOCITY_LEAN_BAND_CLASS,
  VELOCITY_LEAN_BAND_REVERSE_CLASS,
  VELOCITY_LEAN_REST_TRANSFORM,
  VELOCITY_LEAN_TITLE_CLASS,
  buildScrollVelocityTransforms,
  computeScrollVelocityPxPerS,
  createScrollVelocitySpring,
  isScrollIdle,
  isScrollVelocitySpringAtRest,
  settleScrollVelocitySpring,
  stepScrollVelocitySpring,
} from '@/components/ui/scroll-velocity-driver-logic';

/**
 * Publishes live scroll velocity as three CSS custom properties on `<html>`,
 * replacing the ~10 duplicated framer-motion spring graphs that every marquee
 * band and section title used to build for itself. Renders nothing.
 *
 * Why one driver instead of a hook each consumer calls: a hook would still run
 * per consumer. The whole point is that N consumers now cost exactly one
 * scroll subscriber and one spring, and read the result through CSS
 * inheritance for free (ENGINEERING-STANDARDS §3.1's custom-property channel).
 *
 * The frame loop self-sleeps the moment the spring reaches rest and re-arms on
 * the next scroll event, so a page sitting still costs zero frames — §3.7's
 * requirement for a continuous loop with no unmount to gate on, met the same
 * way `CursorComet` meets it.
 */
export default function ScrollVelocityDriver() {
  const { performanceTier } = usePerformanceProfile();
  const { velocityReactive } = getMarqueeMotionConfig(performanceTier);

  useEffect(() => {
    // Lower tiers never lean: the custom properties keep their registered
    // initial values (0deg/0px), so every consumer's transform is identity and
    // no listener or frame is ever scheduled at all.
    if (!velocityReactive) return;

    // Resolved once, not per frame: these elements come from the static export
    // and are never added or removed after hydration.
    const bands = document.querySelectorAll<HTMLElement>(`.${VELOCITY_LEAN_BAND_CLASS}`);
    const reverseBands = document.querySelectorAll<HTMLElement>(`.${VELOCITY_LEAN_BAND_REVERSE_CLASS}`);
    const titles = document.querySelectorAll<HTMLElement>(`.${VELOCITY_LEAN_TITLE_CLASS}`);
    if (bands.length === 0 && reverseBands.length === 0 && titles.length === 0) return;

    const spring = createScrollVelocitySpring();

    let frameId = 0;
    let lastScrollY = window.scrollY;
    let lastFrameMs = 0;
    let targetVelocity = 0;

    const publish = (velocityPxPerS: number) => {
      const transforms = buildScrollVelocityTransforms(velocityPxPerS);
      for (const element of bands) element.style.transform = transforms.band;
      for (const element of reverseBands) element.style.transform = transforms.reverseBand;
      for (const element of titles) element.style.transform = transforms.title;
    };

    const clearLean = () => {
      for (const element of bands) element.style.transform = VELOCITY_LEAN_REST_TRANSFORM;
      for (const element of reverseBands) element.style.transform = VELOCITY_LEAN_REST_TRANSFORM;
      for (const element of titles) element.style.transform = VELOCITY_LEAN_REST_TRANSFORM;
    };

    const tick = (nowMs: number) => {
      // One layout read per frame, never per scroll event (§3.2).
      const scrollY = window.scrollY;

      // The first frame of a gesture has no previous timestamp, so it cannot
      // produce a velocity — it only establishes the baseline. Parking here
      // instead (the obvious `deltaSeconds = 0` shortcut) makes the spring
      // decide it is at rest before it has ever seen a delta, and the lean
      // never appears at all; caught by the driver's own test rather than in
      // review, which is exactly why the test exists.
      if (lastFrameMs === 0) {
        lastFrameMs = nowMs;
        lastScrollY = scrollY;
        frameId = requestAnimationFrame(tick);
        return;
      }

      const deltaSeconds = (nowMs - lastFrameMs) / 1000;
      targetVelocity = computeScrollVelocityPxPerS(scrollY - lastScrollY, deltaSeconds);
      lastScrollY = scrollY;
      lastFrameMs = nowMs;

      stepScrollVelocitySpring(spring, targetVelocity, deltaSeconds);

      // Once scrolling has stopped the target is 0, so reaching rest means the
      // band is back at identity — publish that exact state and park.
      // Park when the page has effectively stopped AND the spring has caught up
      // to that. Testing `targetVelocity === 0` instead looks equivalent and is
      // not: Lenis eases desktop scrolling asymptotically, so scrollY keeps
      // changing by fractional amounts long after the wheel stops and the loop
      // never sleeps. See SCROLL_IDLE_VELOCITY_PX_S.
      if (isScrollIdle(targetVelocity) && isScrollVelocitySpringAtRest(spring, targetVelocity)) {
        settleScrollVelocitySpring(spring, 0);
        // Clear the property outright rather than writing an identity
        // transform: an identity transform still keeps each consumer on its own
        // compositing layer for as long as it is set.
        clearLean();
        frameId = 0;
        lastFrameMs = 0;
        return;
      }

      publish(spring.value);
      frameId = requestAnimationFrame(tick);
    };

    const scheduleFrame = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', scheduleFrame, { passive: true });

    return () => {
      window.removeEventListener('scroll', scheduleFrame);
      if (frameId) cancelAnimationFrame(frameId);
      clearLean();
    };
  }, [velocityReactive]);

  return null;
}
