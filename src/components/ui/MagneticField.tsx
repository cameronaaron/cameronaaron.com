'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import {
  MAGNETIC_RADIUS,
  MAGNETIC_RING_RADIUS,
  buildQuadtree,
  quadQueryNearest,
  type QuadNode,
  type QuadPoint,
} from '@/components/ui/magnetic-field-logic';

interface MagneticFieldProps {
  children: ReactNode;
  /** CSS selector for the magnetisable descendants. */
  targetSelector?: string;
  className?: string;
}

/**
 * Wraps a cluster of interactive elements and draws a "magnetic thread" from the
 * cursor to the nearest one. The nearest-element lookup is a quadtree query
 * (see magnetic-field-logic) — O(log n) per pointer move — over a tree rebuilt
 * only when the layout changes, so the per-move cost is the query plus one
 * rAF-coalesced canvas draw. The overlay is its own canvas and never mutates the
 * wrapped children. Full tier only; other tiers render the children untouched.
 */
export default function MagneticField({
  children,
  targetSelector = '[data-magnetic]',
  className = '',
}: MagneticFieldProps) {
  const { performanceTier } = usePerformanceProfile();
  const interactive = performanceTier === 'full';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!interactive) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!wrapper || !canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let tree: QuadNode | null = null;
    let frameId = 0;

    // Pointer state written by the event, read once per scheduled frame.
    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (!pointerActive || !tree) return;
      const nearest = quadQueryNearest(tree, pointerX, pointerY, MAGNETIC_RADIUS);
      if (!nearest) return;

      const gradient = ctx.createLinearGradient(pointerX, pointerY, nearest.x, nearest.y);
      gradient.addColorStop(0, 'rgba(56, 214, 255, 0)');
      gradient.addColorStop(1, 'rgba(56, 214, 255, 0.55)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pointerX, pointerY);
      ctx.lineTo(nearest.x, nearest.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(126, 231, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nearest.x, nearest.y, MAGNETIC_RING_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    };

    // One layout read → one draw per frame (§3.2); a burst of moves coalesces.
    const scheduleDraw = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        draw();
      });
    };

    const rebuild = () => {
      const rect = wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const elements = wrapper.querySelectorAll(targetSelector);
      const targets: QuadPoint[] = [];
      for (let i = 0; i < elements.length; i += 1) {
        const box = elements[i].getBoundingClientRect();
        targets.push({
          x: box.left - rect.left + box.width / 2,
          y: box.top - rect.top + box.height / 2,
          index: i,
        });
      }
      tree = buildQuadtree(targets, width, height);
      scheduleDraw();
    };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      pointerActive = localX >= 0 && localX <= width && localY >= 0 && localY <= height;
      pointerX = localX;
      pointerY = localY;
      scheduleDraw();
    };

    rebuild();
    window.addEventListener('resize', rebuild, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('resize', rebuild);
      window.removeEventListener('mousemove', handlePointerMove);
      cancelAnimationFrame(frameId);
    };
  }, [interactive, targetSelector]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {children}
      {interactive ? (
        <canvas
          ref={canvasRef}
          data-testid="magnetic-canvas"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      ) : null}
    </div>
  );
}
