'use client';

import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import {
  RIBBON_COLORS,
  createRibbonSet,
  ribbonSetAtRest,
  stepRibbon,
  type RibbonState,
} from '@/components/ui/ribbon-band-logic';

interface RibbonBandProps {
  className?: string;
}

/**
 * A contained, full-width band of silk ribbons the cursor can push through.
 * Each ribbon is a Verlet point-mass chain (see ribbon-band-logic) stepped in
 * place on reused typed arrays — the rAF loop SLEEPS the moment every ribbon
 * settles and the pointer leaves, so a still page costs zero frames. Interactive
 * physics runs on the full tier only; lower tiers render a static hairline so
 * the layout and aesthetic hold without a per-frame cost on mobile.
 */
export default function RibbonBand({ className = '' }: RibbonBandProps) {
  // Self-read the tier (RSC islands, 2026-07) so a Server Component page can
  // render this without passing a client-only value as a prop.
  const { performanceTier } = usePerformanceProfile();
  const interactive = performanceTier === 'full';
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Sits between Education and Projects, well below the fold — gate the
  // physics loop and its global resize/mousemove listeners on actually
  // being scrolled here rather than running from initial page load.
  const isInView = useInView(containerRef, { amount: 0.2 });

  useEffect(() => {
    if (!interactive || !isInView) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!container || !canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let ribbons: RibbonState[] = [];
    let frameId = 0;

    // Pointer state written by the event, read once per frame.
    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;
      for (let i = 0; i < ribbons.length; i += 1) {
        const ribbon = ribbons[i];
        ctx.strokeStyle = RIBBON_COLORS[i];
        ctx.beginPath();
        ctx.moveTo(ribbon.x[0], ribbon.y[0]);
        // Smooth the polyline into a curve through segment midpoints.
        for (let n = 1; n < ribbon.count - 1; n += 1) {
          const midX = (ribbon.x[n] + ribbon.x[n + 1]) / 2;
          const midY = (ribbon.y[n] + ribbon.y[n + 1]) / 2;
          ctx.quadraticCurveTo(ribbon.x[n], ribbon.y[n], midX, midY);
        }
        ctx.lineTo(ribbon.x[ribbon.count - 1], ribbon.y[ribbon.count - 1]);
        ctx.stroke();
      }
    };

    const animate = () => {
      const pointer = { x: pointerX, y: pointerY, active: pointerActive };
      for (const ribbon of ribbons) stepRibbon(ribbon, pointer);
      draw();
      // Park the loop once the cloth is still and the cursor has left.
      if (!pointerActive && ribbonSetAtRest(ribbons)) {
        frameId = 0;
        return;
      }
      frameId = requestAnimationFrame(animate);
    };

    const wake = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(animate);
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ribbons = createRibbonSet(width, height);
      wake();
    };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      pointerActive = localX >= 0 && localX <= width && localY >= 0 && localY <= height;
      pointerX = localX;
      pointerY = localY;
      if (pointerActive) wake();
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      cancelAnimationFrame(frameId);
    };
  }, [interactive, isInView]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-testid="ribbon-band"
      className={`pointer-events-none relative h-28 w-full overflow-hidden border-y border-white/5 bg-white/[0.012] md:h-36 ${className}`}
    >
      {interactive ? (
        <canvas ref={canvasRef} data-testid="ribbon-canvas" className="absolute inset-0 h-full w-full" />
      ) : (
        <div
          data-testid="ribbon-static"
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
        />
      )}
    </div>
  );
}
