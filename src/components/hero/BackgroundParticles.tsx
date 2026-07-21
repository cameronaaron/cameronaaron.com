'use client';

import { useEffect, useRef } from 'react';
import {
  BACKGROUND_OPACITY_TIERS,
  MOUSE_ACTIVE_THRESHOLD,
  MOUSE_INACTIVE_POSITION,
  advanceBackgroundParticle,
  applyMousePull,
  createBackgroundParticles,
  createSpatialGrid,
  forEachConnectedPair,
  getBackgroundParticleConfig,
  getGridDimensions,
  rebuildSpatialGrid,
  shouldRenderBackgroundParticles,
  type Particle,
  type ParticleQuality,
  type SpatialGrid,
} from '@/components/hero/background-particles/background-particles-engine';
import { gateLoopOnVisibility } from '@/components/hero/visibility-gate';

interface BackgroundParticlesProps {
  quality?: ParticleQuality;
}

export default function BackgroundParticles({ quality = 'full' }: BackgroundParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!shouldRenderBackgroundParticles(quality)) return;

    const canvas = canvasRef.current!;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;

    const activeConfig = getBackgroundParticleConfig(quality);
    
    const mouse = {
      x: MOUSE_INACTIVE_POSITION,
      y: MOUSE_INACTIVE_POSITION,
      radius: activeConfig.mouseRadius
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const gridCellSize = activeConfig.connectDistance || 1;
    // Assigned on first resize; only accessed when activeConfig.useConnections is true
    let spatialGrid!: SpatialGrid;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (activeConfig.useConnections) {
        const { cols, rows } = getGridDimensions(width, height, gridCellSize);
        spatialGrid = createSpatialGrid(cols, rows);
      }
      initParticles();
    };

    const initParticles = () => {
      particles = createBackgroundParticles(width, height, activeConfig);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = MOUSE_INACTIVE_POSITION;
      mouse.y = MOUSE_INACTIVE_POSITION;
    };

    const connectDist2 = activeConfig.connectDistance * activeConfig.connectDistance;
    const mouseRadius2 = mouse.radius * mouse.radius;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // ── Advance all particles ─────────────────────────────────────────────
      for (const p of particles) {
        advanceBackgroundParticle(p, width, height);
      }

      // ── Mouse-pull physics (extracted to engine, mutates in place) ───────
      if (activeConfig.useMousePull && mouse.x > MOUSE_ACTIVE_THRESHOLD) {
        applyMousePull(particles, mouse.x, mouse.y, mouse.radius);
      }

      // ── Spatial-grid connections: O(n·k) → one path, one stroke() ───────
      if (activeConfig.useConnections) {
        rebuildSpatialGrid(spatialGrid, particles, gridCellSize);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
        ctx.lineWidth = 0.5;
        forEachConnectedPair(spatialGrid, particles, gridCellSize, connectDist2, (_i, _j, pi, pj) => {
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
        });
        ctx.stroke();
      }

      // ── Batch mouse-pull lines — one path, one stroke() ──────────────────
      if (activeConfig.useMousePull && mouse.x > MOUSE_ACTIVE_THRESHOLD) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.55)';
        ctx.lineWidth = 1;
        for (const p of particles) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          if (dx * dx + dy * dy < mouseRadius2) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
          }
        }
        ctx.stroke();
      }

      // ── Batch particles in 3 opacity tiers — 3 fill() calls ──────────────
      let prevThreshold = 0;
      for (const tier of BACKGROUND_OPACITY_TIERS) {
        ctx.beginPath();
        ctx.fillStyle = tier.style;
        for (const p of particles) {
          if (p.opacity > prevThreshold && p.opacity <= tier.threshold) {
            ctx.moveTo(p.x + p.size, p.y);
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          }
        }
        ctx.fill();
        prevThreshold = tier.threshold;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    // §3.7: run the draw loop only while the hero is actually on-screen and the
    // tab is foregrounded. Particle state lives in `particles` (this closure),
    // so pausing/resuming the loop is seamless. `animationFrameId` doubles as
    // the running flag — 0 means paused, so startLoop can't double-schedule.
    const startLoop = () => {
      if (!animationFrameId) draw();
    };
    const stopLoop = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    };

    window.addEventListener('resize', resize, { passive: true });

    if (activeConfig.useMousePull) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseout', handleMouseLeave, { passive: true });
    }

    resize();
    startLoop();
    const releaseGate = gateLoopOnVisibility(canvas, { onResume: startLoop, onPause: stopLoop });

    return () => {
      releaseGate();
      window.removeEventListener('resize', resize);

      if (activeConfig.useMousePull) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseout', handleMouseLeave);
      }

      stopLoop();
    };
  }, [quality]);

  if (!shouldRenderBackgroundParticles(quality)) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
