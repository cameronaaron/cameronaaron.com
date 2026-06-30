'use client';

import { useEffect, useRef } from 'react';
import {
  advanceBackgroundParticle,
  createBackgroundParticles,
  createSpatialGrid,
  forEachConnectedPair,
  getBackgroundParticleConfig,
  getDistance,
  getGridDimensions,
  rebuildSpatialGrid,
  shouldRenderBackgroundParticles,
  type Particle,
  type ParticleQuality,
  type SpatialGrid,
} from '@/components/hero/background-particles/engine';

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

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;

    const activeConfig = getBackgroundParticleConfig(quality);
    
    const mouse = {
      x: -1000,
      y: -1000,
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
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const connectDist2 = activeConfig.connectDistance * activeConfig.connectDistance;
    const mouseRadius2 = mouse.radius * mouse.radius;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // ── Advance all particles ─────────────────────────────────────────────
      for (const p of particles) {
        advanceBackgroundParticle(p, width, height);
      }

      // ── Mouse-pull physics (separate from drawing) ────────────────────────
      if (activeConfig.useMousePull && mouse.x > -900) {
        for (const p of particles) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < mouseRadius2 && d2 > 0) {
            const distance = getDistance(dx, dy);
            const force = (mouse.radius - distance) / mouse.radius;
            p.x += (dx / distance) * force * 0.5;
            p.y += (dy / distance) * force * 0.5;
          }
        }
      }

      // ── Spatial-grid connections: O(n·k) → one path, one stroke() ───────
      if (activeConfig.useConnections) {
        rebuildSpatialGrid(spatialGrid, particles, gridCellSize);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.12)';
        ctx.lineWidth = 0.5;
        forEachConnectedPair(spatialGrid, particles, gridCellSize, connectDist2, (_i, _j, pi, pj) => {
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
        });
        ctx.stroke();
      }

      // ── Batch mouse-pull lines — one path, one stroke() ──────────────────
      if (activeConfig.useMousePull && mouse.x > -900) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.55)';
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
      const OPACITY_TIERS = [
        { threshold: 0.3,      style: 'rgba(168, 85, 247, 0.2)'  },
        { threshold: 0.45,     style: 'rgba(168, 85, 247, 0.38)' },
        { threshold: Infinity, style: 'rgba(168, 85, 247, 0.55)' },
      ] as const;
      let prevThreshold = 0;
      for (const tier of OPACITY_TIERS) {
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

    window.addEventListener('resize', resize, { passive: true });

    if (activeConfig.useMousePull) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseout', handleMouseLeave, { passive: true });
    }

    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);

      if (activeConfig.useMousePull) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseout', handleMouseLeave);
      }

      cancelAnimationFrame(animationFrameId);
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
