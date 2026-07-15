'use client';

import { useEffect, useMemo, useRef } from 'react';

import type { PerformanceTier } from '@/hooks/usePerformanceProfile';
import {
  SKILL_NODE_RADIUS,
  buildSkillGraph,
  createSkillLayout,
  skillLayoutAtRest,
  stepSkillLayout,
  type SkillLayout,
} from '@/components/skills/skill-web-logic';

interface SkillWebProps {
  nodes: string[];
  performanceTier?: PerformanceTier;
  className?: string;
}

/**
 * Ambient force-directed web behind the Skills section. Nodes are the skill
 * labels; edges (see skill-web-logic) link labels sharing a significant word,
 * so the graph clusters by theme. The layout is a spring simulation stepped in
 * place on reused typed arrays — it drifts into shape when the section scrolls
 * in, repels from the cursor, and the rAF loop SLEEPS once it settles and the
 * pointer leaves. Full tier only; other tiers render nothing (decorative).
 */
export default function SkillWeb({ nodes, performanceTier = 'full', className = '' }: SkillWebProps) {
  const interactive = performanceTier === 'full';
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graph = useMemo(() => buildSkillGraph(nodes), [nodes]);

  useEffect(() => {
    if (!interactive) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!container || !canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let layout: SkillLayout = createSkillLayout(graph.count, 0, 0);
    let frameId = 0;

    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;

    const draw = () => {
      const { x, y, count } = layout;
      ctx.clearRect(0, 0, width, height);

      // All edges in one stroke (batch by paint state, §2.7).
      ctx.strokeStyle = 'rgba(126, 231, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [a, b] of graph.edges) {
        ctx.moveTo(x[a], y[a]);
        ctx.lineTo(x[b], y[b]);
      }
      ctx.stroke();

      // All nodes in one fill.
      ctx.fillStyle = 'rgba(56, 214, 255, 0.7)';
      ctx.beginPath();
      for (let i = 0; i < count; i += 1) {
        ctx.moveTo(x[i] + SKILL_NODE_RADIUS, y[i]);
        ctx.arc(x[i], y[i], SKILL_NODE_RADIUS, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    const animate = () => {
      stepSkillLayout(graph, layout, { width, height }, { x: pointerX, y: pointerY, active: pointerActive });
      draw();
      if (!pointerActive && skillLayoutAtRest(layout)) {
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
      layout = createSkillLayout(graph.count, width, height);
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
  }, [interactive, graph]);

  if (!interactive) return null;

  return (
    <div ref={containerRef} aria-hidden="true" className={`pointer-events-none ${className}`}>
      <canvas ref={canvasRef} data-testid="skill-web-canvas" className="absolute inset-0 h-full w-full" />
    </div>
  );
}
