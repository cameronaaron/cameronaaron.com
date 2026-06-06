'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type BurstParticle,
  type Connection,
  type Particle,
  type ParticleQuality,
  type PointerState,
  buildConnections,
  createBurstParticles,
  createInitialParticles,
  getQualityConfig,
  normalizePointerToPercent,
  stepBursts,
  stepParticles,
} from './interactive-particles/engine';

interface InteractiveParticlesProps {
  quality?: ParticleQuality;
}

export default function InteractiveParticles({ quality = 'full' }: InteractiveParticlesProps) {
  const prefersReducedMotion = useReducedMotion();

  const qualityConfig = useMemo(() => getQualityConfig(quality), [quality]);
  const { burstCount, maxBursts } = qualityConfig;

  const [particles, setParticles] = useState<Particle[]>(() =>
    quality === 'full' || quality === 'balanced'
      ? createInitialParticles(qualityConfig.count, quality === 'balanced' ? 2024 : 1337)
      : []
  );
  const [connections, setConnections] = useState<Connection[]>([]);
  const [bursts, setBursts] = useState<BurstParticle[]>([]);

  const mouseRef = useRef<PointerState>({ x: 50, y: 50, active: false });
  const burstIdRef = useRef(0);
  const frameRef = useRef(0);
  const lastTickRef = useRef(0);

  const makeConnections = useMemo(() => {
    return (nextParticles: Particle[]) =>
      buildConnections(nextParticles, qualityConfig.connectionDistance, qualityConfig.maxConnections);
  }, [qualityConfig.connectionDistance, qualityConfig.maxConnections]);

  useEffect(() => {
    if (prefersReducedMotion || quality === 'reduced' || quality === 'lite') return;

    const handlePointerMove = (event: MouseEvent) => {
      const { x, y } = normalizePointerToPercent(
        event.clientX,
        event.clientY,
        window.innerWidth,
        window.innerHeight
      );

      mouseRef.current = { x, y, active: true };
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    const handlePointerDown = (event: MouseEvent) => {
      const { x: baseX, y: baseY } = normalizePointerToPercent(
        event.clientX,
        event.clientY,
        window.innerWidth,
        window.innerHeight
      );

      const nextBursts = createBurstParticles({
        baseX,
        baseY,
        count: burstCount,
        startId: burstIdRef.current,
      });

      burstIdRef.current += nextBursts.length;
      setBursts((prev) => [...prev, ...nextBursts].slice(-maxBursts));
    };

    const animate = (time: number) => {
      if (!lastTickRef.current) {
        lastTickRef.current = time;
      }

      const delta = Math.min(34, time - lastTickRef.current);
      if (delta < 16) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      lastTickRef.current = time;
      const step = delta / 16;

      setParticles((prev) => {
        const next = stepParticles(prev, step, mouseRef.current, quality);

        setConnections(makeConnections(next));
        return next;
      });

      setBursts((prev) => stepBursts(prev, step));

      frameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseout', handlePointerLeave);
    window.addEventListener('mousedown', handlePointerDown);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseout', handlePointerLeave);
      window.removeEventListener('mousedown', handlePointerDown);
      cancelAnimationFrame(frameRef.current);
    };
  }, [burstCount, makeConnections, maxBursts, prefersReducedMotion, quality]);

  if (quality === 'reduced' || quality === 'lite') {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {connections.map((line) => (
        <div
          key={line.id}
          className="absolute origin-left"
          style={{
            left: `${line.x1}%`,
            top: `${line.y1}%`,
            width: `${Math.sqrt((line.x2 - line.x1) ** 2 + (line.y2 - line.y1) ** 2)}%`,
            transform: `rotate(${Math.atan2(line.y2 - line.y1, line.x2 - line.x1)}rad)`,
            height: '1px',
            background: `linear-gradient(90deg, rgba(103,232,249,${line.opacity}), rgba(16,185,129,${line.opacity * 0.7}))`,
          }}
        />
      ))}

      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
          }}
          animate={{
            scale: [1, 1.35, 1],
            opacity: [particle.opacity, particle.opacity * 1.4, particle.opacity],
          }}
          transition={{
            duration: 2.6 + (particle.id % 5) * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute rounded-full"
          style={{
            left: `${burst.x}%`,
            top: `${burst.y}%`,
            width: burst.size,
            height: burst.size,
            opacity: burst.life,
            backgroundColor: burst.color,
            boxShadow: `0 0 ${burst.size * 5}px ${burst.color}`,
          }}
        />
      ))}

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
