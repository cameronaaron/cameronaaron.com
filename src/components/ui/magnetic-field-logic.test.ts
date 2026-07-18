import { describe, expect, it } from 'vitest';

import {
  QUAD_CAPACITY,
  QUAD_MAX_DEPTH,
  buildQuadtree,
  circleIntersectsRect,
  createQuadNode,
  quadInsert,
  quadQueryNearest,
  rectContains,
  type QuadPoint,
} from './magnetic-field-logic';

function point(x: number, y: number, index = 0): QuadPoint {
  return { x, y, index };
}

describe('rectContains', () => {
  const rect = { x: 0, y: 0, w: 10, h: 10 };
  it('includes interior and edge points, excludes outside', () => {
    expect(rectContains(rect, 5, 5)).toBe(true);
    expect(rectContains(rect, 0, 0)).toBe(true);
    expect(rectContains(rect, 10, 10)).toBe(true);
    expect(rectContains(rect, 11, 5)).toBe(false);
    expect(rectContains(rect, 5, -1)).toBe(false);
  });

  it('rejects a point left of the rect even though every other clause is true', () => {
    // x=-1 fails only the `x >= rect.x` clause; y=5 and x<=10 both hold, so a
    // mutant that replaces just that first clause with `true` would wrongly
    // accept this point. The existing "outside" cases above happen to fail
    // via the right/bottom clauses instead, leaving this one unexercised.
    expect(rectContains(rect, -1, 5)).toBe(false);
  });
});

describe('circleIntersectsRect', () => {
  const rect = { x: 0, y: 0, w: 10, h: 10 };
  it('detects a circle overlapping the box', () => {
    expect(circleIntersectsRect(rect, 5, 5, 1)).toBe(true); // centre inside
    expect(circleIntersectsRect(rect, 12, 5, 2 * 2 + 1)).toBe(true); // just off the right edge
  });
  it('rejects a circle that cannot reach the box', () => {
    expect(circleIntersectsRect(rect, 100, 100, 4)).toBe(false);
  });
  it('accepts a circle whose edge exactly touches the box (boundary is <=, not <)', () => {
    // closest point on the rect to (12,5) is (10,5): dx=2, dy=0, distSq=4.
    // radiusSq=4 exactly means the circle's edge just reaches the box.
    expect(circleIntersectsRect(rect, 12, 5, 4)).toBe(true);
  });
});

describe('quadInsert', () => {
  it('rejects a point outside the boundary', () => {
    const node = createQuadNode({ x: 0, y: 0, w: 10, h: 10 }, QUAD_CAPACITY);
    expect(quadInsert(node, point(50, 50))).toBe(false);
    expect(node.points).toHaveLength(0);
  });

  it('keeps up to capacity points before subdividing', () => {
    const node = createQuadNode({ x: 0, y: 0, w: 100, h: 100 }, 2);
    quadInsert(node, point(10, 10));
    quadInsert(node, point(20, 20));
    expect(node.divided).toBe(false);
    expect(node.points).toHaveLength(2);
  });

  it('overflows into child quadrants past capacity', () => {
    const node = createQuadNode({ x: 0, y: 0, w: 100, h: 100 }, 2);
    quadInsert(node, point(10, 10)); // stays in node
    quadInsert(node, point(20, 20)); // stays in node (capacity 2)
    quadInsert(node, point(80, 80)); // overflow → SE child
    expect(node.divided).toBe(true);
    expect(node.se?.points).toHaveLength(1);
    expect(node.se?.points[0]).toEqual(point(80, 80));
  });

  it('subdivides into exactly four quadrants with the correct boundary rects', () => {
    const node = createQuadNode({ x: 0, y: 0, w: 100, h: 100 }, 2);
    quadInsert(node, point(10, 10));
    quadInsert(node, point(20, 20));
    quadInsert(node, point(80, 80)); // forces subdivide()
    expect(node.nw?.boundary).toEqual({ x: 0, y: 0, w: 50, h: 50 });
    expect(node.ne?.boundary).toEqual({ x: 50, y: 0, w: 50, h: 50 });
    expect(node.sw?.boundary).toEqual({ x: 0, y: 50, w: 50, h: 50 });
    expect(node.se?.boundary).toEqual({ x: 50, y: 50, w: 50, h: 50 });
  });

  it('returns true (not false) when a point is accepted by a non-first, non-last child quadrant', () => {
    // The insertion chain is `quadInsert(nw) || quadInsert(ne) || ...`. A
    // mutant that ANDs the first two terms together (`nw && ne`) makes the
    // return value wrong for any point landing in NW alone (or NE alone):
    // JS still evaluates the second operand since the first was truthy, that
    // second call correctly rejects (no side effect), so `nw && ne` is
    // false, and the point's real acceptance into `nw` gets masked by the
    // trailing `|| sw || se` also failing. The array state ends up correct
    // (inserted once, in the right place) even under the mutant — only the
    // boolean return value lies — so this must be caught via the return
    // value, not by inspecting node.points.
    const node = createQuadNode({ x: 0, y: 0, w: 100, h: 100 }, 2);
    quadInsert(node, point(10, 10));
    quadInsert(node, point(20, 20));
    quadInsert(node, point(80, 80)); // forces subdivide()
    const accepted = quadInsert(node, point(5, 5)); // squarely inside NW only
    expect(accepted).toBe(true);
    expect(node.nw?.points).toHaveLength(1);
    expect(node.ne?.points ?? []).toHaveLength(0);
  });

  it('stops subdividing at the depth cap even with coincident points', () => {
    const node = createQuadNode({ x: 0, y: 0, w: 100, h: 100 }, 1);
    // Many identical points would recurse forever without the depth guard.
    for (let i = 0; i < 40; i += 1) {
      expect(quadInsert(node, point(50, 50, i))).toBe(true);
    }
    // The deepest node must sit at the cap and hold the piled-up points.
    let maxDepthWithPile = -1;
    const visit = (n: typeof node): void => {
      if (!n.divided && n.points.length > 1) maxDepthWithPile = Math.max(maxDepthWithPile, n.depth);
      if (n.divided) [n.nw!, n.ne!, n.sw!, n.se!].forEach(visit);
    };
    visit(node);
    expect(maxDepthWithPile).toBe(QUAD_MAX_DEPTH);
  });
});

describe('quadQueryNearest', () => {
  it('returns null for an empty tree', () => {
    const tree = buildQuadtree([], 100, 100);
    expect(quadQueryNearest(tree, 50, 50, 30)).toBeNull();
  });

  it('finds the single nearest point across quadrants', () => {
    const points = [point(10, 10, 0), point(90, 12, 1), point(50, 80, 2), point(85, 85, 3)];
    const tree = buildQuadtree(points, 100, 100);
    const nearest = quadQueryNearest(tree, 88, 84, 200);
    expect(nearest?.index).toBe(3);
  });

  it('defaults to the magnetic radius when none is given', () => {
    const tree = buildQuadtree([point(30, 30, 0)], 200, 200);
    // ~42px from (60,60) → well inside the default MAGNETIC_RADIUS (170).
    expect(quadQueryNearest(tree, 60, 60)?.index).toBe(0);
  });

  it('respects the search radius', () => {
    const tree = buildQuadtree([point(0, 0, 0)], 100, 100);
    // Query point is ~70px away; a 50px radius excludes it, a 100px radius finds it.
    expect(quadQueryNearest(tree, 50, 50, 50)).toBeNull();
    expect(quadQueryNearest(tree, 50, 50, 100)?.index).toBe(0);
  });

  it('tightens its bound to pick the closer of two nearby points', () => {
    const points: QuadPoint[] = [];
    for (let i = 0; i < 20; i += 1) points.push(point((i * 5) % 100, (i * 7) % 100, i));
    points.push(point(51, 51, 999)); // deliberately closest to (50,50)
    const tree = buildQuadtree(points, 100, 100);
    expect(quadQueryNearest(tree, 50, 50, 200)?.index).toBe(999);
  });

  it('prunes quadrants that cannot beat the current best', () => {
    // Two clustered points near the query and one far away in another quadrant;
    // the far quadrant must be pruned (covered) yet the answer stays correct.
    const tree = buildQuadtree([point(48, 48, 0), point(52, 52, 1), point(99, 99, 2)], 100, 100);
    expect(quadQueryNearest(tree, 50, 50, 200)?.index).toBe(0);
  });
});
