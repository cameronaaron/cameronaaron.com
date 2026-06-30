/**
 * Algorithm & Data Structure Contract
 *
 * Every test here mandates a specific best-known implementation.
 * Fix the SOURCE, not this test, when a check fails.
 *
 * Sections:
 *   1. Spatial hash grid  — BackgroundParticles O(n·k) connections
 *   2. Typed-array backing — SpatialGrid Int16Array / Uint8Array
 *   3. Squared-distance first — both engines avoid sqrt on far pairs
 *   4. Batch draw calls    — canvas stroke/fill counts per frame
 *   5. Numeric Connection.id — no per-frame string allocation
 *   6. Single DOM walk     — CustomCursor compound .closest()
 *   7. useMemo hot paths   — render-path computations are memoized
 *   8. React.memo          — animation sub-trees skip spurious re-renders
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSpatialGrid,
  getGridDimensions,
  rebuildSpatialGrid,
} from '@/components/hero/background-particles/engine';
import {
  buildConnections as buildIpConnections,
  type Particle as IpParticle,
} from '@/components/hero/interactive-particles/engine';

// ── read helper (same pattern as modularization-contract.test.ts) ──────────
const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');

// ═══════════════════════════════════════════════════════════════════════════
// 1. Spatial hash grid — BackgroundParticles connections
// ═══════════════════════════════════════════════════════════════════════════

describe('BackgroundParticles — spatial hash grid (O(n·k))', () => {
  it('imports forEachConnectedPair and rebuildSpatialGrid from the engine module', () => {
    const src = read('src/components/hero/BackgroundParticles.tsx');
    expect(src).toContain('forEachConnectedPair');
    expect(src).toContain('rebuildSpatialGrid');
  });

  it('does not contain a raw O(n²) nested particle loop in the component body', () => {
    const src = read('src/components/hero/BackgroundParticles.tsx');
    // Brute-force pattern: iterating j starting from i+1 over the full particles array
    expect(src).not.toMatch(/for\s*\(\s*let\s+j\s*=\s*i\s*\+\s*1/);
    expect(src).not.toMatch(/for\s*\(\s*let\s+j\s*=\s*0/);
  });

  it('caps devicePixelRatio at 2 to prevent excessive canvas allocation on 3× displays', () => {
    const src = read('src/components/hero/BackgroundParticles.tsx');
    // Must use Math.min(..., 2) — any DPR above 2 is capped
    expect(src).toContain(', 2)');
    // Must use the || 1 fallback for browsers that expose DPR as 0 or undefined
    expect(src).toContain('|| 1');
  });

  it('uses ctx.setTransform for DPR scaling (non-cumulative, safe to call on every resize)', () => {
    const src = read('src/components/hero/BackgroundParticles.tsx');
    expect(src).toContain('setTransform(dpr');
    // Must NOT use ctx.scale() which accumulates multiplicatively across resizes
    expect(src).not.toContain('ctx.scale(dpr');
    expect(src).not.toContain('ctx.scale(');
  });

  it('uses Math.round for canvas pixel dimensions (prevents sub-pixel blur on fractional DPR)', () => {
    const src = read('src/components/hero/BackgroundParticles.tsx');
    expect(src).toContain('Math.round(width * dpr)');
    expect(src).toContain('Math.round(height * dpr)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Typed-array backing — SpatialGrid
// ═══════════════════════════════════════════════════════════════════════════

describe('SpatialGrid — typed-array backing (zero GC per frame)', () => {
  it('interface declares data as Int16Array, not number[] or any[]', () => {
    const src = read('src/components/hero/background-particles/engine.ts');
    expect(src).toContain('data: Int16Array');
    expect(src).not.toContain('data: number[]');
    expect(src).not.toContain('data: any[]');
  });

  it('interface declares count as Uint8Array, not number[] or any[]', () => {
    const src = read('src/components/hero/background-particles/engine.ts');
    expect(src).toContain('count: Uint8Array');
    expect(src).not.toContain('count: number[]');
    expect(src).not.toContain('count: any[]');
  });

  it('runtime: createSpatialGrid().data is an Int16Array instance', () => {
    const sg = createSpatialGrid(4, 4);
    expect(sg.data).toBeInstanceOf(Int16Array);
  });

  it('runtime: createSpatialGrid().count is a Uint8Array instance', () => {
    const sg = createSpatialGrid(4, 4);
    expect(sg.count).toBeInstanceOf(Uint8Array);
  });

  it('runtime: typed-array sizes match cols × rows × maxPerCell contract', () => {
    const sg = createSpatialGrid(5, 7, 16);
    expect(sg.data.length).toBe(5 * 7 * 16);
    expect(sg.count.length).toBe(5 * 7);
  });

  it('uses count.fill(0) for O(n) SIMD-optimised reset, not individual element writes', () => {
    const src = read('src/components/hero/background-particles/engine.ts');
    // Must use TypedArray.fill which is SIMD-accelerated in all engines
    expect(src).toContain('sg.count.fill(0)');
    // Must NOT assign 0 to individual count cells (that would be a manual loop reset)
    expect(src).not.toMatch(/sg\.count\[\w+\]\s*=\s*0/);
  });

  it('runtime: rebuildSpatialGrid clears previous frame before inserting', () => {
    const sg = createSpatialGrid(3, 3);
    const { cols } = getGridDimensions(300, 300, 100);
    const sg2 = createSpatialGrid(cols, 3);

    // Frame 1: insert a particle
    rebuildSpatialGrid(sg2, [{ x: 50, y: 50, size: 1, speedX: 0, speedY: 0, opacity: 0.4, fadeSpeed: 0, originalX: 50, originalY: 50 }], 100);
    expect(sg2.count[0]).toBe(1);

    // Frame 2: rebuild with no particles — count must be zero (stale data cleared)
    rebuildSpatialGrid(sg2, [], 100);
    expect(Array.from(sg2.count).every(c => c === 0)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Squared-distance first — skip Math.sqrt on non-connecting pairs
// ═══════════════════════════════════════════════════════════════════════════

describe('background-particles engine — squared-distance guards', () => {
  it('forEachConnectedPair compares dist² before taking Math.sqrt', () => {
    const src = read('src/components/hero/background-particles/engine.ts');
    // Must compare against connectDist2 (squared)
    expect(src).toContain('dx * dx + dy * dy < connectDist2');
    // Any sqrt in forEachConnectedPair must appear AFTER the squared comparison
    const fnStart = src.indexOf('export function forEachConnectedPair');
    const fnBody = src.slice(fnStart, fnStart + 600);
    const sqrtPos = fnBody.indexOf('Math.sqrt');
    const comparePos = fnBody.indexOf('< connectDist2');
    if (sqrtPos !== -1) {
      expect(comparePos).toBeLessThan(sqrtPos);
    }
  });

  it('does not call Math.sqrt unconditionally inside the pair-check inner loop', () => {
    const src = read('src/components/hero/background-particles/engine.ts');
    // The pattern: `Math.sqrt(dx * dx + dy * dy)` BEFORE any conditional would be wrong
    expect(src).not.toContain('const distance = Math.sqrt(dx * dx + dy * dy);\n          if (distance <');
    expect(src).not.toContain('const distance = Math.sqrt(dx * dx + dy * dy);\n        if (distance <');
  });
});

describe('interactive-particles engine — squared-distance guards', () => {
  it('buildConnections defines connectDist2 = connectionDistance² and compares dist² < connectDist2', () => {
    const src = read('src/components/hero/interactive-particles/engine.ts');
    expect(src).toContain('connectDist2 = connectionDistance * connectionDistance');
    expect(src).toContain('dist2 < connectDist2');
    // The old wrong pattern: sqrt then compare
    expect(src).not.toContain('Math.sqrt(dx * dx + dy * dy) < connectionDistance');
  });

  it('stepParticles uses dist² < 484 to reject far particles before sqrt in pointer branch', () => {
    const src = read('src/components/hero/interactive-particles/engine.ts');
    // 22² = 484; must appear BEFORE Math.sqrt to guard the expensive call
    expect(src).toContain('dist2 < 484');
    // The old wrong pattern: unconditional sqrt then compare distance < 22
    expect(src).not.toMatch(/const distance = Math\.sqrt\(dx \* dx \+ dy \* dy\);\s*if \(distance < 22/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Batch draw calls — canvas stroke/fill counts per animation frame
// ═══════════════════════════════════════════════════════════════════════════

describe('BackgroundParticles — batched canvas draw calls', () => {
  let strokeCount: number;
  let fillCount: number;
  let mockCtx: Record<string, unknown>;

  beforeEach(() => {
    strokeCount = 0;
    fillCount = 0;
    mockCtx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(() => { strokeCount++; }),
      fill: vi.fn(() => { fillCount++; }),
      setTransform: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
    vi.stubGlobal('innerWidth', 500);
    vi.stubGlobal('innerHeight', 500);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('calls ctx.stroke() ≤ 2 times per frame (batch: 1 for connections + 1 for mouse-pull)', async () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { default: BackgroundParticles } = await import('@/components/hero/BackgroundParticles');
    const { unmount } = render(<BackgroundParticles quality="full" />);

    // Activate mouse-pull path
    fireEvent.mouseMove(window, { clientX: 250, clientY: 250 });

    // Reset after mount frame; count only the scheduled next frame
    strokeCount = 0;
    fillCount = 0;
    act(() => { callbacks[0]?.(16); });

    // Before optimisation: N_connections stroke() calls (up to ~1,000 on full desktop).
    // After optimisation: 1 (connections batch) + 1 (mouse-pull batch) = 2 maximum.
    expect(strokeCount).toBeLessThanOrEqual(2);
    unmount();
  });

  it('calls ctx.fill() exactly 3 times per frame (one per opacity tier, not once per particle)', async () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { default: BackgroundParticles } = await import('@/components/hero/BackgroundParticles');
    const { unmount } = render(<BackgroundParticles quality="full" />);

    fillCount = 0;
    act(() => { callbacks[0]?.(16); });

    // Before optimisation: up to 150 fill() calls (one per particle).
    // After optimisation: exactly 3 (three opacity tiers regardless of particle count).
    expect(fillCount).toBe(3);
    unmount();
  });

  it('calls ctx.stroke() ≤ 1 time per frame when mouse is inactive (no mouse-pull lines)', async () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { default: BackgroundParticles } = await import('@/components/hero/BackgroundParticles');
    const { unmount } = render(<BackgroundParticles quality="full" />);

    // No mouse move — mouse stays at (-1000, -1000), guard `mouse.x > -900` is false
    strokeCount = 0;
    act(() => { callbacks[0]?.(16); });

    expect(strokeCount).toBeLessThanOrEqual(1);
    unmount();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Numeric Connection.id — zero per-frame string allocation
// ═══════════════════════════════════════════════════════════════════════════

describe('interactive-particles Connection.id — numeric, not string', () => {
  it('Connection interface declares id as number, not string', () => {
    const src = read('src/components/hero/interactive-particles/engine.ts');
    // Interface body with `id: number`
    expect(src).toMatch(/interface Connection\s*\{[^}]*\bid:\s*number/s);
    // Must NOT declare id as string (which would allocate per frame)
    expect(src).not.toMatch(/interface Connection\s*\{[^}]*\bid:\s*string/s);
  });

  it('buildConnections uses integer arithmetic for id, not a template literal', () => {
    const src = read('src/components/hero/interactive-particles/engine.ts');
    // Template literal `${a.id}-${b.id}` allocates a new string every frame per pair
    expect(src).not.toContain('`${a.id}-${b.id}`');
    expect(src).not.toContain('`${a.id}${b.id}`');
    expect(src).not.toContain('"" + a.id');
    // Must use integer arithmetic (e.g. a.id * N + b.id)
    expect(src).toMatch(/a\.id\s*\*\s*\d+\s*\+\s*b\.id/);
  });

  it('runtime: Connection.id values are JavaScript numbers', () => {
    const particles: IpParticle[] = Array.from({ length: 5 }, (_, i) => ({
      id: i, x: i * 4, y: 0, size: 2, color: '#fff',
      velocity: { x: 0, y: 0 }, opacity: 1, phase: 0,
    }));
    const lines = buildIpConnections(particles, 100, 100);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(typeof line.id).toBe('number');
      expect(Number.isInteger(line.id)).toBe(true);
    }
  });

  it('runtime: all Connection.id values are distinct (no pair emitted twice)', () => {
    const particles: IpParticle[] = Array.from({ length: 10 }, (_, i) => ({
      id: i, x: i * 3, y: 0, size: 2, color: '#fff',
      velocity: { x: 0, y: 0 }, opacity: 1, phase: 0,
    }));
    const lines = buildIpConnections(particles, 100, 200);
    const ids = lines.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('runtime: numeric id encodes both particle indices unambiguously', () => {
    // With a.id * 1000 + b.id, pair (3,7) → 3007, pair (7,3) is never emitted (j > i guard)
    const particles: IpParticle[] = [
      { id: 3, x: 0, y: 0, size: 1, color: '#fff', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 },
      { id: 7, x: 5, y: 0, size: 1, color: '#fff', velocity: { x: 0, y: 0 }, opacity: 1, phase: 0 },
    ];
    const lines = buildIpConnections(particles, 100, 100);
    // Only one pair (i=0/id=3, j=1/id=7): id = 3*1000 + 7 = 3007
    expect(lines).toHaveLength(1);
    expect(lines[0].id).toBe(3007);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Single DOM walk — CustomCursor hover detection
// ═══════════════════════════════════════════════════════════════════════════

describe('CustomCursor — single compound .closest() call per mouseover', () => {
  it('uses a single .closest() with a compound CSS selector (one DOM tree walk)', () => {
    const src = read('src/components/ui/CustomCursor.tsx');
    // Must have a compound selector in one call
    expect(src).toContain(".closest('a, button");
    // Only one .closest() invocation total in the file
    const closestOccurrences = [...src.matchAll(/\.closest\(/g)];
    expect(closestOccurrences).toHaveLength(1);
  });

  it('does not separately check tagName (redundant with closest which checks the element itself)', () => {
    const src = read('src/components/ui/CustomCursor.tsx');
    expect(src).not.toContain("target.tagName === 'A'");
    expect(src).not.toContain("target.tagName === 'BUTTON'");
    expect(src).not.toContain('target.tagName === "A"');
    expect(src).not.toContain('target.tagName === "BUTTON"');
  });

  it('does not split the hover check into two separate .closest() calls', () => {
    const src = read('src/components/ui/CustomCursor.tsx');
    // Two separate calls would be: .closest('a') and .closest('button')
    expect(src).not.toMatch(/\.closest\(['"]a['"]\)/);
    expect(src).not.toMatch(/\.closest\(['"]button['"]\)/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. useMemo on hot render-path computations
// ═══════════════════════════════════════════════════════════════════════════

describe('Testimonials — sort and filter are memoized', () => {
  it('imports useMemo', () => {
    const src = read('src/components/Testimonials.tsx');
    expect(src).toContain('useMemo');
  });

  it('sortTestimonialsByDate is inside useMemo, not a bare top-level const', () => {
    const src = read('src/components/Testimonials.tsx');
    // The sort call must exist somewhere in the file
    expect(src).toContain('sortTestimonialsByDate(testimonials)');
    // But NOT as a direct assignment: `const sortedTestimonials = sortTestimonialsByDate(...)`
    // (that would re-sort on every render including trivial state updates)
    expect(src).not.toMatch(/^\s*const sortedTestimonials\s*=\s*sortTestimonialsByDate/m);
  });

  it('filterTestimonialsByRelationship is inside useMemo, not a bare top-level const', () => {
    const src = read('src/components/Testimonials.tsx');
    expect(src).toContain('filterTestimonialsByRelationship(sortedTestimonials, relationshipFilter)');
    // Not a bare assignment
    expect(src).not.toMatch(/^\s*const visibleTestimonials\s*=\s*filterTestimonialsByRelationship/m);
  });
});

describe('Experience — sort is memoized', () => {
  it('imports useMemo', () => {
    const src = read('src/components/Experience.tsx');
    expect(src).toContain('useMemo');
  });

  it('sortExperiencesForTimeline is inside useMemo, not a bare top-level const', () => {
    const src = read('src/components/Experience.tsx');
    // Must call the sort function
    expect(src).toContain('sortExperiencesForTimeline(experiences)');
    // Must NOT be a bare assignment that re-sorts on every hover (setActiveExperienceIndex)
    expect(src).not.toMatch(/^\s*const sortedExperiences\s*=\s*sortExperiencesForTimeline/m);
    // Must be inside useMemo
    expect(src).toMatch(/useMemo\(\s*\(\)\s*=>\s*sortExperiencesForTimeline\(experiences\)/);
  });
});

describe('Projects — collection build is memoized', () => {
  it('imports useMemo', () => {
    const src = read('src/components/Projects.tsx');
    expect(src).toContain('useMemo');
  });

  it('buildProjectCollections is inside useMemo, not a bare top-level call', () => {
    const src = read('src/components/Projects.tsx');
    expect(src).toContain('buildProjectCollections(projects)');
    // Must NOT appear as a direct destructuring without useMemo
    expect(src).not.toMatch(/^\s*const\s+\{[^}]+\}\s*=\s*buildProjectCollections/m);
    // Must be wrapped
    expect(src).toContain('useMemo(');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. React.memo — animation sub-trees skip spurious re-renders
// ═══════════════════════════════════════════════════════════════════════════

describe('BrainCursor — React.memo prevents re-renders on every mousemove', () => {
  it('source wraps the component in memo() before exporting', () => {
    const src = read('src/components/ui/BrainCursor.tsx');
    // Must use memo() export
    expect(src).toContain('export default memo(BrainCursor)');
    // Must NOT export the raw function directly
    expect(src).not.toContain('export default function BrainCursor');
    expect(src).not.toContain('export default BrainCursor;');
  });

  it('source imports memo from react', () => {
    const src = read('src/components/ui/BrainCursor.tsx');
    expect(src).toMatch(/import\s+\{[^}]*\bmemo\b[^}]*\}\s+from\s+['"]react['"]/);
  });

  it('runtime: BrainCursor default export carries the react.memo $$typeof marker', async () => {
    const { default: BrainCursor } = await import('@/components/ui/BrainCursor');
    expect(
      (BrainCursor as unknown as { $$typeof: symbol }).$$typeof
    ).toBe(Symbol.for('react.memo'));
  });
});
