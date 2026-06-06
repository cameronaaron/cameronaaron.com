export type ParticleQuality = 'full' | 'balanced' | 'lite' | 'reduced';

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  opacity: number;
  phase: number;
}

export interface Connection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

export interface BurstParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

export interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

export interface ParticleQualityConfig {
  count: number;
  maxConnections: number;
  connectionDistance: number;
  burstCount: number;
  maxBursts: number;
}

export const PARTICLE_COLORS = [
  'rgba(34, 211, 238, 0.65)',
  'rgba(45, 212, 191, 0.6)',
  'rgba(16, 185, 129, 0.55)',
  'rgba(103, 232, 249, 0.6)',
];

export function getQualityConfig(quality: ParticleQuality): ParticleQualityConfig {
  if (quality === 'balanced') {
    return {
      count: 24,
      maxConnections: 32,
      connectionDistance: 12,
      burstCount: 8,
      maxBursts: 28,
    };
  }

  if (quality === 'full') {
    return {
      count: 42,
      maxConnections: 80,
      connectionDistance: 15,
      burstCount: 14,
      maxBursts: 60,
    };
  }

  return {
    count: 0,
    maxConnections: 0,
    connectionDistance: 0,
    burstCount: 0,
    maxBursts: 0,
  };
}

export function createSeededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function createInitialParticles(count = 42, seed = 1337): Particle[] {
  const random = createSeededRandom(seed);

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: random() * 100,
    y: random() * 100,
    size: random() * 3.2 + 1.8,
    color: PARTICLE_COLORS[Math.floor(random() * PARTICLE_COLORS.length)],
    velocity: {
      x: (random() - 0.5) * 0.08,
      y: (random() - 0.5) * 0.08,
    },
    opacity: random() * 0.45 + 0.25,
    phase: random() * Math.PI * 2,
  }));
}

export function buildConnections(
  particles: Particle[],
  connectionDistance: number,
  maxConnections: number
): Connection[] {
  const lines: Connection[] = [];

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < connectionDistance) {
        lines.push({
          id: `${a.id}-${b.id}`,
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          opacity: 0.28 * (1 - distance / connectionDistance),
        });
      }
    }
  }

  return lines.slice(0, maxConnections);
}

export function normalizePointerToPercent(
  clientX: number,
  clientY: number,
  width: number,
  height: number
): { x: number; y: number } {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  return {
    x: (clientX / safeWidth) * 100,
    y: (clientY / safeHeight) * 100,
  };
}

export function createBurstParticles(args: {
  baseX: number;
  baseY: number;
  count: number;
  startId: number;
  random?: () => number;
}): BurstParticle[] {
  const random = args.random ?? Math.random;

  return Array.from({ length: args.count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / args.count + random() * 0.45;
    const speed = 0.55 + random() * 0.85;

    return {
      id: args.startId + i,
      x: args.baseX,
      y: args.baseY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 2.2 + random() * 2.1,
      color: PARTICLE_COLORS[Math.floor(random() * PARTICLE_COLORS.length)],
    };
  });
}

export function stepParticles(
  particles: Particle[],
  step: number,
  pointer: PointerState,
  quality: ParticleQuality
): Particle[] {
  return particles.map((particle) => {
    const phase = particle.phase + 0.025 * step;

    let velocityX = particle.velocity.x + Math.sin(phase) * 0.0023;
    let velocityY = particle.velocity.y + Math.cos(phase * 0.86) * 0.002;
    let nextX = particle.x + velocityX * step;
    let nextY = particle.y + velocityY * step;

    if (pointer.active) {
      const dx = pointer.x - nextX;
      const dy = pointer.y - nextY;
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
}

export function stepBursts(bursts: BurstParticle[], step: number): BurstParticle[] {
  return bursts
    .map((burst) => ({
      ...burst,
      x: burst.x + burst.vx * step,
      y: burst.y + burst.vy * step,
      vx: burst.vx * 0.985,
      vy: burst.vy * 0.985,
      life: burst.life - 0.03 * step,
    }))
    .filter((burst) => burst.life > 0);
}
