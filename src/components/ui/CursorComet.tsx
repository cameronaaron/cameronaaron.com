'use client';

import { useEffect, useRef } from 'react';

import {
  type BurstParticle,
  GLOW_DIAMETER_MULTIPLIER,
  GLOW_SPRITE_SIZE,
  PARTICLE_COLORS,
  appendBursts,
  getGlowGradientStops,
  stepBursts,
} from '@/components/hero/interactive-particles/engine';
import { AURORA_SURGE_EVENT } from '@/components/ui/aurora-surge-logic';
import {
  MAX_TRAIL_SPARKS,
  SURGE_SPARK_COUNT,
  createSurgeSparks,
  createTrailSparks,
  getSparkEmitCount,
} from '@/components/ui/cursor-comet-logic';

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
 * Full-viewport comet trail: the pointer sheds glowing sparks that drift and
 * fade. Reuses the hero burst engine (same BurstParticle pool contract) in px
 * space. The rAF loop SLEEPS whenever no sparks are alive and the pointer is
 * still — a motionless page costs zero frames. The parent gates this to the
 * full performance tier, so it never runs on touch or low-spec devices.
 */
export default function CursorComet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const sparks: BurstParticle[] = [];
    let sparkId = 0;
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastTick = 0;

    // Pointer state written by events, consumed once per frame.
    let pointerX = 0;
    let pointerY = 0;
    let lastEmitX = 0;
    let lastEmitY = 0;
    let pendingDistance = 0;

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

      // Emission: distance accumulated since the last emit earns sparks,
      // capped per frame; direction comes from the last movement vector.
      const emitCount = getSparkEmitCount(pendingDistance);
      if (emitCount > 0) {
        const next = createTrailSparks({
          baseX: pointerX,
          baseY: pointerY,
          dirX: pointerX - lastEmitX,
          dirY: pointerY - lastEmitY,
          count: emitCount,
          startId: sparkId,
        });
        sparkId += next.length;
        appendBursts(sparks, next, MAX_TRAIL_SPARKS);
        lastEmitX = pointerX;
        lastEmitY = pointerY;
        pendingDistance = 0;
      }

      stepBursts(sparks, step);

      ctx.clearRect(0, 0, width, height);
      for (const spark of sparks) {
        // Colours come from PARTICLE_COLORS, so the sprite always exists.
        const sprite = sprites.get(spark.color)!;
        const diameter = spark.size * GLOW_DIAMETER_MULTIPLIER * spark.life;
        ctx.globalAlpha = Math.min(1, spark.life);
        ctx.drawImage(sprite, spark.x - diameter / 2, spark.y - diameter / 2, diameter, diameter);
      }
      ctx.globalAlpha = 1;

      // Sleep once the trail has burned out — wake() restarts on movement.
      if (sparks.length === 0 && pendingDistance === 0) {
        frameId = 0;
        return;
      }

      frameId = requestAnimationFrame(animate);
    };

    const wake = () => {
      if (frameId) return;
      lastTick = 0;
      frameId = requestAnimationFrame(animate);
    };

    const handlePointerMove = (event: MouseEvent) => {
      const dx = event.clientX - pointerX;
      const dy = event.clientY - pointerY;
      pendingDistance += Math.sqrt(dx * dx + dy * dy);
      pointerX = event.clientX;
      pointerY = event.clientY;
      wake();
    };

    const handleSurge = () => {
      const storm = createSurgeSparks({
        width,
        height,
        count: SURGE_SPARK_COUNT,
        startId: sparkId,
      });
      sparkId += storm.length;
      appendBursts(sparks, storm, MAX_TRAIL_SPARKS);
      wake();
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener(AURORA_SURGE_EVENT, handleSurge, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener(AURORA_SURGE_EVENT, handleSurge);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
