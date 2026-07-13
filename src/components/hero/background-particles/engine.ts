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

// ── Mouse-pull physics (pure — the component only draws) ────────────────────

export const MOUSE_PULL_STRENGTH = 0.5;
/** Sentinel parked position while the pointer is off-screen. */
export const MOUSE_INACTIVE_POSITION = -1000;
/** The pointer counts as active once its x rises above this threshold. */
export const MOUSE_ACTIVE_THRESHOLD = -900;

/**
 * Pull every particle within mouseRadius toward the pointer, scaled linearly
 * by proximity. Mutates in place (same zero-allocation contract as
 * advanceBackgroundParticle). Squared-distance guard first — sqrt only runs
 * for particles actually inside the radius.
 */
export function applyMousePull(
  particles: Particle[],
  mouseX: number,
  mouseY: number,
  mouseRadius: number,
  strength = MOUSE_PULL_STRENGTH
): void {
  const mouseRadius2 = mouseRadius * mouseRadius;
  for (const p of particles) {
    const dx = mouseX - p.x;
    const dy = mouseY - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < mouseRadius2 && d2 > 0) {
      const distance = getDistance(dx, dy);
      const force = (mouseRadius - distance) / mouseRadius;
      p.x += (dx / distance) * force * strength;
      p.y += (dy / distance) * force * strength;
    }
  }
}

// ── Draw batching (data only — the component owns the canvas) ───────────────

export interface OpacityTier {
  threshold: number;
  style: string;
}

/**
 * Particles are drawn in three batches — one beginPath/fill per tier — instead
 * of one fill per particle. Tier thresholds partition the 0.1–0.6 opacity
 * range that advanceBackgroundParticle oscillates within.
 */
export const BACKGROUND_OPACITY_TIERS: readonly OpacityTier[] = [
  { threshold: 0.3, style: 'rgba(129, 140, 248, 0.2)' },
  { threshold: 0.45, style: 'rgba(129, 140, 248, 0.38)' },
  { threshold: Infinity, style: 'rgba(129, 140, 248, 0.55)' },
];

// ── Spatial grid (typed-array backed, zero GC per frame) ────────────────────

export interface SpatialGrid {
  /** Flat particle-index store: data[cell * maxPerCell + slot] = particle index */
  data: Int16Array;
  /** Occupied slot count per cell */
  count: Uint8Array;
  cols: number;
  rows: number;
  maxPerCell: number;
}

/** Compute grid dimensions so each cell covers connectDistance × connectDistance. */
export function getGridDimensions(
  width: number,
  height: number,
  cellSize: number,
): { cols: number; rows: number } {
  return {
    cols: Math.ceil(width / cellSize) + 1,
    rows: Math.ceil(height / cellSize) + 1,
  };
}

/** Allocate a spatial grid. Call once per viewport change; reuse every frame. */
export function createSpatialGrid(
  cols: number,
  rows: number,
  maxPerCell = 32,
): SpatialGrid {
  return {
    data: new Int16Array(cols * rows * maxPerCell),
    count: new Uint8Array(cols * rows),
    cols,
    rows,
    maxPerCell,
  };
}

/**
 * Clear and repopulate the grid in O(n).
 * Particles outside [0, width) × [0, height) are clamped to boundary cells.
 * If a cell exceeds maxPerCell, the extra particle is silently skipped —
 * acceptable for a visual effect where rare clustered edge cases lose one line.
 */
export function rebuildSpatialGrid(
  sg: SpatialGrid,
  particles: Particle[],
  cellSize: number,
): void {
  sg.count.fill(0);
  for (let i = 0; i < particles.length; i++) {
    const col = Math.min(Math.max(0, Math.floor(particles[i].x / cellSize)), sg.cols - 1);
    const row = Math.min(Math.max(0, Math.floor(particles[i].y / cellSize)), sg.rows - 1);
    const cell = row * sg.cols + col;
    if (sg.count[cell] < sg.maxPerCell) {
      sg.data[cell * sg.maxPerCell + sg.count[cell]] = i;
      sg.count[cell]++;
    }
  }
}

/**
 * Iterate unique connected pairs using the spatial grid in O(n·k).
 * k ≈ average particles in a 3 × 3 cell neighbourhood (~12 on typical viewports).
 * Each pair (i, j) where i < j and distance² < connectDist2 is emitted once.
 */
export function forEachConnectedPair(
  sg: SpatialGrid,
  particles: Particle[],
  cellSize: number,
  connectDist2: number,
  callback: (i: number, j: number, pi: Particle, pj: Particle) => void,
): void {
  const { cols, rows, data, count, maxPerCell } = sg;
  for (let i = 0; i < particles.length; i++) {
    const pi = particles[i];
    const pc = Math.min(Math.max(0, Math.floor(pi.x / cellSize)), cols - 1);
    const pr = Math.min(Math.max(0, Math.floor(pi.y / cellSize)), rows - 1);
    for (let dr = -1; dr <= 1; dr++) {
      const nr = pr + dr;
      if (nr < 0 || nr >= rows) continue;
      for (let dc = -1; dc <= 1; dc++) {
        const nc = pc + dc;
        if (nc < 0 || nc >= cols) continue;
        const cellBase = (nr * cols + nc) * maxPerCell;
        const n = count[nr * cols + nc];
        for (let k = 0; k < n; k++) {
          const j = data[cellBase + k];
          if (j <= i) continue;
          const pj = particles[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          if (dx * dx + dy * dy < connectDist2) {
            callback(i, j, pi, pj);
          }
        }
      }
    }
  }
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
