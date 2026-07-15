import { describe, expect, it } from 'vitest';

import {
  MAX_NODE_SPEED,
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

  it('strips parenthetical detail before tokenizing', () => {
    const tokens = tokenizeSkill('Backend Engineering (Python, Flask)');
    expect(tokens).toContain('backend');
    expect(tokens).toContain('engineering');
    expect(tokens).not.toContain('python');
  });

  it('deduplicates a repeated word within one label', () => {
    expect(tokenizeSkill('Data Data Analysis')).toEqual(['data', 'analysis']);
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
});
