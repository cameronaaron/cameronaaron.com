import { describe, expect, it } from 'vitest';

import {
  GROUP_LABELS,
  INITIAL_CHAIN,
  LINKS,
  PEOPLE,
  ROUNDS,
  buildChainLinkKeys,
  createChain,
  extendChain,
  formatPath,
  getGroupFillClass,
  getLinkClassName,
  getLinkDash,
  getMutualityNote,
  getResultText,
  hops,
  isComplete,
  linkKey,
  neighbors,
  nextChoices,
  shortestPath,
  targetOf,
  undoStep,
} from './small-world-logic';

const areLinked = (a: number, b: number, mutualOnly: boolean) => neighbors(a, mutualOnly).includes(b);

/** Reference BFS over an explicit edge list — the instrument the real one is checked against. */
function referenceDistance(start: number, target: number, mutualOnly: boolean): number | null {
  const distance = new Map<number, number>([[start, 0]]);
  let frontier = [start];
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const person of frontier) {
      for (const [a, b, direction] of LINKS) {
        if (mutualOnly && direction !== 3) continue;
        const other = a === person ? b : b === person ? a : -1;
        if (other === -1 || distance.has(other)) continue;
        distance.set(other, distance.get(person)! + 1);
        next.push(other);
      }
    }
    frontier = next;
  }
  return distance.get(target) ?? null;
}

describe('the network', () => {
  it('pins people, groups, and links', () => {
    expect(PEOPLE.map((p) => `${p.name}:${p.group}`)).toEqual([
      'Ana:climbing', 'Bo:climbing', 'Cleo:climbing', 'Dev:climbing', 'Emi:climbing',
      'Fin:nursing', 'Gia:nursing', 'Hugo:nursing', 'Iris:nursing', 'Jun:nursing', 'Kai:nursing',
      'Lia:band', 'Max:band', 'Nia:band', 'Oz:band', 'Pia:band',
    ]);
    expect(GROUP_LABELS).toEqual({ climbing: 'Climbing gym', nursing: 'Nursing cohort', band: 'Weekend band' });
    expect(LINKS).toHaveLength(26);
    expect(LINKS.filter(([, , d]) => d !== 3)).toHaveLength(6);
  });

  it('treats links as undirected for reachability and filters one-way ones on request', () => {
    expect(neighbors(0, false)).toEqual([1, 2, 4]);
    expect(neighbors(0, true)).toEqual([1, 2]);
    expect(neighbors(3, false)).toEqual([1, 2, 4, 5]);
    expect(areLinked(4, 0, false)).toBe(true);
    expect(areLinked(4, 0, true)).toBe(false);
    expect(areLinked(0, 15, false)).toBe(false);
  });
});

describe('BFS', () => {
  it('matches a reference BFS for every pair, with and without one-way links', () => {
    for (let start = 0; start < PEOPLE.length; start += 1) {
      for (let target = 0; target < PEOPLE.length; target += 1) {
        for (const mutualOnly of [false, true]) {
          const path = shortestPath(start, target, mutualOnly);
          const expected = referenceDistance(start, target, mutualOnly);
          expect(path === null ? null : hops(path)).toBe(expected);
          if (path === null) continue;
          expect(path[0]).toBe(start);
          expect(path[path.length - 1]).toBe(target);
          for (let i = 1; i < path.length; i += 1) expect(areLinked(path[i - 1], path[i], mutualOnly)).toBe(true);
        }
      }
    }
  });

  it('keeps everyone reachable on confirmed mutual links alone', () => {
    for (let target = 0; target < PEOPLE.length; target += 1) expect(shortestPath(0, target, true)).not.toBeNull();
  });

  it('finds the specific chains the rounds are built around', () => {
    expect(formatPath(shortestPath(0, 15, false)!)).toBe('Ana → Emi → Oz → Pia');
    expect(hops(shortestPath(0, 15, true)!)).toBe(7);
    expect(formatPath(shortestPath(6, 0, false)!)).toBe('Gia → Hugo → Cleo → Ana');
    expect(shortestPath(4, 4, true)).toEqual([4]);
  });
});

describe('rounds and chains', () => {
  it('crosses friend groups every round', () => {
    expect(ROUNDS).toEqual([[0, 15], [6, 0], [11, 3], [1, 13]]);
    for (const [start, target] of ROUNDS) expect(PEOPLE[start].group).not.toBe(PEOPLE[target].group);
  });

  it('starts at the round’s first person', () => {
    expect(INITIAL_CHAIN).toEqual({ round: 0, mutualOnly: false, chain: [0] });
    expect(createChain(5, true)).toEqual({ round: 5, mutualOnly: true, chain: [6] });
    expect(targetOf(createChain(2, false))).toBe(3);
  });

  it('only extends to unvisited people linked to the chain’s end', () => {
    expect(nextChoices(INITIAL_CHAIN)).toEqual([1, 2, 4]);
    expect(nextChoices(createChain(0, true))).toEqual([1, 2]);
    const one = extendChain(INITIAL_CHAIN, 2);
    expect(one.chain).toEqual([0, 2]);
    expect(nextChoices(one)).toEqual([1, 3, 7]);
    expect(extendChain(one, 0)).toBe(one);
    expect(extendChain(one, 15)).toBe(one);
  });

  it('undoes one step and never past the start', () => {
    const two = extendChain(extendChain(INITIAL_CHAIN, 4), 14);
    expect(undoStep(two).chain).toEqual([0, 4]);
    expect(undoStep(INITIAL_CHAIN)).toBe(INITIAL_CHAIN);
  });

  it('completes on the target and then offers nothing more', () => {
    const done = extendChain(extendChain(extendChain(INITIAL_CHAIN, 4), 14), 15);
    expect(isComplete(done)).toBe(true);
    expect(nextChoices(done)).toEqual([]);
    expect(isComplete(INITIAL_CHAIN)).toBe(false);
  });
});

describe('feedback', () => {
  it('confirms an optimal chain and shows BFS’s for a longer one', () => {
    const optimal = extendChain(extendChain(extendChain(INITIAL_CHAIN, 4), 14), 15);
    expect(getResultText(optimal)).toBe('3 hops — as short as BFS finds.');
    let long = INITIAL_CHAIN;
    for (const person of [1, 3, 4, 14, 15]) long = extendChain(long, person);
    expect(getResultText(long)).toBe('5 hops. BFS finds 3: Ana → Emi → Oz → Pia.');
    expect(getResultText(INITIAL_CHAIN)).toBe('');
  });

  it('says how much the shortest chain leans on unconfirmed links', () => {
    expect(getMutualityNote(0, 15)).toBe(
      'With every observed link it is 3 hops; with confirmed mutual links only it is 7. ' +
        'The short chain leans on links seen in one direction — possibly just a truncated followers page.'
    );
    expect(getMutualityNote(6, 0)).toBeNull();
  });
});

describe('presentation', () => {
  it('keys links order-independently and marks those the chain walks', () => {
    expect(linkKey(3, 9)).toBe('3-9');
    expect(linkKey(9, 3)).toBe('3-9');
    expect([...buildChainLinkKeys([0, 4, 14])]).toEqual(['0-4', '4-14']);
    expect(buildChainLinkKeys([0]).size).toBe(0);
  });

  it('styles links by confirmation and chain membership', () => {
    expect(getLinkClassName(3, true)).toBe('stroke-cyan-300');
    expect(getLinkClassName(3, false)).toBe('stroke-white/30');
    expect(getLinkClassName(1, false)).toBe('stroke-white/25');
    expect(getLinkDash(3)).toBeUndefined();
    expect(getLinkDash(2)).toBe('1.5 1.2');
    expect(getGroupFillClass('climbing')).toBe('fill-cyan-400/70');
    expect(getGroupFillClass('nursing')).toBe('fill-violet-400/70');
    expect(getGroupFillClass('band')).toBe('fill-amber-400/70');
  });
});
