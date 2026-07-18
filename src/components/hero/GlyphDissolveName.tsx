'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import TypewriterEffect from '@/components/ui/TypewriterEffect';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import {
  GLYPH_ALPHA_THRESHOLD,
  GLYPH_PARTICLE_FILL_STYLE,
  GLYPH_PARTICLE_MAX,
  GLYPH_PARTICLE_RADIUS_PX,
  GLYPH_SAMPLE_STRIDE,
  computeDomTextOpacity,
  computeGlyphParticlePosition,
  computeScatterTarget,
  hasEnteringFinished,
  hasLeavingFinished,
  sampleGlyphPositions,
  shouldEnableGlyphDissolve,
  type GlyphAnimationPhase,
  type Point2D,
} from '@/components/hero/glyph-dissolve-logic';

interface GlyphDissolveNameProps {
  text: string;
  typingSpeed?: number;
  className?: string;
}

interface ParticleBuffers {
  originX: Float32Array;
  originY: Float32Array;
  targetX: Float32Array;
  targetY: Float32Array;
  swirlPhase: Float32Array;
  count: number;
}

/** Canvas 2D context methods this effect needs — feature-detected before use. */
interface DrawableContext2D extends CanvasRenderingContext2D {
  getImageData: CanvasRenderingContext2D['getImageData'];
  fillText: CanvasRenderingContext2D['fillText'];
}

function hasRequiredCanvasApi(ctx: CanvasRenderingContext2D | null): ctx is DrawableContext2D {
  return Boolean(ctx) && typeof ctx!.getImageData === 'function' && typeof ctx!.fillText === 'function';
}

/**
 * The Hero name: types out normally on load (TypewriterEffect, unchanged),
 * then — hover-capable fine-pointer devices on the `full` performance tier
 * only, once typing has finished — dissolves into a scatter of canvas-drawn
 * particles on mouse-enter and reassembles into the real text on mouse-leave.
 *
 * The real DOM text is ALWAYS present (screen readers, text selection, and
 * SEO never see anything else); the canvas is a purely decorative overlay
 * that only ever mounts while the effect is actively animating. Every
 * position/opacity formula lives in ./glyph-dissolve-logic, fully unit
 * tested there — this component only samples the canvas, drives one RAF
 * loop, and writes the computed points into it (O(1) per particle per
 * frame, reused Float32Array buffers, zero per-frame allocation).
 *
 * Defensive by design: if the browser's canvas 2D context is missing
 * (jsdom's test mock, or a genuinely old browser), sampling silently no-ops
 * and only the plain typed text ever shows — this can't throw out to the
 * page.
 */
export default function GlyphDissolveName({ text, typingSpeed, className = '' }: GlyphDissolveNameProps) {
  const { performanceTier } = usePerformanceProfile();
  const { enableHoverMotion } = useInteractionMode();
  const [hasTypingCompleted, setHasTypingCompleted] = useState(false);
  const handleTypingComplete = useCallback(() => setHasTypingCompleted(true), []);

  const enabled = shouldEnableGlyphDissolve(performanceTier, enableHoverMotion, hasTypingCompleted);

  const containerRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasActive, setCanvasActive] = useState(false);
  const [domOpacity, setDomOpacity] = useState(1);

  const particlesRef = useRef<ParticleBuffers | null>(null);
  const canvasSizeRef = useRef<{ width: number; height: number } | null>(null);
  const phaseRef = useRef<GlyphAnimationPhase>('entering');
  const phaseStartRef = useRef(0);
  const leaveStartRef = useRef<Point2D[]>([]);
  const frameIdRef = useRef<number | null>(null);

  const stopLoop = useCallback(() => {
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
  }, []);

  // Cancel any in-flight frame on unmount — lifecycle-hygiene-contract's RAF sweep.
  useEffect(() => stopLoop, [stopLoop]);

  // Sampling only needs the CONTAINER (always in the DOM) and an offscreen
  // canvas this function creates itself — it never touches canvasRef, so it
  // can run entirely synchronously in the event handler. Starting the RAF
  // loop against the REAL <canvas> has to wait for that element to actually
  // exist, which only happens after setCanvasActive(true) causes a
  // re-render — that hand-off happens in the effect below, keyed on
  // canvasActive, exactly the pattern React requires for "act on a ref right
  // after its element mounts."
  const handleMouseEnter = useCallback(() => {
    // No `enabled`/containerRef null-checks here: the JSX below only ever wires this
    // handler up when `enabled` is true (onMouseEnter={enabled ? handleMouseEnter :
    // undefined}), and containerRef is attached to the always-rendered outer <span> —
    // so this only ever runs with enabled=true and a real container.
    const container = containerRef.current!;
    const rect = container.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    if (width <= 0 || height <= 0) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const sampleCtx = offscreen.getContext('2d');
    if (!hasRequiredCanvasApi(sampleCtx)) return; // unsupported environment — stay plain text

    const computedStyle = window.getComputedStyle(container);
    sampleCtx.font = computedStyle.font || `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
    sampleCtx.fillStyle = '#fff';
    sampleCtx.textBaseline = 'middle';
    sampleCtx.fillText(text, 0, height / 2);

    let imageData: ImageData;
    try {
      imageData = sampleCtx.getImageData(0, 0, width, height);
    } catch {
      return; // e.g. a tainted-canvas SecurityError — never throw out to the caller
    }

    const sampled = sampleGlyphPositions(imageData, GLYPH_SAMPLE_STRIDE, GLYPH_PARTICLE_MAX, GLYPH_ALPHA_THRESHOLD);
    if (sampled.count === 0) return;

    const targetX = new Float32Array(sampled.count);
    const targetY = new Float32Array(sampled.count);
    const swirlPhase = new Float32Array(sampled.count);
    for (let i = 0; i < sampled.count; i += 1) {
      const target = computeScatterTarget({ x: sampled.x[i], y: sampled.y[i] });
      targetX[i] = target.x;
      targetY[i] = target.y;
      swirlPhase[i] = Math.random() * Math.PI * 2;
    }

    particlesRef.current = { originX: sampled.x, originY: sampled.y, targetX, targetY, swirlPhase, count: sampled.count };
    leaveStartRef.current = [];
    canvasSizeRef.current = { width, height };
    phaseRef.current = 'entering';
    phaseStartRef.current = performance.now();
    setCanvasActive(true);
  }, [text]);

  // Runs only once canvasActive flips true, i.e. only once the <canvas> below
  // has actually mounted and canvasRef.current is populated.
  useEffect(() => {
    if (!canvasActive) return undefined;
    // The effect depends on the same `canvasActive` flag that gates the <canvas>'s
    // conditional render below, so by the time this runs React has already attached
    // the ref — canvasRef.current (and canvasSizeRef.current, set together with
    // setCanvasActive(true) in handleMouseEnter above) are both guaranteed non-null.
    const canvas = canvasRef.current!;
    const size = canvasSizeRef.current!;

    canvas.width = size.width;
    canvas.height = size.height;
    const drawCtx = canvas.getContext('2d');
    if (!hasRequiredCanvasApi(drawCtx)) {
      setCanvasActive(false);
      return undefined;
    }

    const tick = (now: number) => {
      // Always set together with setCanvasActive(true) in handleMouseEnter above —
      // particlesRef.current is guaranteed non-null for the lifetime of this effect.
      const particles = particlesRef.current!;

      const elapsed = now - phaseStartRef.current;
      drawCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawCtx.fillStyle = GLYPH_PARTICLE_FILL_STYLE;

      for (let i = 0; i < particles.count; i += 1) {
        const origin: Point2D = { x: particles.originX[i], y: particles.originY[i] };
        const target: Point2D = { x: particles.targetX[i], y: particles.targetY[i] };
        const leaveStart = leaveStartRef.current[i] ?? target;
        const point = computeGlyphParticlePosition(
          phaseRef.current,
          elapsed,
          origin,
          target,
          leaveStart,
          particles.swirlPhase[i],
        );
        drawCtx.beginPath();
        drawCtx.arc(point.x, point.y, GLYPH_PARTICLE_RADIUS_PX, 0, Math.PI * 2);
        drawCtx.fill();
      }

      setDomOpacity(computeDomTextOpacity(phaseRef.current, elapsed));

      if (phaseRef.current === 'entering' && hasEnteringFinished(elapsed)) {
        phaseRef.current = 'hovering';
        phaseStartRef.current = now;
      } else if (phaseRef.current === 'leaving' && hasLeavingFinished(elapsed)) {
        stopLoop();
        setCanvasActive(false);
        setDomOpacity(1);
        return;
      }

      frameIdRef.current = requestAnimationFrame(tick);
    };

    frameIdRef.current = requestAnimationFrame(tick);
    return stopLoop;
  }, [canvasActive, stopLoop]);

  const handleMouseLeave = useCallback(() => {
    const particles = particlesRef.current;
    if (!particles || phaseRef.current === 'leaving') return;

    const now = performance.now();
    const elapsed = now - phaseStartRef.current;
    const snapshot: Point2D[] = [];
    for (let i = 0; i < particles.count; i += 1) {
      const origin: Point2D = { x: particles.originX[i], y: particles.originY[i] };
      const target: Point2D = { x: particles.targetX[i], y: particles.targetY[i] };
      const prevLeaveStart = leaveStartRef.current[i] ?? target;
      snapshot.push(
        computeGlyphParticlePosition(phaseRef.current, elapsed, origin, target, prevLeaveStart, particles.swirlPhase[i]),
      );
    }
    leaveStartRef.current = snapshot;
    phaseRef.current = 'leaving';
    phaseStartRef.current = now;
  }, []);

  return (
    <span
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={enabled ? handleMouseEnter : undefined}
      onMouseLeave={enabled ? handleMouseLeave : undefined}
      data-testid="glyph-dissolve-name"
    >
      <span style={canvasActive ? { opacity: domOpacity } : undefined}>
        <TypewriterEffect text={text} typingSpeed={typingSpeed} onComplete={handleTypingComplete} />
      </span>
      {canvasActive ? (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          data-testid="glyph-dissolve-canvas"
        />
      ) : null}
    </span>
  );
}
