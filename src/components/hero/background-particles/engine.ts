export type ParticleQuality = 'full' | 'balanced' | 'lite' | 'reduced';

export interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeSpeed: number;
  originalX: number;
  originalY: number;
}

export interface BackgroundParticleConfig {
  denominator: number;
  maxParticles: number;
  connectDistance: number;
  mouseRadius: number;
  useConnections: boolean;
  useMousePull: boolean;
}

const QUALITY_CONFIG: Record<ParticleQuality, BackgroundParticleConfig> = {
  full: { denominator: 10000, maxParticles: 150, connectDistance: 100, mouseRadius: 150, useConnections: true, useMousePull: true },
  balanced: { denominator: 17000, maxParticles: 95, connectDistance: 85, mouseRadius: 120, useConnections: true, useMousePull: true },
  lite: { denominator: 32000, maxParticles: 45, connectDistance: 0, mouseRadius: 0, useConnections: false, useMousePull: false },
  reduced: { denominator: 100000, maxParticles: 0, connectDistance: 0, mouseRadius: 0, useConnections: false, useMousePull: false },
};

export function shouldRenderBackgroundParticles(quality: ParticleQuality): boolean {
  return quality !== 'reduced' && quality !== 'lite';
}

export function getBackgroundParticleConfig(quality: ParticleQuality): BackgroundParticleConfig {
  return QUALITY_CONFIG[quality];
}

export function getBackgroundParticleCount(width: number, height: number, config: BackgroundParticleConfig): number {
  return Math.min(Math.floor((width * height) / config.denominator), config.maxParticles);
}

export function createBackgroundParticle(width: number, height: number, random: () => number = Math.random): Particle {
  return {
    x: random() * width,
    y: random() * height,
    originalX: random() * width,
    originalY: random() * height,
    size: random() * 2 + 1,
    speedX: (random() - 0.5) * 0.5,
    speedY: (random() - 0.5) * 0.5,
    opacity: random() * 0.5 + 0.2,
    fadeSpeed: (random() - 0.5) * 0.01,
  };
}

export function createBackgroundParticles(
  width: number,
  height: number,
  config: BackgroundParticleConfig,
  random: () => number = Math.random
): Particle[] {
  const particleCount = getBackgroundParticleCount(width, height, config);
  return Array.from({ length: particleCount }, () => createBackgroundParticle(width, height, random));
}

export function getDistance(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

export function advanceBackgroundParticle(particle: Particle, width: number, height: number): void {
  particle.x += particle.speedX;
  particle.y += particle.speedY;
  particle.opacity += particle.fadeSpeed;

  if (particle.opacity <= 0.1 || particle.opacity >= 0.6) {
    particle.fadeSpeed = -particle.fadeSpeed;
  }

  if (particle.x < 0) particle.x = width;
  if (particle.x > width) particle.x = 0;
  if (particle.y < 0) particle.y = height;
  if (particle.y > height) particle.y = 0;
}
