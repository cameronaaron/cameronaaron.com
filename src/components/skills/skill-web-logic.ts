import { createSeededRandom } from '@/components/hero/interactive-particles/engine';

/**
 * Force-directed skill graph.
 *
 * The graph is an ADJACENCY LIST derived from the skill labels themselves: two
 * skills are linked when they share a significant word (so "Clinical Research"
 * and "Clinical & Cognitive Neuroscience" attract). Building it once with a
 * token→nodes Map is O(total tokens + edges); the render path never rebuilds
 * it. The layout is a spring simulation on reused Float32Arrays — edges pull,
 * every pair repels, a weak center gravity keeps it framed, and the cursor
 * shoves nearby nodes. Node counts here are small and bounded (a curated skills
 * list), so all-pairs repulsion is the optimal choice — a spatial index would
 * add structure with no win at this n. Distances are squared until a unit
 * vector is actually needed.
 */

/** Words too generic to imply a real relationship between two skills. */
export const SKILL_STOPWORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'care',
  'health',
]);

/** Minimum token length to count as a linking word. */
export const SKILL_TOKEN_MIN_LENGTH = 4;

export const SPRING_REST_LENGTH = 96;
export const SPRING_STRENGTH = 0.02;
export const REPULSION_STRENGTH = 1800;
export const CENTER_GRAVITY = 0.01;
export const LAYOUT_DAMPING = 0.86;
export const MAX_NODE_SPEED = 6;
export const MIN_DISTANCE_SQ = 0.01;

export const POINTER_REPEL_RADIUS = 140;
export const POINTER_REPEL_RADIUS_SQ = POINTER_REPEL_RADIUS * POINTER_REPEL_RADIUS;
export const POINTER_REPEL_STRENGTH = 6000;

/** Total kinetic energy below which the layout is considered settled. */
export const LAYOUT_REST_ENERGY = 0.05;

/** Rendered radius of each skill node (px). */
export const SKILL_NODE_RADIUS = 3.5;

export interface SkillGraph {
  count: number;
  labels: string[];
  edges: Array<[number, number]>;
  adjacency: number[][];
}

/** Significant, deduplicated linking words from one skill label. */
export function tokenizeSkill(label: string): string[] {
  const stripped = label.toLowerCase().replace(/\([^)]*\)/g, ' ');
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const raw of stripped.split(/[^a-z]+/)) {
    if (raw.length < SKILL_TOKEN_MIN_LENGTH) continue;
    if (SKILL_STOPWORDS.has(raw)) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);
    tokens.push(raw);
  }
  return tokens;
}

/**
 * Build the adjacency-list graph: group node indices by shared token, then link
 * every pair inside each group once (deduped with an integer edge key, never a
 * string). Isolated nodes still appear — they simply have no edges.
 */
export function buildSkillGraph(labels: string[]): SkillGraph {
  const count = labels.length;
  const adjacency: number[][] = Array.from({ length: count }, () => []);
  const edges: Array<[number, number]> = [];

  const tokenGroups = new Map<string, number[]>();
  for (let i = 0; i < count; i += 1) {
    for (const token of tokenizeSkill(labels[i])) {
      let group = tokenGroups.get(token);
      if (!group) {
        group = [];
        tokenGroups.set(token, group);
      }
      group.push(i);
    }
  }

  const linked = new Set<number>();
  for (const group of tokenGroups.values()) {
    for (let a = 0; a < group.length; a += 1) {
      for (let b = a + 1; b < group.length; b += 1) {
        const i = Math.min(group[a], group[b]);
        const j = Math.max(group[a], group[b]);
        const key = i * count + j;
        if (linked.has(key)) continue;
        linked.add(key);
        edges.push([i, j]);
        adjacency[i].push(j);
        adjacency[j].push(i);
      }
    }
  }

  return { count, labels, edges, adjacency };
}

export interface SkillLayout {
  count: number;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  /** Reused per-frame force accumulators — no allocation while stepping. */
  fx: Float32Array;
  fy: Float32Array;
}

/** Seed node positions across the area (deterministic for a given seed). */
export function createSkillLayout(count: number, width: number, height: number, seed = 1337): SkillLayout {
  const random = createSeededRandom(seed);
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    x[i] = random() * width;
    y[i] = random() * height;
  }
  return {
    count,
    x,
    y,
    vx: new Float32Array(count),
    vy: new Float32Array(count),
    fx: new Float32Array(count),
    fy: new Float32Array(count),
  };
}

/**
 * One simulation tick, mutating the layout buffers in place (zero allocation).
 * Forces accumulate into the reused fx/fy arrays, then integrate with damping
 * and a speed clamp; positions are kept inside the frame with min/max.
 */
export function stepSkillLayout(
  graph: SkillGraph,
  layout: SkillLayout,
  bounds: { width: number; height: number },
  pointer: { x: number; y: number; active: boolean }
): void {
  const { count, x, y, vx, vy, fx, fy } = layout;
  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2;

  for (let i = 0; i < count; i += 1) {
    fx[i] = (centerX - x[i]) * CENTER_GRAVITY;
    fy[i] = (centerY - y[i]) * CENTER_GRAVITY;
    if (pointer.active) {
      const pdx = x[i] - pointer.x;
      const pdy = y[i] - pointer.y;
      const pdSq = pdx * pdx + pdy * pdy;
      if (pdSq > 0 && pdSq < POINTER_REPEL_RADIUS_SQ) {
        const pd = Math.sqrt(pdSq);
        const force = POINTER_REPEL_STRENGTH / pdSq;
        fx[i] += (pdx / pd) * force;
        fy[i] += (pdy / pd) * force;
      }
    }
  }

  // All-pairs repulsion (i<j, applied symmetrically).
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      const dx = x[i] - x[j];
      const dy = y[i] - y[j];
      let distSq = dx * dx + dy * dy;
      if (distSq < MIN_DISTANCE_SQ) distSq = MIN_DISTANCE_SQ;
      const dist = Math.sqrt(distSq);
      const force = REPULSION_STRENGTH / distSq;
      const ux = (dx / dist) * force;
      const uy = (dy / dist) * force;
      fx[i] += ux;
      fy[i] += uy;
      fx[j] -= ux;
      fy[j] -= uy;
    }
  }

  // Spring attraction along edges.
  for (const [a, b] of graph.edges) {
    const dx = x[b] - x[a];
    const dy = y[b] - y[a];
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < MIN_DISTANCE_SQ) dist = MIN_DISTANCE_SQ;
    const pull = (dist - SPRING_REST_LENGTH) * SPRING_STRENGTH;
    const ux = (dx / dist) * pull;
    const uy = (dy / dist) * pull;
    fx[a] += ux;
    fy[a] += uy;
    fx[b] -= ux;
    fy[b] -= uy;
  }

  for (let i = 0; i < count; i += 1) {
    let nvx = (vx[i] + fx[i]) * LAYOUT_DAMPING;
    let nvy = (vy[i] + fy[i]) * LAYOUT_DAMPING;
    const speed = Math.hypot(nvx, nvy);
    if (speed > MAX_NODE_SPEED) {
      const scale = MAX_NODE_SPEED / speed;
      nvx *= scale;
      nvy *= scale;
    }
    vx[i] = nvx;
    vy[i] = nvy;
    x[i] = Math.max(0, Math.min(bounds.width, x[i] + nvx));
    y[i] = Math.max(0, Math.min(bounds.height, y[i] + nvy));
  }
}

/** Sum of squared node velocities — the loop parks when this reaches rest. */
export function skillLayoutEnergy(layout: SkillLayout): number {
  let energy = 0;
  for (let i = 0; i < layout.count; i += 1) {
    energy += layout.vx[i] * layout.vx[i] + layout.vy[i] * layout.vy[i];
  }
  return energy;
}

/** True once the web has settled — used to sleep the animation frame loop. */
export function skillLayoutAtRest(layout: SkillLayout): boolean {
  return skillLayoutEnergy(layout) <= LAYOUT_REST_ENERGY;
}
