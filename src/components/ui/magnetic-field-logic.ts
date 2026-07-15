/**
 * Quadtree spatial index for cursor→element magnetic targeting.
 *
 * The cursor needs the nearest interactive element on every pointer move. A
 * linear scan is O(n) per move; a quadtree answers the same query in O(log n)
 * average by pruning whole quadrants that cannot contain a closer point than
 * the current best. The tree is rebuilt only when the layout changes (mount /
 * resize), never per move — the per-event cost is the query alone. All distance
 * comparisons are squared, so the hot path never calls Math.sqrt.
 */

/** Points per node before it subdivides. */
export const QUAD_CAPACITY = 2;

/** Subdivision depth cap — bounds recursion even with coincident points. */
export const QUAD_MAX_DEPTH = 8;

/** How close the cursor must be (px) for an element to magnetise. */
export const MAGNETIC_RADIUS = 170;

/** Radius of the highlight ring drawn around the magnetised element. */
export const MAGNETIC_RING_RADIUS = 26;

export interface QuadPoint {
  x: number;
  y: number;
  /** Index back into the caller's element list. */
  index: number;
}

/** Axis-aligned rectangle: (x,y) top-left, w×h size. */
export interface QuadRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface QuadNode {
  boundary: QuadRect;
  capacity: number;
  depth: number;
  points: QuadPoint[];
  divided: boolean;
  nw: QuadNode | null;
  ne: QuadNode | null;
  sw: QuadNode | null;
  se: QuadNode | null;
}

export function createQuadNode(boundary: QuadRect, capacity: number, depth = 0): QuadNode {
  return { boundary, capacity, depth, points: [], divided: false, nw: null, ne: null, sw: null, se: null };
}

/** Inclusive containment so points on a shared edge are never dropped. */
export function rectContains(rect: QuadRect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** Squared distance from (cx,cy) to the nearest point of `rect`, vs `radiusSq`. */
export function circleIntersectsRect(rect: QuadRect, cx: number, cy: number, radiusSq: number): boolean {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= radiusSq;
}

function subdivide(node: QuadNode): void {
  const { x, y, w, h } = node.boundary;
  const halfW = w / 2;
  const halfH = h / 2;
  const childDepth = node.depth + 1;
  node.nw = createQuadNode({ x, y, w: halfW, h: halfH }, node.capacity, childDepth);
  node.ne = createQuadNode({ x: x + halfW, y, w: halfW, h: halfH }, node.capacity, childDepth);
  node.sw = createQuadNode({ x, y: y + halfH, w: halfW, h: halfH }, node.capacity, childDepth);
  node.se = createQuadNode({ x: x + halfW, y: y + halfH, w: halfW, h: halfH }, node.capacity, childDepth);
  node.divided = true;
}

/**
 * Insert a point: kept in this node until it holds `capacity`, then overflow
 * flows to whichever child accepts it. At the depth cap the node just keeps
 * piling points (no infinite subdivision on coincident coordinates).
 */
export function quadInsert(node: QuadNode, point: QuadPoint): boolean {
  if (!rectContains(node.boundary, point.x, point.y)) return false;
  if (node.points.length < node.capacity || node.depth >= QUAD_MAX_DEPTH) {
    node.points.push(point);
    return true;
  }
  if (!node.divided) subdivide(node);
  return (
    quadInsert(node.nw!, point) ||
    quadInsert(node.ne!, point) ||
    quadInsert(node.sw!, point) ||
    quadInsert(node.se!, point)
  );
}

/** Build a quadtree over `points` spanning a width×height area. */
export function buildQuadtree(points: QuadPoint[], width: number, height: number): QuadNode {
  const root = createQuadNode({ x: 0, y: 0, w: width, h: height }, QUAD_CAPACITY);
  for (const point of points) quadInsert(root, point);
  return root;
}

interface NearestBest {
  point: QuadPoint | null;
  distSq: number;
}

function searchNearest(node: QuadNode, qx: number, qy: number, best: NearestBest): void {
  // Prune: if the best-so-far circle can't reach this node's box, skip it.
  if (!circleIntersectsRect(node.boundary, qx, qy, best.distSq)) return;
  for (const point of node.points) {
    const dx = point.x - qx;
    const dy = point.y - qy;
    const distSq = dx * dx + dy * dy;
    if (distSq < best.distSq) {
      best.distSq = distSq;
      best.point = point;
    }
  }
  if (node.divided) {
    searchNearest(node.nw!, qx, qy, best);
    searchNearest(node.ne!, qx, qy, best);
    searchNearest(node.sw!, qx, qy, best);
    searchNearest(node.se!, qx, qy, best);
  }
}

/**
 * Nearest point to (qx,qy) within `radius`, or null if none is in range.
 * `best.distSq` starts at radius² and only shrinks, so the search tightens its
 * own pruning bound as it finds closer candidates.
 */
export function quadQueryNearest(
  root: QuadNode,
  qx: number,
  qy: number,
  radius = MAGNETIC_RADIUS
): QuadPoint | null {
  const best: NearestBest = { point: null, distSq: radius * radius };
  searchNearest(root, qx, qy, best);
  return best.point;
}
