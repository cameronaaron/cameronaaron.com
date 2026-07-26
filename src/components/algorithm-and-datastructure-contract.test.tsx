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
 *   7. useMemo hot paths   — render-path computations are memoized
 *  23. Zero-alloc frame loop — interactive engine mutates persistent buffers
 *  24. No Math.hypot        — sqrt of squares repo-wide (hypot's slow path)
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { act, fireEvent, render } from '@testing-library/react';
import * as ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSpatialGrid,
  getGridDimensions,
  rebuildSpatialGrid,
} from '@/components/hero/background-particles/background-particles-engine';
import {
  buildConnections as buildIpConnections,
  stepBursts as stepIpBursts,
  stepParticles as stepIpParticles,
  type BurstParticle as IpBurstParticle,
  type Connection as IpConnection,
  type Particle as IpParticle,
} from '@/components/hero/interactive-particles/interactive-particles-engine';
import { filterTestimonialsByRelationship } from '@/components/testimonials/testimonials-logic';

// ── read helper (same pattern as modularization-contract.test.ts) ──────────
const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');

// ── repo-wide sweep helper: every production source file under src/ ────────
function listProductionSources(): string[] {
  const root = resolve(process.cwd(), 'src');
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.|\.d\.ts$/.test(entry.name)) {
        files.push(full);
      }
    }
  };
  walk(root);
  return files;
}

// ── real-AST scan helpers (typescript compiler API) ─────────────────────────
//
// A regex or textual scan can only ever match one fixed shape of source code
// — reformatting, renaming, or extracting to a helper function evades it
// while the underlying bug ships unchanged (this is exactly how the
// map().filter() ESLint selector was found evadable by splitting the chain
// across two statements; see scripts/eslint-rules/no-split-map-filter.mjs).
// These helpers parse each file with the real TypeScript compiler and walk
// the actual AST/binding structure instead of guessing at text shape, so the
// checks below survive the same class of trivial restructuring.

function parseProductionSource(file: string, src: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    src,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function forEachDescendant(node: ts.Node, visit: (n: ts.Node) => void): void {
  visit(node);
  ts.forEachChild(node, (child) => forEachDescendant(child, visit));
}

/** Resolves a bare identifier to its function body — function declaration, `const
 * name = (...) => {}`, or `const name = useCallback((...) => {}, [...])` — so a
 * check doesn't silently skip handlers that aren't an inline arrow literal. */
function resolveFunctionByName(sourceFile: ts.SourceFile, name: string): ts.Node | null {
  let found: ts.Node | null = null;
  forEachDescendant(sourceFile, (node) => {
    if (found) return;
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      found = node;
      return;
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer) {
      let init: ts.Node = node.initializer;
      if (
        ts.isCallExpression(init) &&
        ts.isIdentifier(init.expression) &&
        (init.expression.text === 'useCallback' || init.expression.text === 'useMemo') &&
        init.arguments.length > 0
      ) {
        init = init.arguments[0];
      }
      if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
        found = init;
      }
    }
  });
  return found;
}

/** True if `node`'s subtree contains an identifier reference anywhere — not just
 * up to the first `;`/`{`, so a multi-statement body can't hide the reference. */
function referencesIdentifier(node: ts.Node, identifierName: string): boolean {
  let found = false;
  forEachDescendant(node, (n) => {
    if (!found && ts.isIdentifier(n) && n.text === identifierName) found = true;
  });
  return found;
}

/** Returns the name of the first `setXxx(...)` call inside `node`'s subtree, following
 * one level of call-outs to other locally-resolvable functions in the same file. */
function findStateSetterCall(node: ts.Node, sourceFile: ts.SourceFile, visited: Set<string> = new Set()): string | null {
  let offender: string | null = null;
  const calledNames = new Set<string>();

  forEachDescendant(node, (n) => {
    if (offender) return;
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
      const calleeName = n.expression.text;
      if (/^set[A-Z]/.test(calleeName)) {
        offender = calleeName;
        return;
      }
      calledNames.add(calleeName);
    }
  });
  if (offender) return offender;

  for (const name of calledNames) {
    if (visited.has(name)) continue;
    visited.add(name);
    const fnNode = resolveFunctionByName(sourceFile, name);
    if (!fnNode) continue;
    const nested = findStateSetterCall(fnNode, sourceFile, visited);
    if (nested) return nested;
  }
  return null;
}

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
    const src = read('src/components/hero/background-particles/background-particles-engine.ts');
    expect(src).toContain('data: Int16Array');
    expect(src).not.toContain('data: number[]');
    expect(src).not.toContain('data: any[]');
  });

  it('interface declares count as Uint8Array, not number[] or any[]', () => {
    const src = read('src/components/hero/background-particles/background-particles-engine.ts');
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
    const src = read('src/components/hero/background-particles/background-particles-engine.ts');
    // Must use TypedArray.fill which is SIMD-accelerated in all engines
    expect(src).toContain('sg.count.fill(0)');
    // Must NOT assign 0 to individual count cells (that would be a manual loop reset)
    expect(src).not.toMatch(/sg\.count\[\w+\]\s*=\s*0/);
  });

  it('runtime: rebuildSpatialGrid clears previous frame before inserting', () => {
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
    const src = read('src/components/hero/background-particles/background-particles-engine.ts');
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
    const src = read('src/components/hero/background-particles/background-particles-engine.ts');
    // The pattern: `Math.sqrt(dx * dx + dy * dy)` BEFORE any conditional would be wrong
    expect(src).not.toContain('const distance = Math.sqrt(dx * dx + dy * dy);\n          if (distance <');
    expect(src).not.toContain('const distance = Math.sqrt(dx * dx + dy * dy);\n        if (distance <');
  });
});

describe('interactive-particles engine — squared-distance guards', () => {
  it('buildConnections defines connectDist2 = connectionDistance² and compares dist² < connectDist2', () => {
    const src = read('src/components/hero/interactive-particles/interactive-particles-engine.ts');
    expect(src).toContain('connectDist2 = connectionDistance * connectionDistance');
    expect(src).toContain('dist2 < connectDist2');
    // The old wrong pattern: sqrt then compare
    expect(src).not.toContain('Math.sqrt(dx * dx + dy * dy) < connectionDistance');
  });

  it('buildConnections exits early when maxConnections is reached — no build-all-then-slice', () => {
    const src = read('src/components/hero/interactive-particles/interactive-particles-engine.ts');
    // Must cap during traversal, not after (count tracks pooled slots in use)
    expect(src).toContain('count >= maxConnections');
    expect(src).toContain('break outer');
    // The old pattern: build unlimited array then slice
    expect(src).not.toContain('lines.slice(0, maxConnections)');
  });

  it('stepBursts uses a single-pass loop — no map() then filter() double traversal', () => {
    const src = read('src/components/hero/interactive-particles/interactive-particles-engine.ts');
    // Must use a for loop with conditional push (one pass)
    expect(src).toContain('for (const burst of bursts)');
    // The old pattern: .map(...).filter(...)
    expect(src).not.toMatch(/stepBursts[\s\S]{0,200}\.map\([\s\S]{0,400}\.filter\(/);
  });

  it('stepParticles uses a named squared-radius constant to guard the expensive sqrt in the pointer branch', () => {
    const src = read('src/components/hero/interactive-particles/interactive-particles-engine.ts');
    // Named constants must be exported (testable + self-documenting)
    expect(src).toContain('export const POINTER_ATTRACT_RADIUS =');
    expect(src).toContain('export const POINTER_ATTRACT_RADIUS_SQ = POINTER_ATTRACT_RADIUS * POINTER_ATTRACT_RADIUS');
    // The squared guard must be applied (not the old literal 484)
    expect(src).toContain('dist2 < POINTER_ATTRACT_RADIUS_SQ');
    expect(src).not.toContain('dist2 < 484');
    // The old wrong pattern: unconditional sqrt then compare distance < 22
    expect(src).not.toMatch(/const distance = Math\.sqrt\(dx \* dx \+ dy \* dy\);\s*if \(distance < 22/);
  });

  it('stepParticles uses named attraction-strength constants (no inline 0.012 / 0.008 literals)', () => {
    const src = read('src/components/hero/interactive-particles/interactive-particles-engine.ts');
    expect(src).toContain('export const ATTRACTION_STRENGTH_FULL =');
    expect(src).toContain('export const ATTRACTION_STRENGTH_BALANCED =');
    expect(src).toContain('ATTRACTION_STRENGTH_FULL');
    expect(src).toContain('ATTRACTION_STRENGTH_BALANCED');
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
    const src = read('src/components/hero/interactive-particles/interactive-particles-engine.ts');
    // Interface body with `id: number`
    expect(src).toMatch(/interface Connection\s*\{[^}]*\bid:\s*number/s);
    // Must NOT declare id as string (which would allocate per frame)
    expect(src).not.toMatch(/interface Connection\s*\{[^}]*\bid:\s*string/s);
  });

  it('buildConnections uses integer arithmetic for id, not a template literal', () => {
    const src = read('src/components/hero/interactive-particles/interactive-particles-engine.ts');
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

// ═══════════════════════════════════════════════════════════════════════════
// 9. Map lookup over Array.find — Navigation active label
// ═══════════════════════════════════════════════════════════════════════════

describe('Navigation — Map lookup (O(1)) over Array.find (O(n)) for active label', () => {
  it('navigation logic exports buildNavLabelMap for O(1) label lookup', () => {
    const src = read('src/components/navigation/navigation-logic.ts');
    expect(src).toContain('export function buildNavLabelMap');
    expect(src).toContain('new Map(');
  });

  it('Navigation.tsx uses buildNavLabelMap + useMemo instead of Array.find on every render', () => {
    const src = read('src/components/Navigation.tsx');
    expect(src).toContain('buildNavLabelMap');
    expect(src).toContain('useMemo');
    expect(src).toContain('navLabelMap.get(activeHref)');
    expect(src).not.toContain('getActiveNavLabel(navItems,');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. Dispatch table over if-chain — Testimonial relationship filtering
// ═══════════════════════════════════════════════════════════════════════════

describe('Testimonials — dispatch table over if-chain in relationship filter', () => {
  it('uses a module-level RELATIONSHIP_MATCHERS dispatch table', () => {
    const src = read('src/components/testimonials/testimonials-logic.ts');
    expect(src).toContain('RELATIONSHIP_MATCHERS');
    expect(src).toContain("if (relationshipFilter === 'all') return items");
    expect(src).not.toMatch(/items\.filter[\s\S]{0,100}if \(relationshipFilter === 'manager'\)/);
  });

  it("runtime: 'all' filter returns the same array reference (no allocation)", () => {
    const items = [
      { relationship: 'Manager', date: '2024', name: 'A', featured: false, company: '', title: '', quote: '', linkedIn: '' },
    ] as never[];
    const result = filterTestimonialsByRelationship(items, 'all');
    expect(result).toBe(items);
  });

  it('runtime: dispatch table routes each filter key correctly', () => {
    const items = [
      { relationship: 'Reporting Manager', date: '2024', name: 'A', featured: false, company: '', title: '', quote: '', linkedIn: '' },
      { relationship: 'Academic Mentor / Professor', date: '2024', name: 'B', featured: false, company: '', title: '', quote: '', linkedIn: '' },
      { relationship: 'Colleague', date: '2024', name: 'C', featured: false, company: '', title: '', quote: '', linkedIn: '' },
    ] as never[];
    expect(filterTestimonialsByRelationship(items, 'manager')).toHaveLength(1);
    expect(filterTestimonialsByRelationship(items, 'mentor')).toHaveLength(1);
    expect(filterTestimonialsByRelationship(items, 'colleague')).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. Motion values bypass React state for high-frequency pointer tracking
// ═══════════════════════════════════════════════════════════════════════════

describe('Hero — pointer tracking writes directly into motion values, not React state', () => {
  it('never re-renders the tree on mousemove: no useState-backed pointer hook', () => {
    const src = read('src/components/Hero.tsx');
    // The old useMousePosition hook re-rendered all of Hero on every mousemove
    // just to feed a Framer Motion value — writing straight into the motion
    // value from the event handler (as use3DTilt.ts / ProfileImage.tsx already
    // do) skips React entirely.
    expect(src).not.toContain('useMousePosition');
    expect(src).toContain('rawPointerX.set(event.clientX)');
    expect(src).toContain('rawPointerY.set(event.clientY)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. Named constants — usePerformanceProfile hardware thresholds
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 13. InteractiveParticles — canvas rendering, zero per-frame React work
// ═══════════════════════════════════════════════════════════════════════════

describe('InteractiveParticles — canvas rendering, no per-frame React state', () => {
  it('renders through a canvas and never drives the simulation through useState', () => {
    const src = read('src/components/hero/InteractiveParticles.tsx');
    expect(src).toContain('<canvas');
    // The old implementation reconciled ~130 absolutely-positioned DOM nodes
    // through setState + left/top at 60fps — reconciliation AND layout per frame.
    expect(src).not.toContain('useState');
    expect(src).not.toContain('setParticles');
    expect(src).not.toContain('setConnections');
    expect(src).not.toContain('setBursts');
  });

  it('batches connection strokes per opacity tier instead of one stroke per line', () => {
    const src = read('src/components/hero/InteractiveParticles.tsx');
    expect(src).toContain('CONNECTION_OPACITY_TIERS');
    expect(src).toContain('getConnectionOpacityTier');
  });

  it('pre-renders glow sprites — no per-particle shadowBlur or DOM box-shadow', () => {
    const src = read('src/components/hero/InteractiveParticles.tsx');
    expect(src).toContain('createRadialGradient');
    expect(src).toContain('drawImage');
    expect(src).not.toMatch(/\.shadowBlur\s*=/);
    expect(src).not.toContain('boxShadow:');
  });

  it('follows the BackgroundParticles DPR contract (cap at 2, || 1 fallback, setTransform, Math.round)', () => {
    const src = read('src/components/hero/InteractiveParticles.tsx');
    expect(src).toContain(', 2)');
    expect(src).toContain('|| 1');
    expect(src).toContain('setTransform(dpr');
    expect(src).not.toContain('ctx.scale(');
    expect(src).toContain('Math.round(width * dpr)');
    expect(src).toContain('Math.round(height * dpr)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. SpotlightCard — CSS custom properties bypass React on mousemove
// ═══════════════════════════════════════════════════════════════════════════

describe('SpotlightCard — CSS variables for mousemove, state only for hover', () => {
  it('writes --spotlight-x/--spotlight-y via ref, never setState per mousemove', () => {
    const src = read('src/components/ui/SpotlightCard.tsx');
    expect(src).toContain("setProperty('--spotlight-x'");
    expect(src).toContain("setProperty('--spotlight-y'");
    expect(src).toContain('var(--spotlight-x');
    expect(src).toContain('var(--spotlight-y');
    // The old pattern re-rendered the card AND all children on every mousemove
    expect(src).not.toContain('setPosition');
    expect(src).not.toMatch(/useState\(\{\s*x:/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. Navigation — single-pass bounds + rAF-coalesced scroll handler
// ═══════════════════════════════════════════════════════════════════════════

describe('Navigation — single-pass section bounds and rAF-coalesced updates', () => {
  it('computeSectionBounds is a single-pass loop, not map().filter()', () => {
    const logic = read('src/components/navigation/navigation-logic.ts');
    const fnStart = logic.indexOf('export function computeSectionBounds');
    const fnBody = logic.slice(fnStart, fnStart + 600);
    expect(fnBody).not.toContain('.map(');
    expect(fnBody).not.toContain('.filter(');
    expect(fnBody).toContain('bounds.push(');
  });

  it('Navigation coalesces scroll/resize into at most one layout read per frame', () => {
    const src = read('src/components/Navigation.tsx');
    expect(src).toContain('requestAnimationFrame');
    expect(src).toContain("addEventListener('scroll', scheduleUpdate, { passive: true })");
    expect(src).toContain("addEventListener('resize', scheduleUpdate, { passive: true })");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. Structured-data builders — single-pass collection, no repeated parsing
// ═══════════════════════════════════════════════════════════════════════════

describe('structured-data builders — single-pass role collection', () => {
  it('collects role names with one loop, not flatMap+map+filter', () => {
    const src = read('src/components/structured-data/structured-data-builders.ts');
    expect(src).not.toMatch(/flatMap\([\s\S]{0,200}\.filter\(/);
    expect(src).toContain('roleNameSet');
  });

  it('splitPeriod/toIsoDate results are computed once per item, not once per spread', () => {
    const src = read('src/components/structured-data/structured-data-builders.ts');
    // The old pattern called splitPeriod(exp.positions[0]?.period) three times per experience
    expect(src).not.toMatch(/\.\.\.\(splitPeriod\(/);
    expect(src).not.toMatch(/\.\.\.\(toIsoDate\(/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. Repo-wide sweeps — every production file, present AND future
//     (per-file checks above pin known hot spots; these prevent new ones)
// ═══════════════════════════════════════════════════════════════════════════

describe('repo-wide — high-frequency event listeners are always passive', () => {
  it('every mousemove/scroll/touchmove/pointermove/wheel/resize listener passes { passive: true }', () => {
    const highFrequencyEvents = /addEventListener\(\s*'(?:mousemove|scroll|touchmove|pointermove|wheel|resize|mouseout|pageshow)'/;
    for (const file of listProductionSources()) {
      const src = readFileSync(file, 'utf8');
      for (const line of src.split('\n')) {
        if (highFrequencyEvents.test(line)) {
          expect(line, `${file} — non-passive high-frequency listener: ${line.trim()}`).toContain('passive: true');
        }
      }
    }
  });
});

describe('repo-wide — no map().filter() chains in production code', () => {
  it('no file chains .filter( directly onto .map(...), including split across a variable', () => {
    // A regex/single-selector AST match can only ever catch the DIRECT chain
    // shape (`a.map(f).filter(g)`) — splitting the identical two-array
    // allocation across two statements (`const m = a.map(f); m.filter(g)`)
    // evades it while doing the same work (the exact evasion no-split-map-
    // filter.mjs closes at lint time). This walks the real AST for both shapes.
    for (const file of listProductionSources()) {
      const src = readFileSync(file, 'utf8');
      const sourceFile = parseProductionSource(file, src);
      const offenses: string[] = [];

      // Track single-definition, never-reassigned bindings sourced from .map()/.flatMap().
      const mapFlatMapSource = new Map<string, string>();
      const declCount = new Map<string, number>();
      const reassigned = new Set<string>();
      forEachDescendant(sourceFile, (node) => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
          const name = node.name.text;
          declCount.set(name, (declCount.get(name) ?? 0) + 1);
          if (node.initializer && ts.isCallExpression(node.initializer)) {
            const callee = node.initializer.expression;
            if (ts.isPropertyAccessExpression(callee) && (callee.name.text === 'map' || callee.name.text === 'flatMap')) {
              mapFlatMapSource.set(name, callee.name.text);
            }
          }
        }
        if (
          ts.isBinaryExpression(node) &&
          node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isIdentifier(node.left)
        ) {
          reassigned.add(node.left.text);
        }
      });

      forEachDescendant(sourceFile, (node) => {
        if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression) || node.expression.name.text !== 'filter') {
          return;
        }
        const target = node.expression.expression;

        // Direct chain: `<expr>.map(...).filter(...)`.
        if (ts.isCallExpression(target) && ts.isPropertyAccessExpression(target.expression)) {
          const innerName = target.expression.name.text;
          if (innerName === 'map' || innerName === 'flatMap') {
            offenses.push(`direct ${innerName}().filter() chain`);
            return;
          }
        }

        // Split form: `const m = <expr>.map(...); ...; m.filter(...)`.
        if (ts.isIdentifier(target)) {
          const source = mapFlatMapSource.get(target.text);
          if (source && (declCount.get(target.text) ?? 0) === 1 && !reassigned.has(target.text)) {
            offenses.push(`split ${source}().filter() chain via '${target.text}'`);
          }
        }
      });

      expect(offenses, `${file} contains a map().filter() chain — allocates an intermediate array; use a single-pass loop:\n${offenses.join('\n')}`).toEqual([]);
    }
  });
});

describe('repo-wide — no setState wired to raw mousemove listeners', () => {
  it('no window mousemove handler body calls a setXxx state setter', () => {
    // A mousemove listener whose registered handler name also appears assigning
    // React state is the exact pattern the motion-value rule exists to prevent.
    // Resolved via the real AST (function declarations, const arrows, and
    // useCallback/useMemo-wrapped arrows) rather than a brace-counting regex —
    // the prior regex silently skipped (via a bare `continue`, not a failure)
    // any handler not shaped exactly like `const name = (args) {...\n    };`,
    // which meant this repo's own established useCallback-wrapped-handler
    // pattern (see PredatorPreyChase's handlePointerMove) was never actually
    // checked. Also follows one level of call-outs to locally defined helper
    // functions, so a handler that delegates to a same-file helper is covered.
    for (const file of listProductionSources()) {
      const src = readFileSync(file, 'utf8');
      const sourceFile = parseProductionSource(file, src);
      const handlerNames = new Set<string>();

      forEachDescendant(sourceFile, (node) => {
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === 'addEventListener' &&
          node.arguments.length >= 2 &&
          ts.isStringLiteral(node.arguments[0]) &&
          node.arguments[0].text === 'mousemove' &&
          ts.isIdentifier(node.arguments[1])
        ) {
          handlerNames.add(node.arguments[1].text);
        }
      });

      for (const name of handlerNames) {
        const fnNode = resolveFunctionByName(sourceFile, name);
        // A handler imported from another module is outside what a single-file
        // AST walk can resolve — the same "can't safely infer" boundary
        // no-split-map-filter.mjs draws for reassigned/destructured bindings.
        if (!fnNode) continue;

        const offender = findStateSetterCall(fnNode, sourceFile);
        expect(
          offender,
          `${file} — mousemove handler '${name}' calls '${offender}' (a React state setter); high-frequency pointer events must drive a motion value, ref, or CSS variable instead`,
        ).toBeNull();
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. Decorate-sort-undecorate — sort keys computed once, never per comparison
// ═══════════════════════════════════════════════════════════════════════════

describe('sorting — expensive keys are precomputed, not recomputed per comparison', () => {
  it('sortByDateDesc decorates with getDateSortKey once per item', () => {
    const src = read('src/data/dateOrdering.ts');
    // The comparator must compare precomputed numeric keys only
    expect(src).toMatch(/decorated\.sort\(\(a, b\) => b\.key - a\.key\)/);
    // getDateSortKey must never be called inside a comparator anywhere
    expect(src).not.toMatch(/\.sort\(\([^)]*\)\s*=>[^;]*getDateSortKey/);
  });

  it('no comparator in production code calls getDateSortKey', () => {
    // The prior regex (`[^{;]*getDateSortKey`) stopped scanning at the first
    // `{` or `;` — a multi-statement arrow body, or a comparator extracted to
    // a separate named function and passed by reference (`arr.sort(cmp)`),
    // both evaded it while still recomputing the date key per comparison.
    // This walks the real AST for both an inline comparator and a
    // by-name-resolved one, over the comparator's FULL body.
    for (const file of listProductionSources()) {
      const src = readFileSync(file, 'utf8');
      const sourceFile = parseProductionSource(file, src);
      const offenses: string[] = [];

      forEachDescendant(sourceFile, (node) => {
        if (
          !ts.isCallExpression(node) ||
          !ts.isPropertyAccessExpression(node.expression) ||
          node.expression.name.text !== 'sort' ||
          node.arguments.length === 0
        ) {
          return;
        }
        const arg = node.arguments[0];
        let fnNode: ts.Node | null = null;
        if (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) {
          fnNode = arg;
        } else if (ts.isIdentifier(arg)) {
          fnNode = resolveFunctionByName(sourceFile, arg.text);
        }
        if (fnNode && referencesIdentifier(fnNode, 'getDateSortKey')) {
          offenses.push('sort comparator references getDateSortKey');
        }
      });

      expect(offenses, `${file} re-parses dates inside a sort comparator (inline or by named reference) — decorate first:\n${offenses.join('\n')}`).toEqual([]);
    }
  });

  it('sortPrerequisiteCourses precomputes the non-finalized bucket', () => {
    const src = read('src/components/education/education-logic.ts');
    expect(src).toContain('nonFinalized: Number(isNonFinalizedCourseStatus(');
    // The token scan must not run inside the comparator
    expect(src).not.toMatch(/\.sort\([\s\S]{0,200}isNonFinalizedCourseStatus/);
  });

  it('runtime: sortByDateDesc calls the value getter exactly once per item', async () => {
    const { sortByDateDesc } = await import('@/data/dateOrdering');
    const items = ['Jan 2024', 'Mar 2020', 'Feb 2026', 'May 2022', 'Jun 2021'];
    let getterCalls = 0;
    const sorted = sortByDateDesc(items, (item) => {
      getterCalls += 1;
      return item;
    });
    expect(getterCalls).toBe(items.length);
    expect(sorted).toEqual(['Feb 2026', 'Jan 2024', 'May 2022', 'Jun 2021', 'Mar 2020']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. useMemo on remaining collection builds — Education, Certifications,
//     Contact, ExperienceCard (same rule as Testimonials/Experience/Projects)
// ═══════════════════════════════════════════════════════════════════════════

describe('Education — Server Component build-time collection, status flag precomputed', () => {
  it('is a Server Component that builds collections at build time — no useMemo needed (RSC, 2026-07)', () => {
    const src = read('src/components/Education.tsx');
    // Education became a Server Component (RSC migration): it renders once at
    // BUILD and ships zero client JS, so the §3.4 memoization rule (which
    // exists to stop a CLIENT component re-running a build on every render)
    // does not apply — a bare build-time call is the correct, cheaper pattern.
    // Guard both directions: it must NOT be a client component, and it must
    // still call buildEducationCollections (not inline the sort/group logic).
    expect(src).not.toMatch(/^['"]use client['"]/m);
    expect(src).not.toContain('useMemo');
    expect(src).toContain('buildEducationCollections(educationItems, prerequisiteCourses, honorsAndAffiliations)');
  });

  it('render reads the precomputed course.nonFinalized flag — no per-row token rescan', () => {
    const src = read('src/components/Education.tsx');
    expect(src).toContain('course.nonFinalized');
    // The token scan belongs in sortPrerequisiteCourses (once per course), never in JSX.
    expect(src).not.toContain('isNonFinalizedCourseStatus(');
  });

  it('runtime: sortPrerequisiteCourses attaches nonFinalized computed during the sort', async () => {
    const { sortPrerequisiteCourses } = await import('@/components/education/education-logic');
    const sorted = sortPrerequisiteCourses([
      { requirement: 'A', course: 'X', units: '3', grade: 'A', status: 'Completed' },
      { requirement: 'B', course: 'Y', units: '4', grade: '—', status: 'In Progress' },
    ]);
    expect(sorted[0]).toMatchObject({ status: 'Completed', nonFinalized: false });
    expect(sorted[1]).toMatchObject({ status: 'In Progress', nonFinalized: true });
  });
});

describe('Certifications — Server Component build-time collection', () => {
  it('is a Server Component that builds collections at build time — no useMemo needed (RSC, 2026-07)', () => {
    // Same shape as Education (see that describe block above): Certifications
    // became a Server Component in the RSC migration, so §3.4's memoization
    // rule (which exists to stop a CLIENT component re-running a build on
    // every render) does not apply here.
    const src = read('src/components/Certifications.tsx');
    expect(src).not.toMatch(/^['"]use client['"]/m);
    expect(src).not.toContain('useMemo');
    expect(src).toContain('buildCertificationCollections(');
    expect(src).toContain('certifications,');
    expect(src).toContain('inProgressCertifications,');
  });
});

describe('Contact — social-link build is memoized', () => {
  it('buildContactSocialLinks is inside useMemo, not a bare component-body call', () => {
    const src = read('src/components/Contact.tsx');
    expect(src).toContain('useMemo(() => buildContactSocialLinks(socialPlatforms, profile.social)');
    expect(src).not.toMatch(/^\s*const socialLinks\s*=\s*buildContactSocialLinks/m);
  });
});

describe('ExperienceCard — monogram memoized across hover re-renders', () => {
  it('buildCompanyMonogram is inside useMemo keyed on the company name', () => {
    const src = read('src/components/experience/ExperienceCard.tsx');
    // This component re-renders on every hover enter/leave (isHovering state);
    // the monogram must not be rebuilt each time.
    expect(src).toContain('useMemo(() => buildCompanyMonogram(experience.company), [experience.company])');
    expect(src).not.toMatch(/^\s*const companyMonogram\s*=\s*buildCompanyMonogram/m);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. React.memo — activating one ExperienceCard must not re-render siblings
// ═══════════════════════════════════════════════════════════════════════════

describe('ExperienceCard — memoized so activation is O(1) cards re-rendered, not O(n)', () => {
  it('default export is wrapped in memo()', () => {
    const src = read('src/components/experience/ExperienceCard.tsx');
    expect(src).toMatch(/export default memo\(ExperienceCard\)/);
  });

  it('Experience passes a useCallback-stable onActivate, never an inline closure', () => {
    const src = read('src/components/Experience.tsx');
    expect(src).toMatch(/useCallback\(\(index: number\) => setActiveExperienceIndex\(index\), \[\]\)/);
    expect(src).not.toContain('onActivate={() =>');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 21. Early-exit unique-tag collection + single-pass partition — projects
// ═══════════════════════════════════════════════════════════════════════════

describe('projects logic — early-exit tag scan and single-pass partition', () => {
  it('getResearchSignals breaks out as soon as the limit is reached — no build-then-slice', () => {
    const src = read('src/components/projects/projects-logic.ts');
    expect(src).toContain('break outer');
    expect(src).not.toMatch(/new Set\([\s\S]{0,120}flatMap/);
    expect(src).not.toContain('.slice(0, limit)');
  });

  it('buildProjectCollections partitions in one pass — no repeat traversal', () => {
    const src = read('src/components/projects/projects-logic.ts');

    // Asserted structurally rather than by pinning one expression's literal
    // text. The old pin required the exact string `project.featured ? featured
    // : other`, so widening the partition from two buckets to three
    // (2026-07-26, to pair each game with its project) failed this check while
    // the single-pass property it protects was fully intact — a pin standing in
    // for a requirement (§6 item 2). What actually matters is: no .filter()
    // traversals of the input, and exactly ONE loop over it however the
    // branching is written.
    expect(src).not.toContain('items.filter(');

    const body = src.slice(src.indexOf('export function buildProjectCollections'));
    const traversals = body.match(/for \(const \w+ of items\)/g) ?? [];
    expect(traversals).toHaveLength(1);

    // And every bucket is filled from inside that one loop.
    for (const bucket of ['featured', 'playable', 'other']) {
      expect(body).toContain(`${bucket}.push(project)`);
    }
  });

  it('runtime: getResearchSignals stops after `limit` unique tags and dedupes', async () => {
    const { getResearchSignals } = await import('@/components/projects/projects-logic');
    const items = [
      { tags: ['a', 'b', 'a'] },
      { tags: ['c', 'b', 'd'] },
      { tags: ['e'] },
    ] as never[];
    expect(getResearchSignals(items, 3)).toEqual(['a', 'b', 'c']);
    expect(getResearchSignals(items, 10)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('structured-data builders collect research themes with a single-pass Set, not flatMap', () => {
    const src = read('src/components/structured-data/structured-data-builders.ts');
    expect(src).toContain('researchThemeSet');
    expect(src).not.toContain('flatMap((project) => project.tags)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 22. Mobile GPU — backdrop-filter disabled on coarse pointers
// ═══════════════════════════════════════════════════════════════════════════

describe('globals.css — backdrop-filter is disabled on touch devices', () => {
  it('the coarse-pointer media block zeroes backdrop-filter globally', () => {
    const css = read('src/app/globals.css');
    const blockStart = css.indexOf('@media (hover: none), (pointer: coarse)');
    expect(blockStart).toBeGreaterThan(-1);
    const block = css.slice(blockStart, blockStart + 600);
    expect(block).toContain('backdrop-filter: none !important');
    expect(block).toContain('-webkit-backdrop-filter: none !important');
    expect(block).toContain('background-attachment: scroll');
  });
});

describe('usePerformanceProfile — exported named constants for hardware thresholds', () => {
  it('exports LOW_HARDWARE_CORES_THRESHOLD, LOW_HARDWARE_MEMORY_GB_THRESHOLD, and defaults', () => {
    const src = read('src/hooks/usePerformanceProfile.ts');
    expect(src).toContain('export const LOW_HARDWARE_CORES_THRESHOLD');
    expect(src).toContain('export const LOW_HARDWARE_MEMORY_GB_THRESHOLD');
    expect(src).toContain('export const DEFAULT_HARDWARE_CONCURRENCY');
    expect(src).toContain('export const DEFAULT_DEVICE_MEMORY_GB');
    expect(src).not.toMatch(/cores <= 4/);
    expect(src).not.toMatch(/memory <= 4/);
    expect(src).not.toMatch(/\?\? 8\b/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 23. Interactive-particles — zero-allocation frame loop
//     (same contract the background engine already meets: a steady-state
//     frame mutates persistent buffers and allocates nothing)
// ═══════════════════════════════════════════════════════════════════════════

describe('interactive-particles engine — zero-allocation frame loop', () => {
  it('stepParticles mutates in place — no per-frame map() or object spread', () => {
    const src = read('src/components/hero/interactive-particles/interactive-particles-engine.ts');
    const fnStart = src.indexOf('export function stepParticles');
    const fnEnd = src.indexOf('\nexport ', fnStart + 1);
    const fnBody = src.slice(fnStart, fnEnd === -1 ? src.length : fnEnd);
    expect(fnBody).not.toContain('.map(');
    expect(fnBody).not.toContain('...particle');
    expect(fnBody).toContain('return particles');
  });

  it('stepBursts compacts in place — no per-frame array or object allocation', () => {
    const src = read('src/components/hero/interactive-particles/interactive-particles-engine.ts');
    const fnStart = src.indexOf('export function stepBursts');
    const fnEnd = src.indexOf('\nexport ', fnStart + 1);
    const fnBody = src.slice(fnStart, fnEnd === -1 ? src.length : fnEnd);
    expect(fnBody).not.toContain('...burst');
    expect(fnBody).not.toMatch(/const result\s*:\s*BurstParticle\[\]\s*=\s*\[\]/);
    expect(fnBody).toContain('bursts.length = write');
    expect(fnBody).toContain('return bursts');
  });

  it('runtime: stepParticles and stepBursts return the same array reference (in-place)', () => {
    const particles: IpParticle[] = [{
      id: 1, x: 50, y: 50, size: 2, color: '#fff',
      velocity: { x: 0.1, y: 0.1 }, opacity: 1, phase: 0,
    }];
    expect(stepIpParticles(particles, 1, { x: 50, y: 50, active: false }, 'full')).toBe(particles);

    const bursts: IpBurstParticle[] = [{ id: 1, x: 0, y: 0, vx: 1, vy: 1, life: 1, size: 2, color: '#fff' }];
    expect(stepIpBursts(bursts, 1)).toBe(bursts);
  });

  it('runtime: buildConnections rewrites a caller-provided pool in place across frames', () => {
    const particles: IpParticle[] = Array.from({ length: 4 }, (_, i) => ({
      id: i, x: i * 2, y: 0, size: 1, color: '#fff',
      velocity: { x: 0, y: 0 }, opacity: 1, phase: 0,
    }));
    const pool: IpConnection[] = [];

    const first = buildIpConnections(particles, 10, 10, pool);
    expect(first).toBe(pool);
    const firstSlot = first[0];

    const second = buildIpConnections(particles, 10, 10, pool);
    expect(second).toBe(pool);
    // Same object slot reused — the second frame allocates zero connections.
    expect(second[0]).toBe(firstSlot);
  });

  it('component owns persistent frame buffers — pool, tier scratch, pulse scratch', () => {
    const src = read('src/components/hero/InteractiveParticles.tsx');
    expect(src).toContain('const connectionPool: Connection[] = []');
    expect(src).toContain('new Uint8Array(config.maxConnections)');
    expect(src).toContain('pulseScratch');
    // The old per-click double allocation: bursts.concat(next).slice(-max)
    expect(src).not.toContain('.concat(');
    expect(src).not.toContain('.slice(');
  });

  it('connection stroke styles are precomputed at module level, never built per frame', () => {
    const engine = read('src/components/hero/interactive-particles/interactive-particles-engine.ts');
    expect(engine).toContain('export const CONNECTION_TIER_STYLES');
    const component = read('src/components/hero/InteractiveParticles.tsx');
    expect(component).toContain('CONNECTION_TIER_STYLES[tier]');
    // The old pattern: a template-literal strokeStyle allocated 3× per frame
    expect(component).not.toMatch(/strokeStyle = `rgba/);
  });

  it('connection tier is computed once per line per frame, not once per tier pass', () => {
    const component = read('src/components/hero/InteractiveParticles.tsx');
    // Tier lookup fills the persistent scratch in a single pass...
    expect(component).toContain('tierScratch[k] = getConnectionOpacityTier(lines[k].opacity)');
    // ...and the per-tier stroke passes compare the cached byte only.
    expect(component).not.toMatch(/if \(getConnectionOpacityTier\(line\.opacity\) !== tier\)/);
  });
});


// ── Section 24: Math.hypot is banned in production code ─────────────────────
describe('Math.hypot never appears in production source (sqrt of squares instead)', () => {
  it('no production file calls Math.hypot', () => {
    // Math.hypot buys overflow safety for magnitudes around 1e150 at the cost
    // of a correctly-rounded slow path measurably slower than
    // Math.sqrt(dx*dx + dy*dy) in V8 — and no coordinate, velocity, or force
    // in this codebase can approach the overflow range that safety defends.
    // Found live in two frame-hot loops (2026-07-23): the verlet ribbon's
    // constraint solver (segments × iterations × 60fps) and the skill-web
    // velocity clamp (which additionally gained a squared-comparison guard so
    // the settled steady state pays zero roots). Both rewritten; this sweep
    // keeps the pattern out repo-wide. If a future call site genuinely needs
    // hypot's overflow behavior, add it to the allowlist below with the
    // magnitude analysis that justifies it (§6 item 18).
    const HYPOT_ALLOWED: Record<string, string> = {};
    const offenders: string[] = [];
    for (const file of listProductionSources()) {
      const rel = file.slice(resolve(process.cwd()).length + 1);
      if (rel in HYPOT_ALLOWED) continue;
      if (readFileSync(file, 'utf8').includes('Math.hypot')) {
        offenders.push(`  ${rel}`);
      }
    }
    expect(
      offenders,
      `Math.hypot in production code — use Math.sqrt(dx*dx + dy*dy) (several times faster in V8; ` +
        `overflow safety defends magnitudes nothing here can reach), or add a reasoned HYPOT_ALLOWED entry:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
