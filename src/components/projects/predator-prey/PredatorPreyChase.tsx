'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import {
  ARENA_SIZE,
  PAUSED_CAPTION,
  PREDATOR_VISUAL_RADIUS,
  buildIrConePath,
  getIrConeOpacity,
  PREY_VISUAL_RADIUS,
  SIMULATION_ARIA_LABEL,
  formatSurvivalSeconds,
  getCatchAnnouncement,
  getInitialSimulationState,
  isAnimationEnabled,
  nudgeTarget,
  pointerToArenaPoint,
  setTarget,
  stepSimulation,
  type SimulationState,
} from '@/components/projects/predator-prey/predator-prey-logic';

/**
 * "Don't get caught" — a playable predator/prey chase paired with the
 * "Predatory and Prey Behavior Modifying MIP Robots" project. The PREY (cyan)
 * follows the player's steering; the PREDATOR (rose) hunts it using only what
 * its infrared cone can see. Both drive as nonholonomic two-wheeled robots,
 * matching the real MIP hardware. All drive physics, IR sensing, boundary
 * handling, and catch detection lives in ./predator-prey-logic; this component
 * only wires that state to the DOM.
 *
 * Position updates run at animation-frame rate but never touch React state
 * (ENGINEERING-STANDARDS §3.1) — the simulation lives in a ref and every
 * frame writes cx/cy/textContent straight onto the DOM via refs. React state
 * is reserved for the rare, low-frequency events a screen reader or the
 * catch/best-time readout actually needs to react to: a catch.
 *
 * The very first frame is seeded with the fixed INITIAL_SIM_SEED so the
 * server-rendered HTML and the client's first paint show an identical
 * layout (CLAUDE.md #10 — hydration safety). The requestAnimationFrame loop
 * itself only ever runs client-side after mount, and only on tiers with
 * headroom for continuous motion — lite/reduced tiers get a static frame.
 *
 * The loop is also gated on the card actually being scrolled into view
 * (framer-motion's `useInView`, real IntersectionObserver under the hood —
 * already mocked to `true` by this suite's shared framer-motion mock, so no
 * new test infrastructure was needed). Previously the timer and catch count
 * started accruing the instant this component mounted — which, since every
 * section renders statically from initial load (§4.7's rejected code-
 * splitting experiment), meant the survival clock and catches were already
 * running before a visitor had scrolled anywhere near Projects. The effect's
 * own cleanup (`cancelAnimationFrame`) pauses the simulation when scrolled
 * out of view and resumes it — not reset — when scrolled back in.
 */
export default function PredatorPreyChase() {
  const { performanceTier } = usePerformanceProfile();
  const animationEnabled = isAnimationEnabled(performanceTier);

  // The very first render (server AND client) needs a stable, render-safe value for the
  // circles' initial cx/cy — useState, not a ref (React 19 forbids reading `ref.current`
  // during render). Every frame after that mutates simRef.current directly via the RAF
  // loop below and writes straight to the DOM, bypassing React entirely for position.
  const [initialSim] = useState(getInitialSimulationState);
  const simRef = useRef<SimulationState>(initialSim);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.3 });

  const preyElRef = useRef<SVGCircleElement>(null);
  const predatorElRef = useRef<SVGCircleElement>(null);
  const irConeElRef = useRef<SVGPathElement>(null);
  const timerElRef = useRef<HTMLSpanElement>(null);

  const [catches, setCatches] = useState(0);
  const [bestSeconds, setBestSeconds] = useState(() => formatSurvivalSeconds(0));
  const [announcement, setAnnouncement] = useState('');

  const handlePointerMove = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { x, y } = pointerToArenaPoint(event.clientX, event.clientY, rect);
    setTarget(simRef.current!, x, y);
  }, []);

  // Keyboard-only equivalent to pointer steering (WCAG 2.1.1) — arrow keys nudge
  // the same seek target a pointer would, so the game is fully playable without a mouse.
  const handleKeyDown = useCallback((event: React.KeyboardEvent<SVGSVGElement>) => {
    if (nudgeTarget(simRef.current!, event.key)) {
      event.preventDefault();
    }
  }, []);

  useEffect(() => {
    if (!animationEnabled || !isInView) return undefined;

    const state = simRef.current!;
    let frameId: number;
    // Seeded from the first RAF callback's OWN timestamp, not the DOM high-res clock read
    // at effect-setup time: requestAnimationFrame timestamps aren't guaranteed to share that
    // clock's time base (and definitely don't in tests that stub RAF with synthetic small
    // timestamps), so mixing the two produces a bogus first-frame dtMs.
    let lastTime: number | null = null;

    const tick = (now: number) => {
      if (lastTime === null) lastTime = now;
      const dtMs = now - lastTime;
      lastTime = now;

      const previousCatches = state.catches;
      stepSimulation(state, dtMs);

      // This effect depends on the same `animationEnabled` flag that gates the <svg>/
      // circles/<span> below into existence, so by the time a frame runs, every ref here
      // is guaranteed populated — no defensive null-check branch to leave untested.
      predatorElRef.current!.setAttribute('cx', String(state.predator.x));
      predatorElRef.current!.setAttribute('cy', String(state.predator.y));
      // The IR cone is written straight to the DOM each frame, same channel as
      // the entity positions — no React state, no re-render (§3.1).
      irConeElRef.current!.setAttribute('d', buildIrConePath(state.predator));
      irConeElRef.current!.setAttribute('fill-opacity', String(getIrConeOpacity(state.predatorHasContact)));
      preyElRef.current!.setAttribute('cx', String(state.prey.x));
      preyElRef.current!.setAttribute('cy', String(state.prey.y));
      timerElRef.current!.textContent = formatSurvivalSeconds(state.elapsedMs);

      if (state.catches !== previousCatches) {
        const bestLabel = formatSurvivalSeconds(state.bestSurvivalMs);
        setCatches(state.catches);
        setBestSeconds(bestLabel);
        setAnnouncement(getCatchAnnouncement(state.catches, formatSurvivalSeconds(state.lastSurvivalMs), bestLabel));
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [animationEnabled, isInView]);

  return (
    <div
      ref={containerRef}
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="predator-prey-chase"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Don&rsquo;t Get Caught</h3>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>
            Survived{' '}
            <strong className="text-cyan-300">
              <span ref={timerElRef} data-testid="pp-timer">
                {formatSurvivalSeconds(initialSim.elapsedMs)}
              </span>
              s
            </strong>
          </span>
          <span>
            Catches <strong data-testid="pp-catches" className="text-rose-300">{catches}</strong>
          </span>
          <span>
            Best <strong data-testid="pp-best" className="text-emerald-300">{bestSeconds}s</strong>
          </span>
        </div>
      </div>

      <p className="mb-2 text-sm text-muted-foreground">
        Move your cursor over the arena (or drag on touch) to steer the prey. Both robots are modelled on the real
        MIP hardware: two wheels, no sideways motion, so they have to turn before they can go. Keyboard: focus the
        arena and use the arrow keys.
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        The rose wedge is the predator&rsquo;s <strong className="text-rose-300">infrared cone</strong> — the only way
        it can see. It brightens on contact. Slip outside the cone and it loses you, drives to your last known
        position, then sweeps to search. It turns at half your rate, so out-turning it is how you escape.
      </p>

      {animationEnabled ? (
        <svg
          viewBox={`0 0 ${ARENA_SIZE} ${ARENA_SIZE}`}
          className="aspect-square w-full max-w-xs touch-none rounded-xl border border-white/10 bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          role="application"
          tabIndex={0}
          aria-label={SIMULATION_ARIA_LABEL}
          onPointerMove={handlePointerMove}
          onKeyDown={handleKeyDown}
          data-testid="pp-arena"
        >
          {/* IR detection cone — drawn first so it sits behind both robots. */}
          <path
            ref={irConeElRef}
            data-testid="pp-ir-cone"
            aria-hidden="true"
            d={buildIrConePath(initialSim.predator)}
            fill="#f87171"
            fillOpacity={getIrConeOpacity(initialSim.predatorHasContact)}
            stroke="#f87171"
            strokeOpacity={0.25}
            strokeWidth={0.4}
          />
          <circle
            ref={predatorElRef}
            data-testid="pp-predator"
            cx={initialSim.predator.x}
            cy={initialSim.predator.y}
            r={PREDATOR_VISUAL_RADIUS}
            className="fill-rose-500"
          />
          <circle
            ref={preyElRef}
            data-testid="pp-prey"
            cx={initialSim.prey.x}
            cy={initialSim.prey.y}
            r={PREY_VISUAL_RADIUS}
            className="fill-cyan-300"
          />
        </svg>
      ) : (
        <div
          className="flex aspect-square w-full max-w-xs items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4 text-center text-xs text-muted-foreground"
          aria-label={SIMULATION_ARIA_LABEL}
          data-testid="pp-paused"
        >
          {PAUSED_CAPTION}
        </div>
      )}

      <p role="status" aria-live="polite" data-testid="pp-announcement" className="mt-3 min-h-[1.25rem] text-sm font-medium text-cyan-200">
        {announcement}
      </p>
    </div>
  );
}
