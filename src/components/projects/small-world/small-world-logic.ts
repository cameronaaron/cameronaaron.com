/**
 * "Shortest Chain" — paired with the social-graph crawler and network map.
 *
 * Two things from that project, both taken from its code and notes:
 *
 *  1. Its tour mode does not jump between friend groups — it finds the real
 *     shortest path between two communities by breadth-first search and walks
 *     every intermediary on it. The player builds that chain by hand here and
 *     is scored against BFS.
 *
 *  2. Its hardest-won lesson is about what an edge means. A link is recorded
 *     with a direction — 1 (they follow the candidate), 2 (the candidate
 *     follows them), 3 (both) — and the project's notes warn that only 3 is
 *     positive evidence of mutuality: the `followers` endpoint is the one that
 *     gets capped and soft-blocked, so a one-way link may simply be the other
 *     direction going unobserved. The "confirmed mutual only" toggle re-runs
 *     the search on 3s alone, which is how the short chains a visitor finds
 *     first turn out to lean on links nobody has confirmed.
 *
 * The network is a small fixed catalog in three friend groups (no real
 * accounts). Adjacency is built once at module load in O(V + E); BFS is
 * O(V + E) per query and exits as soon as it reaches the target.
 */

export type GroupId = 'climbing' | 'nursing' | 'band';

/** 1 = they follow the other person, 2 = the reverse, 3 = both directions observed. */
export type Direction = 1 | 2 | 3;

export interface Person {
  name: string;
  group: GroupId;
  x: number;
  y: number;
}

export const GROUP_LABELS: Record<GroupId, string> = {
  climbing: 'Climbing gym',
  nursing: 'Nursing cohort',
  band: 'Weekend band',
};

export const PEOPLE: readonly Person[] = [
  { name: 'Ana', group: 'climbing', x: 10, y: 14 },
  { name: 'Bo', group: 'climbing', x: 22, y: 6 },
  { name: 'Cleo', group: 'climbing', x: 26, y: 22 },
  { name: 'Dev', group: 'climbing', x: 14, y: 32 },
  { name: 'Emi', group: 'climbing', x: 6, y: 46 },
  { name: 'Fin', group: 'nursing', x: 38, y: 40 },
  { name: 'Gia', group: 'nursing', x: 46, y: 26 },
  { name: 'Hugo', group: 'nursing', x: 44, y: 12 },
  { name: 'Iris', group: 'nursing', x: 56, y: 42 },
  { name: 'Jun', group: 'nursing', x: 60, y: 18 },
  { name: 'Kai', group: 'nursing', x: 66, y: 32 },
  { name: 'Lia', group: 'band', x: 78, y: 26 },
  { name: 'Max', group: 'band', x: 78, y: 10 },
  { name: 'Nia', group: 'band', x: 90, y: 20 },
  { name: 'Oz', group: 'band', x: 82, y: 46 },
  { name: 'Pia', group: 'band', x: 94, y: 38 },
];

/** [personA, personB, direction]. Cross-group links are the bridges. */
export const LINKS: readonly (readonly [number, number, Direction])[] = [
  [0, 1, 3],
  [0, 2, 3],
  [1, 2, 3],
  [1, 3, 3],
  [2, 3, 1],
  [3, 4, 3],
  [0, 4, 2],
  [5, 6, 3],
  [5, 7, 3],
  [6, 7, 3],
  [6, 8, 3],
  [7, 9, 3],
  [8, 9, 1],
  [8, 10, 3],
  [9, 10, 3],
  [11, 12, 3],
  [11, 13, 3],
  [12, 13, 3],
  [12, 14, 3],
  [13, 15, 3],
  [14, 15, 3],
  [3, 5, 2],
  [2, 7, 3],
  [10, 11, 3],
  [9, 12, 1],
  [4, 14, 2],
];

interface Neighbor {
  person: number;
  mutual: boolean;
}

/** Adjacency lists, built once: O(V + E). */
const ADJACENCY: Neighbor[][] = (() => {
  const adjacency: Neighbor[][] = PEOPLE.map(() => []);
  for (const [a, b, direction] of LINKS) {
    const mutual = direction === 3;
    adjacency[a].push({ person: b, mutual });
    adjacency[b].push({ person: a, mutual });
  }
  return adjacency;
})();

export function neighbors(person: number, mutualOnly: boolean): number[] {
  const result: number[] = [];
  for (const neighbor of ADJACENCY[person]) {
    if (!mutualOnly || neighbor.mutual) result.push(neighbor.person);
  }
  return result;
}

/**
 * Breadth-first shortest path from `start` to `target`, or null when none
 * exists. Index-pointer queue (no shift), parent array, early exit on
 * discovery.
 */
export function shortestPath(start: number, target: number, mutualOnly: boolean): number[] | null {
  if (start === target) return [start];
  const parent = new Array<number>(PEOPLE.length).fill(-1);
  parent[start] = start;
  const queue = [start];
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    for (const next of neighbors(current, mutualOnly)) {
      if (parent[next] !== -1) continue;
      parent[next] = current;
      if (next === target) {
        const path = [target];
        for (let step = current; step !== start; step = parent[step]) path.push(step);
        path.push(start);
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}

/** Each round crosses from one friend group to another. */
export const ROUNDS: readonly (readonly [number, number])[] = [
  [0, 15],
  [6, 0],
  [11, 3],
  [1, 13],
];

export interface ChainState {
  round: number;
  mutualOnly: boolean;
  chain: number[];
}

export function createChain(round: number, mutualOnly: boolean): ChainState {
  return { round, mutualOnly, chain: [ROUNDS[round % ROUNDS.length][0]] };
}

export const INITIAL_CHAIN: ChainState = createChain(0, false);

export function targetOf(state: ChainState): number {
  return ROUNDS[state.round % ROUNDS.length][1];
}

export function isComplete(state: ChainState): boolean {
  return state.chain[state.chain.length - 1] === targetOf(state);
}

/** People the chain can extend to: linked to its end and not already on it. */
export function nextChoices(state: ChainState): number[] {
  if (isComplete(state)) return [];
  const onChain = new Set(state.chain);
  const result: number[] = [];
  for (const person of neighbors(state.chain[state.chain.length - 1], state.mutualOnly)) {
    if (!onChain.has(person)) result.push(person);
  }
  return result;
}

export function extendChain(state: ChainState, person: number): ChainState {
  if (!nextChoices(state).includes(person)) return state;
  return { ...state, chain: [...state.chain, person] };
}

export function undoStep(state: ChainState): ChainState {
  if (state.chain.length <= 1) return state;
  return { ...state, chain: state.chain.slice(0, -1) };
}

export function hops(path: readonly number[]): number {
  return path.length - 1;
}

export function formatPath(path: readonly number[]): string {
  return path.map((person) => PEOPLE[person].name).join(' → ');
}

/** Feedback once the chain reaches its target. */
export function getResultText(state: ChainState): string {
  if (!isComplete(state)) return '';
  const best = shortestPath(state.chain[0], targetOf(state), state.mutualOnly)!;
  const mine = hops(state.chain);
  const verdict =
    mine === hops(best)
      ? `${mine} hops — as short as BFS finds.`
      : `${mine} hops. BFS finds ${hops(best)}: ${formatPath(best)}.`;
  return verdict;
}

/**
 * How much the shortest chain depends on links seen in one direction only.
 * Null when both searches agree. The confirmed-mutual graph is connected
 * (pinned by a test), so both searches always find a path.
 */
export function getMutualityNote(start: number, target: number): string | null {
  const any = shortestPath(start, target, false)!;
  const confirmed = shortestPath(start, target, true)!;
  if (hops(confirmed) === hops(any)) return null;
  return (
    `With every observed link it is ${hops(any)} hops; with confirmed mutual links only it is ${hops(confirmed)}. ` +
    'The short chain leans on links seen in one direction — possibly just a truncated followers page.'
  );
}

export function getLinkClassName(direction: Direction, onChain: boolean): string {
  if (onChain) return 'stroke-cyan-300';
  return direction === 3 ? 'stroke-white/30' : 'stroke-white/25';
}

export function getLinkDash(direction: Direction): string | undefined {
  return direction === 3 ? undefined : '1.5 1.2';
}

export function getGroupFillClass(group: GroupId): string {
  if (group === 'climbing') return 'fill-cyan-400/70';
  if (group === 'nursing') return 'fill-violet-400/70';
  return 'fill-amber-400/70';
}

/** Order-independent key for the link between two people. */
export function linkKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/** Keys of every link the chain walks — built once per chain, then O(1) per link. */
export function buildChainLinkKeys(chain: readonly number[]): Set<string> {
  const keys = new Set<string>();
  for (let index = 1; index < chain.length; index += 1) keys.add(linkKey(chain[index - 1], chain[index]));
  return keys;
}
