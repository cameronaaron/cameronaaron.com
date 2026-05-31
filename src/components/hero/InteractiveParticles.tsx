'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

type ParticleQuality = 'full' | 'balanced' | 'lite' | 'reduced';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  opacity: number;
  phase: number;
}

interface Connection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

interface InteractiveParticlesProps {
  quality?: ParticleQuality;
}

const colors = [
  'rgba(34, 211, 238, 0.65)',
  'rgba(45, 212, 191, 0.6)',
  'rgba(16, 185, 129, 0.55)',
  'rgba(103, 232, 249, 0.6)',
];

function createSeededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createInitialParticles(count = 42, seed = 1337): Particle[] {
  const random = createSeededRandom(seed);

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: random() * 100,
    y: random() * 100,
    size: random() * 3.2 + 1.8,
    color: colors[Math.floor(random() * colors.length)],
    velocity: {
      x: (random() - 0.5) * 0.08,
      y: (random() - 0.5) * 0.08,
    },
    opacity: random() * 0.45 + 0.25,
    phase: random() * Math.PI * 2,
  }));
}

export default function InteractiveParticles({ quality = 'full' }: InteractiveParticlesProps) {
  const prefersReducedMotion = useReducedMotion();

  const qualityConfig = useMemo(() => {
    if (quality === 'balanced') {
      return { count: 24, maxConnections: 32, connectionDistance: 12 };
    }

    if (quality === 'full') {
      return { count: 42, maxConnections: 80, connectionDistance: 15 };
    }

    return { count: 0, maxConnections: 0, connectionDistance: 0 };
  }, [quality]);

  const [particles, setParticles] = useState<Particle[]>(() =>
    quality === 'full' || quality === 'balanced'
      ? createInitialParticles(qualityConfig.count, quality === 'balanced' ? 2024 : 1337)
      : []
  );
  const [connections, setConnections] = useState<Connection[]>([]);
  const [bursts, setBursts] = useState<BurstParticle[]>([]);

  const mouseRef = useRef({ x: 50, y: 50, active: false });
  const burstIdRef = useRef(0);
  const frameRef = useRef(0);
  const lastTickRef = useRef(0);

  const makeConnections = useMemo(() => {
    return (nextParticles: Particle[]) => {
      const lines: Connection[] = [];

      for (let i = 0; i < nextParticles.length; i++) {
        for (let j = i + 1; j < nextParticles.length; j++) {
          const a = nextParticles[i];
          const b = nextParticles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < qualityConfig.connectionDistance) {
            lines.push({
              id: `${a.id}-${b.id}`,
              x1: a.x,
              y1: a.y,
              x2: b.x,
              y2: b.y,
              opacity: 0.28 * (1 - distance / qualityConfig.connectionDistance),
            });
          }
        }
      }

      return lines.slice(0, qualityConfig.maxConnections);
    };
  }, [qualityConfig.connectionDistance, qualityConfig.maxConnections]);

  useEffect(() => {
    if (prefersReducedMotion || quality === 'reduced' || quality === 'lite') return;

    const handlePointerMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;

      mouseRef.current = { x, y, active: true };
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    const handlePointerDown = (event: MouseEvent) => {
      const baseX = (event.clientX / window.innerWidth) * 100;
      const baseY = (event.clientY / window.innerHeight) * 100;

      const burstCount = quality === 'full' ? 14 : 8;

      const nextBursts: BurstParticle[] = Array.from({ length: burstCount }, (_, i) => {
        const angle = (Math.PI * 2 * i) / burstCount + Math.random() * 0.45;
        const speed = 0.55 + Math.random() * 0.85;

        return {
          id: burstIdRef.current++,
          x: baseX,
          y: baseY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 2.2 + Math.random() * 2.1,
          color: colors[Math.floor(Math.random() * colors.length)],
        };
      });

      setBursts((prev) => [...prev, ...nextBursts].slice(quality === 'full' ? -60 : -28));
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
        const next = prev.map((particle) => {
          const phase = particle.phase + 0.025 * step;

          let velocityX = particle.velocity.x + Math.sin(phase) * 0.0023;
          let velocityY = particle.velocity.y + Math.cos(phase * 0.86) * 0.002;
          let nextX = particle.x + velocityX * step;
          let nextY = particle.y + velocityY * step;

          if (mouseRef.current.active) {
            const dx = mouseRef.current.x - nextX;
            const dy = mouseRef.current.y - nextY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 22 && distance > 0.001) {
              const pull = (22 - distance) / 22;
              const attractionStrength = quality === 'full' ? 0.012 : 0.008;
              velocityX += (dx / distance) * pull * attractionStrength * step;
              velocityY += (dy / distance) * pull * attractionStrength * step;
              nextX += velocityX;
              nextY += velocityY;
            }
          }

          if (nextX < 0 || nextX > 100) {
            velocityX *= -0.98;
            nextX = Math.max(0, Math.min(100, nextX));
          }

          if (nextY < 0 || nextY > 100) {
            velocityY *= -0.98;
            nextY = Math.max(0, Math.min(100, nextY));
          }

          return {
            ...particle,
            x: nextX,
            y: nextY,
            phase,
            velocity: {
              x: velocityX * 0.998,
              y: velocityY * 0.998,
            },
          };
        });

        setConnections(makeConnections(next));
        return next;
      });

      setBursts((prev) =>
        prev
          .map((burst) => ({
            ...burst,
            x: burst.x + burst.vx * step,
            y: burst.y + burst.vy * step,
            vx: burst.vx * 0.985,
            vy: burst.vy * 0.985,
            life: burst.life - 0.03 * step,
          }))
          .filter((burst) => burst.life > 0)
      );

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
  }, [makeConnections, prefersReducedMotion, quality]);

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
