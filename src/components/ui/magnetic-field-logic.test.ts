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
