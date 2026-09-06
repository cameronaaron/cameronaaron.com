'use client';

import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import {
  type BurstParticle,
  type Connection,
  type ParticlePulse,
  type ParticleQuality,
  type PointerState,
  CONNECTION_OPACITY_TIERS,
  CONNECTION_TIER_STYLES,
  GLOW_DIAMETER_MULTIPLIER,
  GLOW_SPRITE_SIZE,
  KNN_LINK_RADIUS_SQ,
  KNN_LINK_STYLE,
  PARTICLE_COLORS,
  appendBursts,
  buildConnections,
  collectNearestParticles,
  createBurstParticles,
  createInitialParticles,
  createKnnHeap,
  getConnectionOpacityTier,
  getConnectionTierStyles,
  getGlowGradientStops,
  getKnnLinkStyle,
  getParticlePulse,
  getQualityConfig,
  normalizePointerToPercent,
  percentToPx,
  recolorParticles,
  stepBursts,
  stepParticles,
} from './interactive-particles/interactive-particles-engine';
import { gateLoopOnVisibility } from '@/components/hero/visibility-gate';

interface InteractiveParticlesProps {
  quality?: ParticleQuality;
  colors?: readonly string[];
  connectionRgb?: string;
}

/**
 * Pre-render one radial glow sprite per particle colour. Rendering glows via
 * drawImage is dramatically cheaper than per-particle shadowBlur or the old
 * per-particle DOM box-shadow. Gradient geometry lives in the engine module.
 */
function createGlowSprite(color: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = GLOW_SPRITE_SIZE;
  sprite.height = GLOW_SPRITE_SIZE;
  const spriteCtx = sprite.getContext('2d');
  if (spriteCtx) {
    const half = GLOW_SPRITE_SIZE / 2;
    const gradient = spriteCtx.createRadialGradient(half, half, 0, half, half, half);
    for (const stop of getGlowGradientStops(color)) {
      gradient.addColorStop(stop.offset, stop.color);
    }
    spriteCtx.fillStyle = gradient;
    spriteCtx.fillRect(0, 0, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE);
  }
  return sprite;
}

/**
 * Canvas-rendered interactive particle field.
 *
 * The simulation lives in ./interactive-particles/engine (pure, tested);
 * this component owns only DOM concerns: one canvas, pointer listeners, and
 * a rAF loop. Nothing here touches React state per frame — the old
 * implementation drove ~130 absolutely-positioned DOM nodes through
 * setState + left/top at 60fps, forcing reconciliation and layout every frame.
 */
export default function InteractiveParticles({
  quality = 'full',
  colors = PARTICLE_COLORS,
  connectionRgb = '126, 231, 255',
}: InteractiveParticlesProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorsRef = useRef(colors);
  const connectionRgbRef = useRef(connectionRgb);
  const applyPaletteRef = useRef<((nextColors: readonly string[], rgb: string) => void) | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || quality === 'reduced' || quality === 'lite') return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = getQualityConfig(quality);
    const particles = createInitialParticles(config.count, quality === 'balanced' ? 2024 : 1337, colorsRef.current);
    const bursts: BurstParticle[] = [];
    const pointer: PointerState = { x: 50, y: 50, active: false };

    // Persistent frame buffers — allocated once per effect, reused every frame
    // so the steady-state rAF loop performs zero allocations.
    const connectionPool: Connection[] = [];
    const tierScratch = new Uint8Array(config.maxConnections);
    const pulseScratch: ParticlePulse = { scale: 1, opacityMultiplier: 1 };
    // Bounded max-heap reused every frame for the cursor's K-nearest links.
    const knnHeap = createKnnHeap();

    let burstId = 0;
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastTick = 0;
    let connectionStyles: readonly string[] = CONNECTION_TIER_STYLES;
    let knnStyle = KNN_LINK_STYLE;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sprites = new Map<string, HTMLCanvasElement>();
    const ensureSprites = (palette: readonly string[]) => {
      for (const color of palette) {
        if (!sprites.has(color)) sprites.set(color, createGlowSprite(color));
      }
    };
    ensureSprites(colorsRef.current);

    const applyPalette = (nextColors: readonly string[], rgb: string) => {
      recolorParticles(particles, nextColors);
      ensureSprites(nextColors);
      connectionStyles = getConnectionTierStyles(rgb);
      knnStyle = getKnnLinkStyle(rgb);
    };
    applyPalette(colorsRef.current, connectionRgbRef.current);
    applyPaletteRef.current = applyPalette;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handlePointerMove = (event: MouseEvent) => {
      const { x, y } = normalizePointerToPercent(event.clientX, event.clientY, width, height);
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handlePointerDown = (event: MouseEvent) => {
      const { x: baseX, y: baseY } = normalizePointerToPercent(event.clientX, event.clientY, width, height);
      const nextBursts = createBurstParticles({
        baseX,
        baseY,
        count: config.burstCount,
        startId: burstId,
        colors: colorsRef.current,
      });
      burstId += nextBursts.length;
      appendBursts(bursts, nextBursts, config.maxBursts);
    };

    const drawGlow = (colorKey: string, xPercent: number, yPercent: number, diameter: number, alpha: number) => {
      // Every particle/burst colour comes from the active palette, so the sprite always exists.
      const sprite = sprites.get(colorKey)!;
      const x = percentToPx(xPercent, width);
      const y = percentToPx(yPercent, height);
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.drawImage(sprite, x - diameter / 2, y - diameter / 2, diameter, diameter);
    };

    const animate = (time: number) => {
      if (!lastTick) {
        lastTick = time;
      }

      const delta = Math.min(34, time - lastTick);
      if (delta < 16) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      lastTick = time;
      const step = delta / 16;

      stepParticles(particles, step, pointer, quality);
      stepBursts(bursts, step);
      const lines = buildConnections(particles, config.connectionDistance, config.maxConnections, connectionPool);

      ctx.clearRect(0, 0, width, height);

      // Connections: tier computed once per line into the persistent scratch,
      // then one batched stroke per opacity tier — never per line.
      for (let k = 0; k < lines.length; k += 1) {
        tierScratch[k] = getConnectionOpacityTier(lines[k].opacity);
      }
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
      for (let tier = 0; tier < CONNECTION_OPACITY_TIERS.length; tier += 1) {
        ctx.beginPath();
        ctx.strokeStyle = connectionStyles[tier];
        for (let k = 0; k < lines.length; k += 1) {
          if (tierScratch[k] !== tier) continue;
          const line = lines[k];
          ctx.moveTo(percentToPx(line.x1, width), percentToPx(line.y1, height));
          ctx.lineTo(percentToPx(line.x2, width), percentToPx(line.y2, height));
        }
        ctx.stroke();
      }

      // Cursor constellation: link the pointer to its K nearest particles,
      // selected via the bounded max-heap (O(n·log K), zero allocation). All K
      // links draw in one batched stroke (§2.7) — bounded, never per particle.
      if (pointer.active) {
        collectNearestParticles(particles, pointer.x, pointer.y, KNN_LINK_RADIUS_SQ, knnHeap);
        // The loop naturally draws nothing when the heap is empty, so no guard
        // is needed — and the link count is bounded by the heap capacity.
        const pointerPx = percentToPx(pointer.x, width);
        const pointerPy = percentToPx(pointer.y, height);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.strokeStyle = knnStyle;
        ctx.beginPath();
        for (let k = 0; k < knnHeap.size; k += 1) {
          const near = particles[knnHeap.index[k]];
          ctx.moveTo(pointerPx, pointerPy);
          ctx.lineTo(percentToPx(near.x, width), percentToPx(near.y, height));
        }
        ctx.stroke();
      }

      for (const particle of particles) {
        const pulse = getParticlePulse(time, particle.id, pulseScratch);
        drawGlow(
          particle.color,
          particle.x,
          particle.y,
          particle.size * GLOW_DIAMETER_MULTIPLIER * pulse.scale,
          particle.opacity * pulse.opacityMultiplier
        );
      }

      for (const burst of bursts) {
        drawGlow(burst.color, burst.x, burst.y, burst.size * GLOW_DIAMETER_MULTIPLIER, burst.life);
      }

      ctx.globalAlpha = 1;
      frameId = requestAnimationFrame(animate);
    };

    // §3.7: draw only while the hero is on-screen and the tab is foregrounded.
    // Particle/burst state persists in this closure, so pause/resume is
    // seamless; resetting lastTick avoids a single catch-up frame on resume.
    // frameId doubles as the running flag (0 = paused) so startLoop can't
    // double-schedule.
    const startLoop = () => {
      if (!frameId) {
        lastTick = 0;
        frameId = requestAnimationFrame(animate);
      }
    };
    const stopLoop = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseout', handlePointerLeave, { passive: true });
    window.addEventListener('mousedown', handlePointerDown, { passive: true });
    startLoop();
    const releaseGate = gateLoopOnVisibility(canvas, { onResume: startLoop, onPause: stopLoop });

    return () => {
      applyPaletteRef.current = null;
      releaseGate();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseout', handlePointerLeave);
      window.removeEventListener('mousedown', handlePointerDown);
      stopLoop();
    };
  }, [prefersReducedMotion, quality]);

  useEffect(() => {
    colorsRef.current = colors;
    connectionRgbRef.current = connectionRgb;
    applyPaletteRef.current?.(colors, connectionRgb);
  }, [colors, connectionRgb]);

  if (quality === 'reduced' || quality === 'lite') {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />

      <div
        aria-hidden="true"
        className="hero-particle-core-anim absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
      />
    </div>
  );
}
