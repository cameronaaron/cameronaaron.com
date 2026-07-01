'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import {
  type BurstParticle,
  type ParticleQuality,
  type PointerState,
  CONNECTION_OPACITY_TIERS,
  PARTICLE_COLORS,
  buildConnections,
  createBurstParticles,
  createInitialParticles,
  getConnectionOpacityTier,
  getParticlePulse,
  getQualityConfig,
  normalizePointerToPercent,
  stepBursts,
  stepParticles,
} from './interactive-particles/engine';

interface InteractiveParticlesProps {
  quality?: ParticleQuality;
}

/** Sprite canvas edge in px; the glow gradient fills the full sprite. */
const SPRITE_SIZE = 64;
/** Draw diameter multiplier so the sprite covers the old core + box-shadow glow. */
const GLOW_DIAMETER_MULTIPLIER = 6;

/**
 * Pre-render one radial glow sprite per particle colour. Rendering glows via
 * drawImage is dramatically cheaper than per-particle shadowBlur or the old
 * per-particle DOM box-shadow.
 */
function createGlowSprite(color: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = SPRITE_SIZE;
  sprite.height = SPRITE_SIZE;
  const spriteCtx = sprite.getContext('2d');
  if (spriteCtx) {
    const half = SPRITE_SIZE / 2;
    const gradient = spriteCtx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.25, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    spriteCtx.fillStyle = gradient;
    spriteCtx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
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
export default function InteractiveParticles({ quality = 'full' }: InteractiveParticlesProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion || quality === 'reduced' || quality === 'lite') return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = getQualityConfig(quality);
    let particles = createInitialParticles(config.count, quality === 'balanced' ? 2024 : 1337);
    let bursts: BurstParticle[] = [];
    const pointer: PointerState = { x: 50, y: 50, active: false };
    let burstId = 0;
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastTick = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sprites = new Map<string, HTMLCanvasElement>();
    for (const color of PARTICLE_COLORS) {
      sprites.set(color, createGlowSprite(color));
    }

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
      });
      burstId += nextBursts.length;
      bursts = bursts.concat(nextBursts).slice(-config.maxBursts);
    };

    const drawGlow = (colorKey: string, xPercent: number, yPercent: number, diameter: number, alpha: number) => {
      // Every particle/burst colour comes from PARTICLE_COLORS, so the sprite always exists.
      const sprite = sprites.get(colorKey)!;
      const x = (xPercent / 100) * width;
      const y = (yPercent / 100) * height;
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

      particles = stepParticles(particles, step, pointer, quality);
      bursts = stepBursts(bursts, step);
      const lines = buildConnections(particles, config.connectionDistance, config.maxConnections);

      ctx.clearRect(0, 0, width, height);

      // Connections: one batched stroke per opacity tier, never per line.
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
      for (let tier = 0; tier < CONNECTION_OPACITY_TIERS.length; tier += 1) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(103, 232, 249, ${CONNECTION_OPACITY_TIERS[tier]})`;
        for (const line of lines) {
          if (getConnectionOpacityTier(line.opacity) !== tier) continue;
          ctx.moveTo((line.x1 / 100) * width, (line.y1 / 100) * height);
          ctx.lineTo((line.x2 / 100) * width, (line.y2 / 100) * height);
        }
        ctx.stroke();
      }

      for (const particle of particles) {
        const pulse = getParticlePulse(time, particle.id);
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

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseout', handlePointerLeave, { passive: true });
    window.addEventListener('mousedown', handlePointerDown, { passive: true });
    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseout', handlePointerLeave);
      window.removeEventListener('mousedown', handlePointerDown);
      cancelAnimationFrame(frameId);
    };
  }, [prefersReducedMotion, quality]);

  if (quality === 'reduced' || quality === 'lite') {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />

      <motion.div
        className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(16,185,129,0.08) 36%, rgba(6,13,20,0) 72%)',
          filter: 'blur(10px)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
