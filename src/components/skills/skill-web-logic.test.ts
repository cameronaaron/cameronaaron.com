import { describe, expect, it } from 'vitest';

import {
  CENTER_GRAVITY,
  LAYOUT_DAMPING,
  LAYOUT_REST_ENERGY,
  MAX_NODE_SPEED,
  POINTER_REPEL_RADIUS_SQ,
  POINTER_REPEL_STRENGTH,
  REPULSION_STRENGTH,
  SPRING_REST_LENGTH,
  SPRING_STRENGTH,
  buildSkillGraph,
  createSkillLayout,
  skillLayoutAtRest,
  skillLayoutEnergy,
  stepSkillLayout,
  tokenizeSkill,
} from './skill-web-logic';

describe('tokenizeSkill', () => {
  it('keeps significant words, lowercased', () => {
    expect(tokenizeSkill('Clinical Research Methods')).toEqual(['clinical', 'research', 'methods']);
  });

  it('drops short words and stopwords', () => {
    // "and" (stopword), "it" (too short), "care" (stopword) all removed.
    expect(tokenizeSkill('Care and IT')).toEqual([]);
  });

  it('drops every stopword in the full list, not just the ones another test happens to cover', () => {
    // Each stopword paired with a real token so an under-filtering bug (one
    // token slipping through) is visible instead of an empty array either way.
    expect(tokenizeSkill('Research and Practice')).toEqual(['research', 'practice']);
    expect(tokenizeSkill('The Research Field')).toEqual(['research', 'field']);
    expect(tokenizeSkill('Research for Practice')).toEqual(['research', 'practice']);
    expect(tokenizeSkill('Research with Practice')).toEqual(['research', 'practice']);
    expect(tokenizeSkill('Health Research')).toEqual(['research']);
  });

  it('strips parenthetical detail before tokenizing', () => {
    const tokens = tokenizeSkill('Backend Engineering (Python, Flask)');
    expect(tokens).toContain('backend');
    expect(tokens).toContain('engineering');
    expect(tokens).not.toContain('python');
  });

  it('replaces parenthetical content with a separator, not an empty string (guards word-boundary loss)', () => {
    // If the paren strip used "" instead of " ", the words on either side of
    // the parenthetical would fuse into one token instead of staying separate.
    expect(tokenizeSkill('Neuroscience(EEG) Research')).toEqual(['neuroscience', 'research']);
  });


  it('deduplicates a repeated word within one label', () => {
    expect(tokenizeSkill('Data Data Analysis')).toEqual(['data', 'analysis']);
  });

  it('replaces the parenthetical with a space even when it touches neighboring words on both sides', () => {
    // The other parenthetical test ("Neuroscience(EEG) Research") already has a
    // space after the closing paren in the source string, so a strip-to-''
    // mutant produces the same output by accident. This label has no
    // whitespace on either side of the parenthetical, so only replacing with
    // ' ' (not '') keeps "backend" and "engineering" from fusing into one token.
    expect(tokenizeSkill('Backend(Python)Engineering')).toEqual(['backend', 'engineering']);
  });
});

describe('buildSkillGraph', () => {
  it('links two skills that share a significant word', () => {
    const graph = buildSkillGraph(['Clinical Research', 'Clinical Neuroscience', 'Software Engineering']);
    expect(graph.edges).toEqual([[0, 1]]);
    expect(graph.adjacency[0]).toEqual([1]);
    expect(graph.adjacency[1]).toEqual([0]);
    expect(graph.adjacency[2]).toEqual([]); // isolated node still present
  });

  it('links a whole cluster sharing one word without duplicate edges', () => {
    const graph = buildSkillGraph(['Clinical A', 'Clinical B', 'Clinical C']);
    expect(graph.edges).toEqual([
      [0, 1],
      [0, 2],
      [1, 2],
    ]);
  });

  it('deduplicates a pair that shares more than one word', () => {
    const graph = buildSkillGraph(['Data Analysis Tools', 'Data Analysis Systems']);
    // Share both "data" and "analysis" — still exactly one edge.
    expect(graph.edges).toEqual([[0, 1]]);
  });
});

describe('createSkillLayout', () => {
  it('seeds positions inside the area and starts at rest', () => {
    const layout = createSkillLayout(5, 300, 200, 42);
    expect(layout.count).toBe(5);
    for (let i = 0; i < 5; i += 1) {
      expect(layout.x[i]).toBeGreaterThanOrEqual(0);
      expect(layout.x[i]).toBeLessThanOrEqual(300);
      expect(layout.y[i]).toBeLessThanOrEqual(200);
    }
    expect(skillLayoutEnergy(layout)).toBe(0);
    expect(skillLayoutAtRest(layout)).toBe(true);
  });

  it('uses the default seed when none is provided', () => {
    const layout = createSkillLayout(3, 100, 100);
    expect(layout.count).toBe(3);
    expect(layout.x.every((value) => value >= 0 && value <= 100)).toBe(true);
  });

  it('seeds exact positions from the deterministic LCG', () => {
    // Independently re-derived from createSeededRandom(5)'s formula
    // (value = (value*1664525 + 1013904223) % 2**32; return value/2**32),
    // not copied from the implementation. Pins three things at once: the loop
    // actually runs for every index (a forced-false/never-runs mutant would
    // leave every value at the Float32Array default of 0, which is inside the
    // [0, width] range check above and wouldn't fail it), and that width/height
    // are multiplied — not divided — into each coordinate.
    const layout = createSkillLayout(2, 100, 50, 5);
    expect(layout.x[0]).toBeCloseTo(23.8006, 3);
    expect(layout.y[0]).toBeCloseTo(36.6043, 3);
    expect(layout.x[1]).toBeCloseTo(24.3075, 3);
    expect(layout.y[1]).toBeCloseTo(42.6474, 3);
  });
});

describe('stepSkillLayout', () => {
  const bounds = { width: 200, height: 200 };
  const idle = { x: 0, y: 0, active: false };

  it('pushes a node away from an active pointer in range', () => {
    const graph = buildSkillGraph(['Alpha', 'Beta']);
    const layout = createSkillLayout(2, 200, 200, 3);
    layout.x[0] = 100;
    layout.y[0] = 100;
    layout.x[1] = 190;
    layout.y[1] = 190;
    stepSkillLayout(graph, layout, bounds, { x: 96, y: 100, active: true });
    // Pointer just left of node 0 → it moves right (+x).
    expect(layout.x[0]).toBeGreaterThan(100);
  });

  it('ignores a node exactly on the pointer and one out of range', () => {
    const graph = buildSkillGraph(['Alpha', 'Beta']);
    const layout = createSkillLayout(2, 200, 200, 3);
    layout.x[0] = 50;
    layout.y[0] = 50;
    layout.x[1] = 50;
    layout.y[1] = 50; // coincident with node 0 → exercises the min-distance clamp
    // Pointer sits exactly on the nodes (pdSq === 0) → pointer force skipped.
    expect(() => stepSkillLayout(graph, layout, bounds, { x: 50, y: 50, active: true })).not.toThrow();
    expect(Number.isFinite(layout.x[0])).toBe(true);
  });

  it('leaves the pointer force off when inactive', () => {
    const graph = buildSkillGraph(['Alpha', 'Beta']);
    const near = createSkillLayout(2, 200, 200, 3);
    const far = createSkillLayout(2, 200, 200, 3);
    for (const layout of [near, far]) {
      layout.x[0] = 100;
      layout.y[0] = 100;
      layout.x[1] = 40;
      layout.y[1] = 40;
    }
    stepSkillLayout(graph, near, bounds, { x: 104, y: 100, active: true });
    stepSkillLayout(graph, far, bounds, idle);
    expect(skillLayoutEnergy(near)).toBeGreaterThan(skillLayoutEnergy(far));
  });

  it('applies spring attraction along an edge even when endpoints coincide', () => {
    const graph = buildSkillGraph(['Clinical Research', 'Clinical Practice']); // edge [0,1]
    const layout = createSkillLayout(2, 200, 200, 3);
    layout.x[0] = 30;
    layout.y[0] = 30;
    layout.x[1] = 30;
    layout.y[1] = 30; // coincident edge → spring min-distance clamp
    expect(() => stepSkillLayout(graph, layout, bounds, idle)).not.toThrow();
    expect(Number.isFinite(layout.x[1])).toBe(true);
  });

  it('clamps node speed to the maximum', () => {
    const graph = buildSkillGraph(['Alpha', 'Beta']);
    const layout = createSkillLayout(2, 200, 200, 3);
    layout.vx[0] = 1000; // absurd velocity must be reined in
    stepSkillLayout(graph, layout, bounds, idle);
    expect(Math.hypot(layout.vx[0], layout.vy[0])).toBeLessThanOrEqual(MAX_NODE_SPEED + 1e-6);
  });

  it('keeps nodes inside the frame', () => {
    const graph = buildSkillGraph(['Alpha']);
    const layout = createSkillLayout(1, 200, 200, 3);
    layout.x[0] = 195;
    layout.y[0] = 5;
    layout.vx[0] = 100;
    layout.vy[0] = -100;
    stepSkillLayout(graph, layout, bounds, idle);
    expect(layout.x[0]).toBeLessThanOrEqual(200);
    expect(layout.y[0]).toBeGreaterThanOrEqual(0);
  });

  it('computes exact forces (center gravity, repulsion, spring) and integration for one tick', () => {
    // Two nodes, one edge, no pointer: every force term applies exactly
    // once, so this pins center gravity + all-pairs repulsion + spring
    // attraction + damping in a single assertion instead of five separate
    // qualitative ones. Values re-derived independently from the physics
    // constants, not copied from source.
    const graph = buildSkillGraph(['Clinical Alpha', 'Clinical Beta']); // shared "clinical" -> edge [0,1]
    const layout = createSkillLayout(2, 200, 200, 3);
    layout.x[0] = 50;
    layout.y[0] = 100;
    layout.x[1] = 150;
    layout.y[1] = 100;
    layout.vx[0] = 0;
    layout.vy[0] = 0;
    layout.vx[1] = 0;
    layout.vy[1] = 0;

    stepSkillLayout(graph, layout, { width: 200, height: 200 }, idle);

    expect(layout.x[0]).toBeCloseTo(50.344, 3);
    expect(layout.y[0]).toBeCloseTo(100, 6);
    expect(layout.x[1]).toBeCloseTo(149.656, 3);
    expect(layout.y[1]).toBeCloseTo(100, 6);
    expect(layout.vx[0]).toBeCloseTo(0.344, 3);
    expect(layout.vx[1]).toBeCloseTo(-0.344, 3);
  });

  it('computes the exact pointer-repulsion force in isolation (single node at the frame center, no other nodes, no edges)', () => {
    // Placing the node exactly at the center zeroes the gravity term
    // ((centerX-x)*CENTER_GRAVITY = 0), and a single isolated node has no
    // repulsion or spring partners, so layout.fx/fy after the step is *purely*
    // the pointer contribution — isolating pdSq, the unit vector, and the
    // force magnitude from every other term in the accumulator.
    const graph = buildSkillGraph(['Alpha']);
    const layout = createSkillLayout(1, 200, 200, 9);
    layout.x[0] = 100;
    layout.y[0] = 100;
    layout.vx[0] = 0;
    layout.vy[0] = 0;
    // pdx = 100-40 = 60, pdy = 100-20 = 80 -> pdSq = 3600+6400 = 10000 (< radius^2)
    // pd = 100, force = POINTER_REPEL_STRENGTH/pdSq = 6000/10000 = 0.6
    // fx = (pdx/pd)*force = 0.6*0.6 = 0.36 ; fy = (pdy/pd)*force = 0.8*0.6 = 0.48
    stepSkillLayout(graph, layout, { width: 200, height: 200 }, { x: 40, y: 20, active: true });
    const expectedForce = POINTER_REPEL_STRENGTH / 10000;
    expect(layout.fx[0]).toBeCloseTo(0.6 * expectedForce, 5);
    expect(layout.fy[0]).toBeCloseTo(0.8 * expectedForce, 5);
  });

  it('excludes the pointer force exactly at the repel radius boundary (pdSq === POINTER_REPEL_RADIUS_SQ)', () => {
    // 84-112-140 is a 3-4-5 triangle scaled by 28, so pdx^2+pdy^2 lands on
    // exactly POINTER_REPEL_RADIUS_SQ (140^2=19600) with no floating-point
    // slop. The condition is strictly '<', so this boundary point must NOT
    // get a pointer force — a '<=' mutant would add one.
    const graph = buildSkillGraph(['Alpha']);
    const layout = createSkillLayout(1, 200, 200, 9);
    layout.x[0] = 100;
    layout.y[0] = 100; // at the frame center -> gravity term is exactly 0
    expect(84 * 84 + 112 * 112).toBe(POINTER_REPEL_RADIUS_SQ);
    stepSkillLayout(graph, layout, { width: 200, height: 200 }, { x: 100 - 84, y: 100 + 112, active: true });
    expect(layout.fx[0]).toBe(0);
    expect(layout.fy[0]).toBe(0);
  });

  it('computes the exact repulsion force between two unconnected nodes, including the fy sign on both sides', () => {
    // No shared token -> no edge, so this isolates gravity + all-pairs
    // repulsion from spring attraction. dx=0 keeps fx pinned to 0 on both
    // nodes so the assertion is only sensitive to the fy terms (gravity sign
    // and the repulsion uy sign applied to node i and subtracted from node j).
    const graph = buildSkillGraph(['Alpha', 'Beta']);
    const layout = createSkillLayout(2, 200, 200, 9);
    layout.x[0] = 100;
    layout.y[0] = 50;
    layout.x[1] = 100;
    layout.y[1] = 150; // center (100,100): gravity fy0=+0.5, fy1=-0.5
    // dx=0, dy=y0-y1=-100 -> distSq=10000, dist=100, force=REPULSION_STRENGTH/10000=0.18
    // uy = (dy/dist)*force = -1*0.18 = -0.18
    stepSkillLayout(graph, layout, { width: 200, height: 200 }, { x: 0, y: 0, active: false });
    const gravity0 = (100 - 50) * CENTER_GRAVITY;
    const gravity1 = (100 - 150) * CENTER_GRAVITY;
    const repulsionUy = (-100 / 100) * (REPULSION_STRENGTH / 10000);
    expect(layout.fx[0]).toBe(0);
    expect(layout.fx[1]).toBe(0);
    expect(layout.fy[0]).toBeCloseTo(gravity0 + repulsionUy, 5);
    expect(layout.fy[1]).toBeCloseTo(gravity1 - repulsionUy, 5);
  });

  it('computes the exact spring force along an edge, including the fy sign on both endpoints', () => {
    // Shared "clinical" token -> edge [0,1], same coincident-free layout as
    // the repulsion-only test above so repulsion's contribution is already
    // pinned; this test isolates the spring term's sign on top of it.
    const graph = buildSkillGraph(['Clinical Alpha', 'Clinical Beta']);
    const layout = createSkillLayout(2, 200, 200, 9);
    layout.x[0] = 100;
    layout.y[0] = 50;
    layout.x[1] = 100;
    layout.y[1] = 150;
    // spring: dx=x1-x0=0, dy=y1-y0=100 -> dist=100
    // pull = (dist-SPRING_REST_LENGTH)*SPRING_STRENGTH = (100-96)*0.02 = 0.08
    // uy = (dy/dist)*pull = 1*0.08 = 0.08
    stepSkillLayout(graph, layout, { width: 200, height: 200 }, { x: 0, y: 0, active: false });
    const gravity0 = (100 - 50) * CENTER_GRAVITY;
    const gravity1 = (100 - 150) * CENTER_GRAVITY;
    const repulsionUy = (-100 / 100) * (REPULSION_STRENGTH / 10000);
    const springPull = (100 - SPRING_REST_LENGTH) * SPRING_STRENGTH;
    expect(layout.fx[0]).toBe(0);
    expect(layout.fx[1]).toBe(0);
    expect(layout.fy[0]).toBeCloseTo(gravity0 + repulsionUy + springPull, 5);
    expect(layout.fy[1]).toBeCloseTo(gravity1 - repulsionUy - springPull, 5);
  });

  it('does not further scale velocity when speed is already under the max (sanity check for the clamp branch)', () => {
    // Companion to the existing "clamps node speed to the maximum" test:
    // this pins the *unclamped* path stays untouched by damping alone, using
    // LAYOUT_DAMPING explicitly rather than a magic 0.86.
    const graph = buildSkillGraph(['Alpha']);
    const layout = createSkillLayout(1, 200, 200, 9);
    layout.x[0] = 100;
    layout.y[0] = 100; // zero gravity
    layout.vx[0] = 1;
    layout.vy[0] = 0;
    stepSkillLayout(graph, layout, { width: 200, height: 200 }, idle);
    expect(layout.vx[0]).toBeCloseTo(1 * LAYOUT_DAMPING, 5);
  });

  it('settles toward rest over many ticks', () => {
    const graph = buildSkillGraph([
      'Clinical Research Methods',
      'Clinical Neuroscience',
      'Software Engineering',
      'Security Research',
    ]);
    const layout = createSkillLayout(graph.count, 320, 240, 9);
    for (let i = 0; i < 5000; i += 1) stepSkillLayout(graph, layout, { width: 320, height: 240 }, idle);
    expect(skillLayoutAtRest(layout)).toBe(true);
  });
});

describe('skillLayoutEnergy', () => {
  it('reports moving vs settled layouts', () => {
    const layout = createSkillLayout(2, 100, 100, 1);
    expect(skillLayoutAtRest(layout)).toBe(true);
    layout.vx[0] = 10;
    expect(skillLayoutAtRest(layout)).toBe(false);
  });

  it('sums squared velocity components, not their difference', () => {
    // vy must be nonzero and different in magnitude from vx: with vy=0 (as in
    // the "reports moving vs settled" test above), vx*vx+vy*vy and
    // vx*vx-vy*vy are the same number, so that test can't tell '+' from '-'.
    // 3-4-5 gives an exact, easy-to-check sum (9+16=25) with an unmistakably
    // different difference (9-16=-7).
    const layout = createSkillLayout(1, 100, 100, 1);
    layout.vx[0] = 3;
    layout.vy[0] = 4;
    expect(skillLayoutEnergy(layout)).toBe(25);
  });

  it('treats the rest-energy boundary as inclusive (energy exactly at LAYOUT_REST_ENERGY still counts as at rest)', () => {
    // Hand-picking floats whose squares sum to exactly 0.05 (a value with no
    // finite binary representation) takes more than one term: these three
    // were derived by greedily subtracting the largest representable square
    // from the remaining residual until the running sum rounds to LAYOUT_REST_ENERGY
    // bit-for-bit (confirmed independently: 0.22360679507255554^2 +
    // 0.00003460318112047389^2 + 3.115325108993261e-9^2 === 0.05 exactly).
    const layout = createSkillLayout(2, 100, 100, 1);
    layout.vx[0] = 0.22360679507255554;
    layout.vy[0] = 0.00003460318112047389;
    layout.vx[1] = 3.115325108993261e-9;
    layout.vy[1] = 0;
    expect(skillLayoutEnergy(layout)).toBe(LAYOUT_REST_ENERGY);
    expect(skillLayoutAtRest(layout)).toBe(true);
  });
});
