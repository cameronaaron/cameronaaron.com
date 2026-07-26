'use client';

import dynamic from 'next/dynamic';
import { m, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import IntroCurtain from '@/components/ui/IntroCurtain';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import CommandPalette from '@/components/ui/CommandPalette';
import BackToTop from '@/components/ui/BackToTop';
import ScrollVelocityDriver from '@/components/ui/ScrollVelocityDriver';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';

const AmbientBackground = dynamic(() => import('@/components/ui/AmbientBackground'), { ssr: false });
const QuickActionsDock = dynamic(() => import('@/components/ui/QuickActionsDock'), { ssr: false });
const SectionRail = dynamic(() => import('@/components/ui/SectionRail'), { ssr: false });
const CursorComet = dynamic(() => import('@/components/ui/CursorComet'), { ssr: false });
const PointerRipple = dynamic(() => import('@/components/ui/PointerRipple'), { ssr: false });
const AuroraSurge = dynamic(() => import('@/components/ui/AuroraSurge'), { ssr: false });

/**
 * All of the home page's client-side orchestration, extracted into one island
 * so `page.tsx` can be a Server Component (RSC migration, 2026-07). Everything
 * here is a fixed/absolute-positioned overlay or a global concern — the intro
 * curtain, ambient background, floating docks, cursor effects, the mobile
 * scroll-progress bar, and the first-interaction gate — none of it wraps the
 * page's content, so it renders as a self-contained sibling of <main>. Moving
 * it out of the page shell lets the static content sections (e.g. Education)
 * render as Server Components that ship zero client JS and never hydrate.
 */
export default function PageChrome() {
  const { scrollYProgress } = useScroll();
  const { performanceTier, isProfileReady } = usePerformanceProfile();
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) return;

    const onFirstInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction);
    window.addEventListener('touchstart', onFirstInteraction, { passive: true });
    window.addEventListener('scroll', onFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
    };
  }, [hasInteracted]);

  const showFloatingOverlays = hasInteracted && (performanceTier === 'full' || performanceTier === 'balanced');
  const showCursorEffects = hasInteracted && performanceTier === 'full';
  const pageProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 32, mass: 0.45 });

  return (
    <>
      <IntroCurtain />
      {/* Renders nothing — publishes scroll velocity as CSS custom properties
          for the marquee bands and every section title, replacing the ~10
          duplicated framer spring graphs those consumers each used to build. */}
      <ScrollVelocityDriver />
      <div className="grain-overlay" aria-hidden="true" />
      {/* Mount only once the real tier is known — mounting under the optimistic
          'full' default and then re-rendering as 'balanced' flashed 7 orbs → 4
          on every mobile load (the CLAUDE.md #10 trade-off, now avoided). */}
      {isProfileReady ? <AmbientBackground performanceTier={performanceTier} /> : null}
      {showFloatingOverlays ? <QuickActionsDock performanceTier={performanceTier} /> : null}
      {showFloatingOverlays ? <SectionRail /> : null}
      {/* Interaction layer: deferred until first input (same LCP-friendly gate
          as the other floating overlays), then tier-gated — comet + easter egg
          are desktop full-tier; the tap ripple also runs on balanced (mobile). */}
      {showCursorEffects ? <CursorComet /> : null}
      {showCursorEffects ? <AuroraSurge /> : null}
      {showFloatingOverlays ? <PointerRipple /> : null}
      <KeyboardShortcuts />
      <CommandPalette />
      <BackToTop />

      {showFloatingOverlays ? (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 xl:hidden" aria-hidden="true">
          <div className="h-1 w-full bg-white/10 backdrop-blur-sm">
            <m.div
              className="h-full bg-gradient-to-r from-cyan-400 via-primary to-secondary"
              style={{ scaleX: pageProgress, transformOrigin: 'left' }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
