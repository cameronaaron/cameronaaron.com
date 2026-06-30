'use client';

import { useEffect, useRef } from 'react';
import {
  advanceBackgroundParticle,
  createBackgroundParticles,
  getBackgroundParticleConfig,
  getDistance,
  shouldRenderBackgroundParticles,
  type Particle,
  type ParticleQuality,
} from '@/components/hero/background-particles/engine';

interface BackgroundParticlesProps {
  quality?: ParticleQuality;
}

export default function BackgroundParticles({ quality = 'full' }: BackgroundParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!shouldRenderBackgroundParticles(quality)) return;

    const canvas = canvasRef.current;
    /* istanbul ignore next */
    if (!canvas) return;

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

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    const initParticles = () => {
      particles = createBackgroundParticles(width, height, activeConfig);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, i) => {
        // Update particle position, opacity and wrapping.
        advanceBackgroundParticle(p, width, height);

        // Mouse interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = getDistance(dx, dy);

        if (activeConfig.useMousePull && distance < mouse.radius) {
          // Draw line to mouse
          ctx.beginPath();
          ctx.strokeStyle = `rgba(147, 51, 234, ${1 - distance / mouse.radius})`;
          ctx.lineWidth = 1;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
          
          // Slight attraction
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          const directionX = forceDirectionX * force * 0.5;
          const directionY = forceDirectionY * force * 0.5;
          
          p.x += directionX;
          p.y += directionY;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.opacity})`; // Purple-500
        ctx.fill();
        
        // Connect nearby particles
        /* istanbul ignore else */
        if (activeConfig.useConnections) {
          for (let j = i; j < particles.length; j++) {
            const p2 = particles[j];
            const dx2 = p.x - p2.x;
            const dy2 = p.y - p2.y;
            const distance2 = getDistance(dx2, dy2);
            
            if (distance2 < activeConfig.connectDistance) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(147, 51, 234, ${0.2 * (1 - distance2 / activeConfig.connectDistance)})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize, { passive: true });

    /* istanbul ignore else */
    if (activeConfig.useMousePull) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseout', handleMouseLeave, { passive: true });
    }

    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);

      /* istanbul ignore else */
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
