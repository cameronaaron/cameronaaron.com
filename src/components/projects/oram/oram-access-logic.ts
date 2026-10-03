import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';

/**
 * "Whose Record Was Read?" — paired with novachannel.
 *
 * novachannel's ORAM crate exists for one sentence in its own docs: even
 * through end-to-end encryption, a server that sees "record #4821 was read"
 * has narrowed the sender to whoever owns record #4821. Path ORAM (Stefanov et
 * al., CCS 2013) closes that by making the sequence of storage locations
 * touched independent of which record was accessed.
 *
 * The player IS the server. Each round one of eight users reads their own
 * record, and the player sees only what storage sees, then guesses who it
 * was. With plain storage the answer is on screen. With Path ORAM the player
 * watches a root-to-leaf path light up and is reduced to chance (1 in 8),
 * however clever they are, because the path belongs to a leaf the record was
 * mapped to uniformly at random on its previous access and remapped the
 * instant it was read.
 *
 * The ORAM below is the real algorithm, not an animation of it: a position
 * map, a client stash, a binary tree of buckets holding up to Z blocks, and
 * greedy deepest-first eviction back down the path just read. The cost is
 * shown too — every access touches log2(N) + 1 buckets, which novachannel's
 * docs note is a proven lower bound (Goldreich–Ostrovsky), not a gap to close.
 *
 * Randomness comes from the shared seeded PRNG, carried as a number in state,
 * so the first round is identical on server and client (CLAUDE.md #10).
 */

export const RECORD_COUNT = 8;
export const TREE_HEIGHT = 3;
export const LEAF_COUNT = 2 ** TREE_HEIGHT;
/** Heap layout: node 1 is the root, node i has children 2i and 2i+1. */
export const FIRST_LEAF_NODE = LEAF_COUNT;
export const NODE_COUNT = 2 * LEAF_COUNT - 1;
export const BUCKET_CAPACITY = 4;
export const USER_NAMES = ['Ada', 'Ben', 'Cy', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal'] as const;
export const CHANCE_PERCENT = 100 / RECORD_COUNT;
export const INITIAL_SEED = 4821;

export interface OramState {
  /** position[record] = the leaf that record is currently mapped to. */
  position: number[];
  /** buckets[node] for node 1..NODE_COUNT; index 0 is unused. */
  buckets: number[][];
  stash: number[];
}

/** Nodes on the path to `leaf`, root first. */
export function pathNodes(leaf: number): number[] {
  const nodes: number[] = [];
  for (let node = FIRST_LEAF_NODE + leaf; node >= 1; node >>= 1) nodes.push(node);
  return nodes.reverse();
}

export function nodeDepth(node: number): number {
  return Math.floor(Math.log2(node));
}

/** Whether `node` lies on the root-to-leaf path of `leaf`. */
export function isOnPath(node: number, leaf: number): boolean {
  return (FIRST_LEAF_NODE + leaf) >> (TREE_HEIGHT - nodeDepth(node)) === node;
}

function nextSeed(random: () => number): number {
  return Math.floor(random() * 2 ** 31);
}

function randomLeaf(random: () => number): number {
  return Math.floor(random() * LEAF_COUNT);
}

/**
 * Moves every stash block that may live in `node` into it, up to capacity.
 * Single pass with in-place compaction of the stash (no intermediate array).
 */
function evictInto(state: OramState, node: number): void {
  const bucket = state.buckets[node];
  let write = 0;
  for (const block of state.stash) {
    if (bucket.length < BUCKET_CAPACITY && isOnPath(node, state.position[block])) {
      bucket.push(block);
    } else {
      state.stash[write] = block;
      write += 1;
    }
  }
  state.stash.length = write;
}

/**
 * Every record mapped to a random leaf, then placed deepest-first: all leaf
 * buckets fill before any parent does. (Evicting one whole path at a time
 * instead parks other leaves' blocks in shared ancestors — the root held two
 * blocks whose own leaves were empty — so placement goes level by level.)
 */
export function createOram(seed: number): OramState {
  const random = createSeededRandom(seed);
  const state: OramState = { position: [], buckets: [[]], stash: [] };
  for (let node = 1; node <= NODE_COUNT; node += 1) state.buckets.push([]);
  for (let record = 0; record < RECORD_COUNT; record += 1) {
    state.position.push(randomLeaf(random));
    state.stash.push(record);
  }
  for (let node = NODE_COUNT; node >= 1; node -= 1) evictInto(state, node);
  return state;
}

export interface AccessResult {
  state: OramState;
  /** The leaf whose path storage saw being read and rewritten. */
  observedLeaf: number;
}

/**
 * One Path ORAM access to `record`: remap it to a fresh random leaf, read the
 * whole path to its OLD leaf into the stash, then write that path back
 * deepest bucket first. Returns a new state; the input is not mutated.
 */
export function accessRecord(previous: OramState, record: number, random: () => number): AccessResult {
  const state: OramState = {
    position: [...previous.position],
    buckets: previous.buckets.map((bucket) => [...bucket]),
    stash: [...previous.stash],
  };
  const observedLeaf = state.position[record];
  state.position[record] = randomLeaf(random);
  const path = pathNodes(observedLeaf);
  for (const node of path) {
    for (const block of state.buckets[node]) state.stash.push(block);
    state.buckets[node] = [];
  }
  for (let index = path.length - 1; index >= 0; index -= 1) evictInto(state, path[index]);
  return { state, observedLeaf };
}

export type StorageMode = 'plain' | 'oram';

export type Observation = { mode: 'plain'; slot: number } | { mode: 'oram'; leaf: number; nodes: number[] };

export interface ModeStats {
  correct: number;
  total: number;
}

export interface GameState {
  mode: StorageMode;
  seed: number;
  oram: OramState;
  reader: number;
  observation: Observation;
  guess: number | null;
  stats: Record<StorageMode, ModeStats>;
}

/** Picks the next reader and performs their read in the current mode. */
export function startRound(state: GameState): GameState {
  const random = createSeededRandom(state.seed);
  const reader = Math.floor(random() * RECORD_COUNT);
  if (state.mode === 'plain') {
    return { ...state, seed: nextSeed(random), reader, observation: { mode: 'plain', slot: reader }, guess: null };
  }
  const { state: oram, observedLeaf } = accessRecord(state.oram, reader, random);
  return {
    ...state,
    seed: nextSeed(random),
    oram,
    reader,
    observation: { mode: 'oram', leaf: observedLeaf, nodes: pathNodes(observedLeaf) },
    guess: null,
  };
}

export const EMPTY_STATS: Record<StorageMode, ModeStats> = {
  plain: { correct: 0, total: 0 },
  oram: { correct: 0, total: 0 },
};

export function createGame(mode: StorageMode = 'oram', seed: number = INITIAL_SEED): GameState {
  const placeholder: GameState = {
    mode,
    seed,
    oram: createOram(seed),
    reader: 0,
    observation: { mode: 'plain', slot: 0 },
    guess: null,
    stats: EMPTY_STATS,
  };
  return startRound(placeholder);
}

export function submitGuess(state: GameState, user: number): GameState {
  if (state.guess !== null) return state;
  const current = state.stats[state.mode];
  const correct = user === state.reader ? 1 : 0;
  return {
    ...state,
    guess: user,
    stats: { ...state.stats, [state.mode]: { correct: current.correct + correct, total: current.total + 1 } },
  };
}

export function switchMode(state: GameState, mode: StorageMode): GameState {
  if (mode === state.mode) return state;
  return startRound({ ...state, mode });
}

export function accuracyPercent(stats: ModeStats): number | null {
  return stats.total === 0 ? null : Math.round((stats.correct / stats.total) * 100);
}

/** Storage slots a read touched: one record, or every block slot on a path. */
export function slotsTouched(observation: Observation): number {
  return observation.mode === 'plain' ? 1 : observation.nodes.length * BUCKET_CAPACITY;
}

export function getObservationText(observation: Observation): string {
  if (observation.mode === 'plain') {
    return `Storage saw slot ${observation.slot + 1} read. One slot, and it belongs to exactly one user.`;
  }
  return (
    `Storage saw the path to leaf ${observation.leaf + 1} read and rewritten: ` +
    `${observation.nodes.length} buckets, ${slotsTouched(observation)} slots, every one re-encrypted.`
  );
}

export function getResultText(state: GameState): string {
  if (state.guess === null) return '';
  const reader = USER_NAMES[state.reader];
  if (state.guess === state.reader) {
    return state.mode === 'plain'
      ? `Right — it was ${reader}. Encryption hid the contents, not whose record it was.`
      : `Right — it was ${reader}. A lucky guess: that path said nothing about who read it.`;
  }
  return state.mode === 'plain'
    ? `It was ${reader}. Look at which slot lit up — plain storage tells you every time.`
    : `It was ${reader}. Their record now sits under a new random leaf, so next time looks different again.`;
}

export function getAccuracyText(mode: StorageMode, stats: ModeStats): string {
  const accuracy = accuracyPercent(stats);
  if (accuracy === null) return 'No guesses yet';
  const chance = mode === 'oram' ? ` · chance is ${CHANCE_PERCENT}%` : '';
  return `${stats.correct}/${stats.total} right (${accuracy}%)${chance}`;
}

export type NodeVisualState = 'idle' | 'touched';

export function getNodeVisualState(node: number, observation: Observation): NodeVisualState {
  return observation.mode === 'oram' && isOnPath(node, observation.leaf) ? 'touched' : 'idle';
}

/** SVG centre of a bucket node in a 0–100 × 0–60 viewBox. */
export function nodePosition(node: number): { x: number; y: number } {
  const depth = nodeDepth(node);
  const indexInRow = node - 2 ** depth;
  const span = 100 / 2 ** depth;
  return { x: span * (indexInRow + 0.5), y: 8 + depth * 15 };
}

export const ALL_NODES: readonly number[] = Array.from({ length: NODE_COUNT }, (_, index) => index + 1);

export const STORAGE_MODES: readonly { mode: StorageMode; label: string }[] = [
  { mode: 'plain', label: 'Plain storage' },
  { mode: 'oram', label: 'Path ORAM' },
];

export type GuessVisualState = 'idle' | 'reader' | 'wrong-guess';

export function getGuessVisualState(state: GameState, user: number): GuessVisualState {
  if (state.guess === null) return 'idle';
  if (user === state.reader) return 'reader';
  return user === state.guess ? 'wrong-guess' : 'idle';
}

export function getGuessClassName(visual: GuessVisualState): string {
  if (visual === 'reader') return 'border-emerald-300/70 bg-emerald-400/15';
  if (visual === 'wrong-guess') return 'border-rose-300/70 bg-rose-400/15';
  return 'border-white/15 bg-white/5 hover:border-cyan-300/60';
}

export function getModeClassName(active: boolean): string {
  return active
    ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100'
    : 'border-white/15 bg-white/5 text-muted-foreground hover:border-cyan-300/40';
}
