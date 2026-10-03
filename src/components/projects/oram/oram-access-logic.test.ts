import { describe, expect, it } from 'vitest';

import { createSeededRandom } from '@/components/hero/interactive-particles/interactive-particles-engine';
import {
  ALL_NODES,
  BUCKET_CAPACITY,
  CHANCE_PERCENT,
  EMPTY_STATS,
  FIRST_LEAF_NODE,
  INITIAL_SEED,
  LEAF_COUNT,
  NODE_COUNT,
  RECORD_COUNT,
  TREE_HEIGHT,
  USER_NAMES,
  accessRecord,
  accuracyPercent,
  createGame,
  createOram,
  STORAGE_MODES,
  getAccuracyText,
  getGuessClassName,
  getGuessVisualState,
  getModeClassName,
  getNodeVisualState,
  getObservationText,
  getResultText,
  isOnPath,
  nodeDepth,
  nodePosition,
  pathNodes,
  slotsTouched,
  startRound,
  submitGuess,
  switchMode,
  type OramState,
} from './oram-access-logic';

/** The Path ORAM invariant: every record stored exactly once, on its own path or in the stash. */
function expectInvariant(state: OramState) {
  const seen: number[] = [...state.stash];
  for (let node = 1; node <= NODE_COUNT; node += 1) {
    expect(state.buckets[node].length).toBeLessThanOrEqual(BUCKET_CAPACITY);
    for (const block of state.buckets[node]) {
      expect(isOnPath(node, state.position[block])).toBe(true);
      seen.push(block);
    }
  }
  expect(seen.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  expect(state.buckets[0]).toEqual([]);
}

describe('tree geometry', () => {
  it('uses a heap-laid-out tree of height 3 with 8 leaves and Z = 4', () => {
    expect([RECORD_COUNT, TREE_HEIGHT, LEAF_COUNT, FIRST_LEAF_NODE, NODE_COUNT, BUCKET_CAPACITY]).toEqual([8, 3, 8, 8, 15, 4]);
    expect(CHANCE_PERCENT).toBe(12.5);
    expect(USER_NAMES).toEqual(['Ada', 'Ben', 'Cy', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal']);
    expect(ALL_NODES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  it('walks root-to-leaf paths', () => {
    expect(pathNodes(0)).toEqual([1, 2, 4, 8]);
    expect(pathNodes(5)).toEqual([1, 3, 6, 13]);
    expect(pathNodes(7)).toEqual([1, 3, 7, 15]);
  });

  it('knows depth and path membership exactly', () => {
    expect([1, 2, 3, 4, 7, 8, 15].map(nodeDepth)).toEqual([0, 1, 1, 2, 2, 3, 3]);
    expect(isOnPath(1, 6)).toBe(true);
    expect(isOnPath(3, 6)).toBe(true);
    expect(isOnPath(7, 6)).toBe(true);
    expect(isOnPath(14, 6)).toBe(true);
    expect(isOnPath(2, 6)).toBe(false);
    expect(isOnPath(6, 6)).toBe(false);
    expect(isOnPath(15, 6)).toBe(false);
  });

  it('lays nodes out by depth in a 100-wide viewBox', () => {
    expect(nodePosition(1)).toEqual({ x: 50, y: 8 });
    expect(nodePosition(3)).toEqual({ x: 75, y: 23 });
    expect(nodePosition(8)).toEqual({ x: 6.25, y: 53 });
    expect(nodePosition(15)).toEqual({ x: 93.75, y: 53 });
  });
});

describe('Path ORAM', () => {
  it('starts with every record placed and the invariant holding', () => {
    expectInvariant(createOram(INITIAL_SEED));
  });

  it('places records as deep as their leaf allows, leaves before ancestors', () => {
    const state = createOram(INITIAL_SEED);
    expect(state.position).toEqual([0, 4, 6, 0, 3, 2, 2, 3]);
    expect(state.stash).toEqual([]);
    expect(state.buckets[FIRST_LEAF_NODE + 0]).toEqual([0, 3]);
    expect(state.buckets[FIRST_LEAF_NODE + 4]).toEqual([1]);
    expect(state.buckets[FIRST_LEAF_NODE + 6]).toEqual([2]);
    expect(state.buckets[FIRST_LEAF_NODE + 2]).toEqual([5, 6]);
    expect(state.buckets[FIRST_LEAF_NODE + 3]).toEqual([4, 7]);
    for (let node = 1; node < FIRST_LEAF_NODE; node += 1) expect(state.buckets[node]).toEqual([]);
  });

  it('a bucket never takes a fifth block, even when five records share a leaf', () => {
    // All eight records mapped to leaf 0 and waiting in the stash.
    const crowded: OramState = {
      position: [0, 0, 0, 0, 0, 0, 0, 0],
      buckets: Array.from({ length: NODE_COUNT + 1 }, () => []),
      stash: [0, 1, 2, 3, 4, 5, 6, 7],
    };
    const { state: after } = accessRecord(crowded, 0, () => 0);
    expectInvariant(after);
    expect(after.buckets[FIRST_LEAF_NODE]).toEqual([0, 1, 2, 3]);
    expect(after.buckets[FIRST_LEAF_NODE >> 1]).toEqual([4, 5, 6, 7]);
    expect(after.stash).toEqual([]);
  });

  it('keeps the invariant across thousands of accesses', () => {
    const random = createSeededRandom(7);
    let state = createOram(7);
    let maxStash = 0;
    for (let step = 0; step < 3000; step += 1) {
      state = accessRecord(state, Math.floor(random() * RECORD_COUNT), random).state;
      expectInvariant(state);
      maxStash = Math.max(maxStash, state.stash.length);
    }
    // Eviction is what keeps the client small: with Z = 4 the stash peaked
    // at 1–2 blocks across every seed measured. A no-op eviction still
    // satisfies the invariant above (everything "stored" in the stash), so
    // this bound is the assertion that eviction actually runs.
    expect(maxStash).toBeLessThanOrEqual(2);
  });

  it('reads the path to the record’s old leaf and remaps the record', () => {
    const before = createOram(INITIAL_SEED);
    const snapshot = JSON.stringify(before);
    const { state, observedLeaf } = accessRecord(before, 3, () => 0.99);
    expect(observedLeaf).toBe(before.position[3]);
    expect(state.position[3]).toBe(7);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('shows the server a uniformly random leaf whoever reads — the whole point', () => {
    const histogramFor = (reader: number) => {
      const random = createSeededRandom(99 + reader);
      let state = createOram(99 + reader);
      const counts = new Array<number>(LEAF_COUNT).fill(0);
      for (let step = 0; step < 4000; step += 1) {
        const result = accessRecord(state, reader, random);
        counts[result.observedLeaf] += 1;
        state = result.state;
      }
      return counts;
    };
    for (const reader of [0, 7]) {
      for (const count of histogramFor(reader)) {
        expect(count / 4000).toBeGreaterThan(0.1);
        expect(count / 4000).toBeLessThan(0.15);
      }
    }
  });
});

describe('the game', () => {
  it('is deterministic from its seed', () => {
    expect(createGame()).toEqual(createGame());
    expect(createGame().mode).toBe('oram');
    expect(createGame().stats).toBe(EMPTY_STATS);
  });

  it('in plain mode, shows the reader’s own slot', () => {
    const game = createGame('plain');
    expect(game.observation).toEqual({ mode: 'plain', slot: game.reader });
    expect(slotsTouched(game.observation)).toBe(1);
  });

  it('in ORAM mode, shows a whole path and what it cost', () => {
    const game = createGame('oram');
    expect(game.observation.mode).toBe('oram');
    if (game.observation.mode !== 'oram') return;
    expect(game.observation.nodes).toEqual(pathNodes(game.observation.leaf));
    expect(slotsTouched(game.observation)).toBe(16);
    for (const node of ALL_NODES) {
      expect(getNodeVisualState(node, game.observation)).toBe(isOnPath(node, game.observation.leaf) ? 'touched' : 'idle');
    }
    expect(getNodeVisualState(1, { mode: 'plain', slot: 0 })).toBe('idle');
  });

  it('draws every user as the reader over enough rounds', () => {
    const readers = new Set<number>();
    let game = createGame('plain');
    for (let round = 0; round < 200; round += 1) {
      readers.add(game.reader);
      game = startRound(game);
    }
    expect(readers.size).toBe(RECORD_COUNT);
  });

  it('advances the seed every round', () => {
    const game = createGame();
    const next = startRound(game);
    expect(next.seed).not.toBe(game.seed);
    expect(next.guess).toBeNull();
  });

  it('scores a guess once and per mode', () => {
    const game = createGame('plain');
    const right = submitGuess(game, game.reader);
    expect(right.stats.plain).toEqual({ correct: 1, total: 1 });
    expect(right.stats.oram).toEqual({ correct: 0, total: 0 });
    expect(submitGuess(right, (game.reader + 1) % RECORD_COUNT)).toBe(right);
    const wrong = submitGuess(startRound(right), (startRound(right).reader + 1) % RECORD_COUNT);
    expect(wrong.stats.plain).toEqual({ correct: 1, total: 2 });
  });

  it('switching mode starts a new round, and re-selecting the same mode does nothing', () => {
    const game = createGame('oram');
    expect(switchMode(game, 'oram')).toBe(game);
    const plain = switchMode(game, 'plain');
    expect(plain.mode).toBe('plain');
    expect(plain.observation.mode).toBe('plain');
  });
});

describe('copy', () => {
  it('reports accuracy against chance only where chance is the ceiling', () => {
    expect(accuracyPercent({ correct: 0, total: 0 })).toBeNull();
    expect(accuracyPercent({ correct: 1, total: 3 })).toBe(33);
    expect(getAccuracyText('oram', { correct: 0, total: 0 })).toBe('No guesses yet');
    expect(getAccuracyText('oram', { correct: 1, total: 8 })).toBe('1/8 right (13%) · chance is 12.5%');
    expect(getAccuracyText('plain', { correct: 4, total: 4 })).toBe('4/4 right (100%)');
  });

  it('describes what storage saw', () => {
    expect(getObservationText({ mode: 'plain', slot: 2 })).toBe(
      'Storage saw slot 3 read. One slot, and it belongs to exactly one user.'
    );
    expect(getObservationText({ mode: 'oram', leaf: 5, nodes: pathNodes(5) })).toBe(
      'Storage saw the path to leaf 6 read and rewritten: 4 buckets, 16 slots, every one re-encrypted.'
    );
  });

  it('explains every outcome', () => {
    const plain = createGame('plain');
    const oram = createGame('oram');
    const name = (state: typeof plain) => USER_NAMES[state.reader];
    const other = (state: typeof plain) => (state.reader + 1) % RECORD_COUNT;
    expect(getResultText(plain)).toBe('');
    expect(getResultText(submitGuess(plain, plain.reader))).toBe(
      `Right — it was ${name(plain)}. Encryption hid the contents, not whose record it was.`
    );
    expect(getResultText(submitGuess(plain, other(plain)))).toBe(
      `It was ${name(plain)}. Look at which slot lit up — plain storage tells you every time.`
    );
    expect(getResultText(submitGuess(oram, oram.reader))).toBe(
      `Right — it was ${name(oram)}. A lucky guess: that path said nothing about who read it.`
    );
    expect(getResultText(submitGuess(oram, other(oram)))).toBe(
      `It was ${name(oram)}. Their record now sits under a new random leaf, so next time looks different again.`
    );
  });
});

describe('presentation', () => {
  it('names both storage modes, plain first', () => {
    expect(STORAGE_MODES).toEqual([
      { mode: 'plain', label: 'Plain storage' },
      { mode: 'oram', label: 'Path ORAM' },
    ]);
  });

  it('marks the reader and a wrong guess once a guess is in', () => {
    const game = createGame('plain');
    const other = (game.reader + 1) % RECORD_COUNT;
    const third = (game.reader + 2) % RECORD_COUNT;
    expect(getGuessVisualState(game, game.reader)).toBe('idle');
    const guessed = submitGuess(game, other);
    expect(getGuessVisualState(guessed, game.reader)).toBe('reader');
    expect(getGuessVisualState(guessed, other)).toBe('wrong-guess');
    expect(getGuessVisualState(guessed, third)).toBe('idle');
    expect(getGuessClassName('reader')).toBe('border-emerald-300/70 bg-emerald-400/15');
    expect(getGuessClassName('wrong-guess')).toBe('border-rose-300/70 bg-rose-400/15');
    expect(getGuessClassName('idle')).toBe('border-white/15 bg-white/5 hover:border-cyan-300/60');
    expect(getModeClassName(true)).toBe('border-cyan-300/60 bg-cyan-400/15 text-cyan-100');
    expect(getModeClassName(false)).toBe('border-white/15 bg-white/5 text-muted-foreground hover:border-cyan-300/40');
  });
});
