'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  opacity: number;
}

const colors = [
  'rgba(168, 85, 247, 0.6)', // purple
  'rgba(236, 72, 153, 0.6)', // pink
  'rgba(59, 130, 246, 0.6)', // blue
  'rgba(167, 243, 208, 0.6)', // cyan
];

function createSeededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createInitialParticles(count = 30, seed = 1337): Particle[] {
  const random = createSeededRandom(seed);

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: random() * 100,
    y: random() * 100,
    size: random() * 4 + 2,
    color: colors[Math.floor(random() * colors.length)],
    velocity: {
      x: (random() - 0.5) * 0.2,
      y: (random() - 0.5) * 0.2,
    },
    opacity: random() * 0.5 + 0.3,
  }));
}

export default function InteractiveParticles() {
  const [particles, setParticles] = useState<Particle[]>(() => createInitialParticles());

  useEffect(() => {
    // Animation loop
    const animate = () => {
      setParticles((prev) =>
        prev.map((particle) => {
          let newX = particle.x + particle.velocity.x;
          let newY = particle.y + particle.velocity.y;
          let newVelocityX = particle.velocity.x;
          let newVelocityY = particle.velocity.y;

          // Bounce off edges
          if (newX < 0 || newX > 100) {
            newVelocityX *= -1;
            newX = Math.max(0, Math.min(100, newX));
          }
          if (newY < 0 || newY > 100) {
            newVelocityY *= -1;
            newY = Math.max(0, Math.min(100, newY));
          }

          return {
            ...particle,
            x: newX,
            y: newY,
            velocity: {
              x: newVelocityX,
              y: newVelocityY,
            },
          };
        })
      );
    };

    const interval = setInterval(animate, 50);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
