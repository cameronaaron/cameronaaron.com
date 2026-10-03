/**
 * "Read the Raw File" — paired with Genetic RefleXions, the magic mirror.
 *
 * This is the mirror's own pipeline (cameronaaron/Ammerman-magic-mirror),
 * one raw-file line at a time:
 *
 *  1. genome.py reads a 23andMe row: rsid, chromosome, position, genotype.
 *  2. genetics.normalize_genotype keys the call by sorting its two alleles
 *     ("GA" → "AG"); a no-call ("--") has no key and is skipped.
 *  3. traits.build_traits looks the (rsid, key) pair up in SNPedia — offline,
 *     the frozen result.csv snapshot — and drops anything under the default
 *     min_magnitude of 2.0.
 *  4. Whatever survives floats around the visitor's reflection.
 *
 * The player predicts step 4. The SNPedia rows below are copied verbatim from
 * that snapshot (SNPedia, CC BY-NC-SA), and the positions were checked
 * against the repository's sample 23andMe file.
 *
 * One round is a real finding from reading that code: SNPedia files
 * rs4988235 on the minus strand (C/T) while 23andMe reports it on the plus
 * strand (A/G). normalize_genotype sorts alleles but never complements them,
 * so a 23andMe lactase call matches nothing and the mirror stays silent. The
 * comment there calls the key "strand-independent"; it is order-independent.
 *
 * Rounds advance in catalog order; nothing is random, so the first paint is
 * identical on server and client (CLAUDE.md #10).
 */

export interface SnpediaRow {
  rsid: string;
  /** The SNPedia genotype, alleles sorted as the mirror keys them. */
  genotype: string;
  magnitude: number;
  summary: string;
}

/** Rows from result.csv for the SNPs in play, verbatim. */
export const SNPEDIA_ROWS: readonly SnpediaRow[] = [
  { rsid: 'rs1815739', genotype: 'CC', magnitude: 2.2, summary: 'Better performing muscles. Likely sprinter.' },
  { rsid: 'rs1815739', genotype: 'TT', magnitude: 2.2, summary: 'Impaired muscle performance. Likely endurance athlete.' },
  { rsid: 'rs1815739', genotype: 'CT', magnitude: 2.1, summary: 'Mix of muscle types. Likely sprinter.' },
  { rsid: 'rs671', genotype: 'AA', magnitude: 4, summary: 'Asian Flusher; increased risk of esophageal cancer; East Asian ancestry; Disulfiram not effective for alcoholism.' },
  { rsid: 'rs671', genotype: 'AG', magnitude: 3.5, summary: 'Asian Flush; worse hangovers; increased risk of esophageal cancer; East Asian ancestry; Disulfiram probably not effective for alcoholism.' },
  { rsid: 'rs671', genotype: 'GG', magnitude: 2, summary: "Alcohol Flush: Normal, doesn't flush. Normal hangovers. Normal risk of Alcoholism. Normal risk of Esophageal Cancer. Disulfiram is effective for alcoholism." },
  { rsid: 'rs12913832', genotype: 'GG', magnitude: 2.5, summary: 'blue eye color, 99% of the time' },
  { rsid: 'rs17822931', genotype: 'TT', magnitude: 2.5, summary: 'Dry earwax. No body odour. Likely Asian ancestry. Reduced colostrum.' },
  { rsid: 'rs17822931', genotype: 'CC', magnitude: 2, summary: 'Wet earwax. Normal body odour. Normal colostrum.' },
  { rsid: 'rs17822931', genotype: 'CT', magnitude: 2, summary: 'Wet earwax. Slightly better body odour.' },
  { rsid: 'rs762551', genotype: 'AA', magnitude: 1.5, summary: 'Faster caffeine metabolism in smokers and heavy coffee consumers' },
  { rsid: 'rs4988235', genotype: 'CC', magnitude: 2.5, summary: 'likely to be lactose intolerant as an adult' },
  { rsid: 'rs4988235', genotype: 'CT', magnitude: 1.1, summary: 'likely to be able to digest milk as an adult' },
  { rsid: 'rs4988235', genotype: 'TT', magnitude: 1.1, summary: 'can digest milk' },
];

/** config.py's default display floor. */
export const MIN_MAGNITUDE = 2.0;

/** GRCh37 coordinates, as 23andMe writes them. */
export const POSITIONS: Record<string, readonly [string, number]> = {
  rs1815739: ['11', 66328095],
  rs671: ['12', 112241766],
  rs12913832: ['15', 28365618],
  rs17822931: ['16', 48258198],
  rs762551: ['15', 75041917],
  rs4988235: ['2', 136608646],
};

export const NOTHING_SHOWN = 'Nothing — this line never reaches the mirror';
export const RAW_FILE_HEADER = '# rsid\tchromosome\tposition\tgenotype';

/** The SNPedia lookup, built once: "rsid:genotype" → row. */
const SNPEDIA_INDEX: Map<string, SnpediaRow> = new Map(SNPEDIA_ROWS.map((row) => [`${row.rsid}:${row.genotype}`, row]));

/** genetics.normalize_genotype: two bases from ACGT, sorted; otherwise no key. */
export function normalizeGenotype(genotype: string): string | null {
  const g = genotype.trim().toUpperCase();
  if (g.length !== 2 || !'ACGT'.includes(g[0]) || !'ACGT'.includes(g[1])) return null;
  return g[0] <= g[1] ? g : g[1] + g[0];
}

export type Outcome = 'shown' | 'no-call' | 'no-match' | 'below-magnitude';

export interface MirrorResult {
  outcome: Outcome;
  /** The SNPedia row the lookup found, shown or not. */
  row: SnpediaRow | null;
  display: string;
}

/** What the mirror does with one raw-file line. */
export function runMirror(rsid: string, genotype: string): MirrorResult {
  const key = normalizeGenotype(genotype);
  if (key === null) return { outcome: 'no-call', row: null, display: NOTHING_SHOWN };
  const row = SNPEDIA_INDEX.get(`${rsid}:${key}`) ?? null;
  if (row === null) return { outcome: 'no-match', row: null, display: NOTHING_SHOWN };
  if (row.magnitude < MIN_MAGNITUDE) return { outcome: 'below-magnitude', row, display: NOTHING_SHOWN };
  return { outcome: 'shown', row, display: row.summary };
}

/** Each round is one raw-file line: [rsid, genotype as 23andMe writes it]. */
export const ROUNDS: readonly (readonly [string, string])[] = [
  ['rs1815739', 'CT'],
  ['rs671', 'GA'],
  ['rs12913832', 'GG'],
  ['rs762551', 'AA'],
  ['rs17822931', 'TT'],
  ['rs4988235', 'GG'],
  ['rs12913832', '--'],
];

export interface Round {
  index: number;
  rsid: string;
  genotype: string;
  line: string;
  options: string[];
  result: MirrorResult;
}

export function buildRound(index: number): Round {
  const [rsid, genotype] = ROUNDS[index % ROUNDS.length];
  const [chromosome, position] = POSITIONS[rsid];
  const options: string[] = [];
  for (const row of SNPEDIA_ROWS) if (row.rsid === rsid) options.push(row.summary);
  options.push(NOTHING_SHOWN);
  return {
    index,
    rsid,
    genotype,
    line: `${rsid}\t${chromosome}\t${position}\t${genotype}`,
    options,
    result: runMirror(rsid, genotype),
  };
}

export function getInitialRound(): Round {
  return buildRound(0);
}

export function getNextRound(round: Round): Round {
  return buildRound(round.index + 1);
}

/** The SNPedia entries the mirror could match for this rsid, for the card. */
export function describeLookup(round: Round): string {
  const genotypes: string[] = [];
  for (const row of SNPEDIA_ROWS) if (row.rsid === round.rsid) genotypes.push(`${row.genotype} (magnitude ${row.magnitude})`);
  return `SNPedia has ${round.rsid} as ${genotypes.join(', ')}. The mirror shows magnitude ${MIN_MAGNITUDE} and up.`;
}

/** Why the mirror did what it did. */
export function explainResult(round: Round): string {
  const { outcome, row } = round.result;
  const key = normalizeGenotype(round.genotype);
  if (outcome === 'no-call') {
    return `"${round.genotype}" is a no-call: the chip did not read this position, so the parser skips it.`;
  }
  if (outcome === 'below-magnitude') {
    return `${key} matches SNPedia, but at magnitude ${row!.magnitude} — under the mirror's ${MIN_MAGNITUDE} floor, so it is filtered out.`;
  }
  if (outcome === 'no-match') {
    return (
      `${key} matches nothing. 23andMe reports this SNP on the plus strand (A/G); SNPedia files it on the minus strand ` +
      `(C/T). The mirror sorts alleles but never complements them, so the lookup misses — GG here is SNPedia's CC.`
    );
  }
  const sorted = key === round.genotype ? '' : ` (sorted from ${round.genotype})`;
  return `${key}${sorted} matches SNPedia at magnitude ${row!.magnitude}, above the floor, so it floats around the reflection.`;
}

export function getResultMessage(round: Round, chosen: string): string {
  return `${chosen === round.result.display ? 'Correct.' : 'Not quite.'} ${explainResult(round)}`;
}

export interface ScoreState {
  score: number;
  streak: number;
  bestStreak: number;
}

export const INITIAL_SCORE_STATE: ScoreState = { score: 0, streak: 0, bestStreak: 0 };

export function computeScoreUpdate(state: ScoreState, correct: boolean): ScoreState {
  if (!correct) return { ...state, streak: 0 };
  const streak = state.streak + 1;
  return { score: state.score + 1, streak, bestStreak: Math.max(state.bestStreak, streak) };
}

export type OptionVisualState = 'idle' | 'correct' | 'wrong' | 'dimmed';

export function getOptionVisualState(option: string, round: Round, chosen: string | null): OptionVisualState {
  if (chosen === null) return 'idle';
  if (option === round.result.display) return 'correct';
  return option === chosen ? 'wrong' : 'dimmed';
}

export function getOptionClassName(state: OptionVisualState): string {
  if (state === 'correct') return 'border-emerald-300/70 bg-emerald-400/15';
  if (state === 'wrong') return 'border-rose-300/70 bg-rose-400/15';
  if (state === 'dimmed') return 'border-white/10 bg-white/[0.02] opacity-60';
  return 'border-white/15 bg-white/5 hover:border-cyan-300/60 hover:bg-cyan-400/10';
}
