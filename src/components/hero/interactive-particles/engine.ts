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
  id: number;
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

export const POINTER_ATTRACT_RADIUS = 22;
export const POINTER_ATTRACT_RADIUS_SQ = POINTER_ATTRACT_RADIUS * POINTER_ATTRACT_RADIUS;
export const ATTRACTION_STRENGTH_FULL = 0.012;
export const ATTRACTION_STRENGTH_BALANCED = 0.008;

export const PARTICLE_COLORS = [
  'rgba(56, 214, 255, 0.65)',
  'rgba(92, 240, 205, 0.6)',
  'rgba(16, 212, 146, 0.55)',
  'rgba(126, 231, 255, 0.6)',
];

const ZERO_QUALITY_CONFIG: ParticleQualityConfig = {
  count: 0,
  maxConnections: 0,
  connectionDistance: 0,
  burstCount: 0,
  maxBursts: 0,
};

const QUALITY_CONFIG: Record<ParticleQuality, ParticleQualityConfig> = {
  full: { count: 42, maxConnections: 80, connectionDistance: 15, burstCount: 14, maxBursts: 60 },
  balanced: { count: 24, maxConnections: 32, connectionDistance: 12, burstCount: 8, maxBursts: 28 },
  lite: ZERO_QUALITY_CONFIG,
  reduced: ZERO_QUALITY_CONFIG,
};

export function getQualityConfig(quality: ParticleQuality): ParticleQualityConfig {
  return QUALITY_CONFIG[quality];
}

/** Connection lines are batched into one canvas stroke per opacity tier. */
export const CONNECTION_MAX_OPACITY = 0.28;
export const CONNECTION_OPACITY_TIERS = [0.08, 0.17, 0.26] as const;

/** One precomputed strokeStyle per opacity tier — no per-frame string building. */
export const CONNECTION_TIER_STYLES: readonly string[] = CONNECTION_OPACITY_TIERS.map(
  (opacity) => `rgba(126, 231, 255, ${opacity})`
);

/** Map a connection opacity (0 … CONNECTION_MAX_OPACITY) to a tier index. */
export function getConnectionOpacityTier(opacity: number): number {
  const tierCount = CONNECTION_OPACITY_TIERS.length;
  const tier = Math.floor((opacity / CONNECTION_MAX_OPACITY) * tierCount);
  return Math.min(tierCount - 1, Math.max(0, tier));
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
  maxConnections: number,
  out?: Connection[]
): Connection[] {
  // Pool contract: a caller-owned `out` array is overwritten in place — object
  // slots are reused across frames, so a steady-state frame allocates nothing.
  // Callers without a pool (tests, one-shot use) get a fresh array.
  const lines = out ?? [];
  const connectDist2 = connectionDistance * connectionDistance;
  let count = 0;

  outer: for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      if (count >= maxConnections) break outer;
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < connectDist2) {
        const distance = Math.sqrt(dist2);
        const opacity = CONNECTION_MAX_OPACITY * (1 - distance / connectionDistance);
        const line = lines[count];
        if (line === undefined) {
          lines.push({ id: a.id * 1000 + b.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y, opacity });
        } else {
          line.id = a.id * 1000 + b.id;
          line.x1 = a.x;
          line.y1 = a.y;
          line.x2 = b.x;
          line.y2 = b.y;
          line.opacity = opacity;
        }
        count += 1;
      }
    }
  }

  lines.length = count;
  return lines;
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

/**
 * Append newly spawned bursts, keeping only the newest `maxBursts` overall.
 * In-place: older bursts slide left via copyWithin and the tail is truncated —
 * replaces the old per-click `concat(...).slice(-max)` double allocation.
 */
export function appendBursts(
  bursts: BurstParticle[],
  incoming: BurstParticle[],
  maxBursts: number
): BurstParticle[] {
  const skip = Math.max(0, incoming.length - maxBursts);
  const overflow = bursts.length + (incoming.length - skip) - maxBursts;
  if (overflow > 0) {
    bursts.copyWithin(0, overflow);
    bursts.length -= overflow;
  }
  for (let i = skip; i < incoming.length; i += 1) {
    bursts.push(incoming[i]);
  }
  return bursts;
}

export function stepParticles(
  particles: Particle[],
  step: number,
  pointer: PointerState,
  quality: ParticleQuality
): Particle[] {
  // Quality is invariant across the loop — resolve the strength once per frame.
  const attractionStrength = quality === 'full' ? ATTRACTION_STRENGTH_FULL : ATTRACTION_STRENGTH_BALANCED;

  // Mutates in place and returns the same array (same zero-allocation frame
  // contract as the background engine) — a steady-state frame allocates nothing.
  for (const particle of particles) {
    const phase = particle.phase + 0.025 * step;

    let velocityX = particle.velocity.x + Math.sin(phase) * 0.0023;
    let velocityY = particle.velocity.y + Math.cos(phase * 0.86) * 0.002;
    let nextX = particle.x + velocityX * step;
    let nextY = particle.y + velocityY * step;

    if (pointer.active) {
      const dx = pointer.x - nextX;
      const dy = pointer.y - nextY;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < POINTER_ATTRACT_RADIUS_SQ && dist2 > 0.000001) {
        const distance = Math.sqrt(dist2);
        const pull = (POINTER_ATTRACT_RADIUS - distance) / POINTER_ATTRACT_RADIUS;
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

    particle.x = nextX;
    particle.y = nextY;
    particle.phase = phase;
    particle.velocity.x = velocityX * 0.998;
    particle.velocity.y = velocityY * 0.998;
  }

  return particles;
}

// ── Canvas pulse + batching helpers (pure — the component only draws) ────────

/** Mirrors the old Framer keyframes: scale [1, 1.35, 1] over 2.6s + (id % 5) * 0.3s. */
export const PULSE_BASE_DURATION_MS = 2600;
export const PULSE_DURATION_STEP_MS = 300;
export const PULSE_DURATION_VARIANTS = 5;
export const PULSE_SCALE_AMPLITUDE = 0.35;
export const PULSE_OPACITY_AMPLITUDE = 0.4;

export interface ParticlePulse {
  scale: number;
  opacityMultiplier: number;
}

/**
 * Smooth 0 → 1 → 0 pulse derived from the frame timestamp. Staggering the
 * period by particle id keeps neighbours out of phase, matching the old
 * per-element Framer animation without any per-frame React work.
 *
 * Pass a caller-owned `out` scratch object to skip the per-call allocation —
 * the frame loop reuses one scratch across every particle every frame.
 */
export function getParticlePulse(timeMs: number, particleId: number, out?: ParticlePulse): ParticlePulse {
  const duration = PULSE_BASE_DURATION_MS + (particleId % PULSE_DURATION_VARIANTS) * PULSE_DURATION_STEP_MS;
  const wave = 0.5 - 0.5 * Math.cos((Math.PI * 2 * timeMs) / duration);
  const scale = 1 + PULSE_SCALE_AMPLITUDE * wave;
  const opacityMultiplier = 1 + PULSE_OPACITY_AMPLITUDE * wave;
  if (out !== undefined) {
    out.scale = scale;
    out.opacityMultiplier = opacityMultiplier;
    return out;
  }
  return { scale, opacityMultiplier };
}

/** Sprite canvas edge in px; the glow gradient fills the full sprite. */
export const GLOW_SPRITE_SIZE = 64;
/** Draw diameter multiplier so the sprite covers the old core + box-shadow glow. */
export const GLOW_DIAMETER_MULTIPLIER = 6;
/** Solid core out to 25% of the radius, then a soft falloff to transparent. */
export const GLOW_CORE_STOP = 0.25;

export interface GradientStop {
  offset: number;
  color: string;
}

/** Radial-gradient stop list for one pre-rendered glow sprite. */
export function getGlowGradientStops(color: string): GradientStop[] {
  return [
    { offset: 0, color },
    { offset: GLOW_CORE_STOP, color },
    { offset: 1, color: 'rgba(0, 0, 0, 0)' },
  ];
}

/** Convert a simulation coordinate (0–100 %) to a canvas pixel offset. */
export function percentToPx(percent: number, extent: number): number {
  return (percent / 100) * extent;
}

export function stepBursts(bursts: BurstParticle[], step: number): BurstParticle[] {
  // Single-pass in-place compaction: surviving bursts slide left over expired
  // ones and the tail is truncated — no per-frame array or object allocation.
  let write = 0;
  for (const burst of bursts) {
    const newLife = burst.life - 0.03 * step;
    if (newLife > 0) {
      burst.x += burst.vx * step;
      burst.y += burst.vy * step;
      burst.vx *= 0.985;
      burst.vy *= 0.985;
      burst.life = newLife;
      bursts[write] = burst;
      write += 1;
    }
  }
  bursts.length = write;
  return bursts;
}

// ── Cursor constellation: K-nearest particles via a bounded max-heap ─────────
//
// Each frame we want the K particles closest to the pointer, out of N. The
// optimal streaming structure for "K smallest from N" is a MAX-heap of capacity
// K keyed on (squared) distance: the root is the current worst of the kept set,
// so a new candidate is admitted in O(log K) only if it beats the root, and
// rejected in O(1) otherwise. Total O(N log K) per frame vs O(N log N) for a
// full sort or O(N·K) for insertion into a sorted window. Backed by two typed
// arrays reused every frame (§2.6 / §2.8): zero allocation in steady state.

/** How many nearby particles the pointer links to. */
export const KNN_LINK_COUNT = 6;
/** Link radius in simulation-percent units; only particles inside it qualify. */
export const KNN_LINK_RADIUS = 26;
export const KNN_LINK_RADIUS_SQ = KNN_LINK_RADIUS * KNN_LINK_RADIUS;
/** Precomputed stroke for the cursor links — one string, never built per frame. */
export const KNN_LINK_STYLE = 'rgba(126, 231, 255, 0.32)';

export interface KnnHeap {
  /** Squared distance to the pointer, max-ordered (worst kept at index 0). */
  dist2: Float32Array;
  /** Particle index parallel to dist2. */
  index: Int16Array;
  size: number;
  capacity: number;
}

export function createKnnHeap(capacity = KNN_LINK_COUNT): KnnHeap {
  return {
    dist2: new Float32Array(capacity),
    index: new Int16Array(capacity),
    size: 0,
    capacity,
  };
}

export function resetKnnHeap(heap: KnnHeap): void {
  heap.size = 0;
}

function swapHeap(heap: KnnHeap, a: number, b: number): void {
  const d = heap.dist2[a];
  heap.dist2[a] = heap.dist2[b];
  heap.dist2[b] = d;
  const i = heap.index[a];
  heap.index[a] = heap.index[b];
  heap.index[b] = i;
}

function siftUp(heap: KnnHeap, start: number): void {
  let child = start;
  while (child > 0) {
    const parent = (child - 1) >> 1;
    if (heap.dist2[parent] >= heap.dist2[child]) break;
    swapHeap(heap, parent, child);
    child = parent;
  }
}

function siftDown(heap: KnnHeap, start: number): void {
  const { size } = heap;
  let parent = start;
  for (;;) {
    const left = parent * 2 + 1;
    const right = left + 1;
    let largest = parent;
    if (left < size && heap.dist2[left] > heap.dist2[largest]) largest = left;
    if (right < size && heap.dist2[right] > heap.dist2[largest]) largest = right;
    if (largest === parent) break;
    swapHeap(heap, parent, largest);
    parent = largest;
  }
}

/**
 * Offer one candidate. Admits it when the heap has room, or when it is nearer
 * than the current worst (the root) — replacing the root and sifting down.
 * O(log K) admit, O(1) reject.
 */
export function knnOffer(heap: KnnHeap, dist2: number, index: number): void {
  if (heap.size < heap.capacity) {
    heap.dist2[heap.size] = dist2;
    heap.index[heap.size] = index;
    heap.size += 1;
    siftUp(heap, heap.size - 1);
    return;
  }
  if (dist2 < heap.dist2[0]) {
    heap.dist2[0] = dist2;
    heap.index[0] = index;
    siftDown(heap, 0);
  }
}

/**
 * Fill `heap` with the up-to-K particles nearest the pointer within
 * `radiusSq`. Single O(N) pass offering each in-range particle; the heap keeps
 * only the K smallest. Mutates the heap in place (zero allocation). The kept
 * particle indices are left in `heap.index[0 … heap.size)`, unordered.
 */
export function collectNearestParticles(
  particles: Particle[],
  pointerX: number,
  pointerY: number,
  radiusSq: number,
  heap: KnnHeap
): void {
  resetKnnHeap(heap);
  for (let i = 0; i < particles.length; i += 1) {
    const dx = particles[i].x - pointerX;
    const dy = particles[i].y - pointerY;
    const d2 = dx * dx + dy * dy;
    if (d2 < radiusSq) {
      knnOffer(heap, d2, i);
    }
  }
}
