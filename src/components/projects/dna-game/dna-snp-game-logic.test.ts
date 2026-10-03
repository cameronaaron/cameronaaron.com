import { describe, expect, it } from 'vitest';

import {
  INITIAL_SCORE_STATE,
  MIN_MAGNITUDE,
  NOTHING_SHOWN,
  POSITIONS,
  RAW_FILE_HEADER,
  ROUNDS,
  SNPEDIA_ROWS,
  buildRound,
  computeScoreUpdate,
  describeLookup,
  explainResult,
  getInitialRound,
  getNextRound,
  getOptionClassName,
  getOptionVisualState,
  getResultMessage,
  normalizeGenotype,
  runMirror,
} from './dna-snp-game-logic';

describe('the mirror’s data', () => {
  it('pins the SNPedia rows copied from result.csv', () => {
    expect(SNPEDIA_ROWS.map((r) => `${r.rsid}(${r.genotype}) ${r.magnitude}`)).toEqual([
      'rs1815739(CC) 2.2', 'rs1815739(TT) 2.2', 'rs1815739(CT) 2.1',
      'rs671(AA) 4', 'rs671(AG) 3.5', 'rs671(GG) 2',
      'rs12913832(GG) 2.5',
      'rs17822931(TT) 2.5', 'rs17822931(CC) 2', 'rs17822931(CT) 2',
      'rs762551(AA) 1.5',
      'rs4988235(CC) 2.5', 'rs4988235(CT) 1.1', 'rs4988235(TT) 1.1',
    ]);
    expect(SNPEDIA_ROWS.find((r) => r.rsid === 'rs12913832')!.summary).toBe('blue eye color, 99% of the time');
    expect(SNPEDIA_ROWS.find((r) => r.rsid === 'rs762551')!.summary).toBe(
      'Faster caffeine metabolism in smokers and heavy coffee consumers'
    );
  });

  it('matches result.csv row for row, summaries verbatim', () => {
    expect(SNPEDIA_ROWS).toEqual([
          {
                "rsid": "rs1815739",
                "genotype": "CC",
                "magnitude": 2.2,
                "summary": "Better performing muscles. Likely sprinter."
          },
          {
                "rsid": "rs1815739",
                "genotype": "TT",
                "magnitude": 2.2,
                "summary": "Impaired muscle performance. Likely endurance athlete."
          },
          {
                "rsid": "rs1815739",
                "genotype": "CT",
                "magnitude": 2.1,
                "summary": "Mix of muscle types. Likely sprinter."
          },
          {
                "rsid": "rs671",
                "genotype": "AA",
                "magnitude": 4.0,
                "summary": "Asian Flusher; increased risk of esophageal cancer; East Asian ancestry; Disulfiram not effective for alcoholism."
          },
          {
                "rsid": "rs671",
                "genotype": "AG",
                "magnitude": 3.5,
                "summary": "Asian Flush; worse hangovers; increased risk of esophageal cancer; East Asian ancestry; Disulfiram probably not effective for alcoholism."
          },
          {
                "rsid": "rs671",
                "genotype": "GG",
                "magnitude": 2.0,
                "summary": "Alcohol Flush: Normal, doesn't flush. Normal hangovers. Normal risk of Alcoholism. Normal risk of Esophageal Cancer. Disulfiram is effective for alcoholism."
          },
          {
                "rsid": "rs12913832",
                "genotype": "GG",
                "magnitude": 2.5,
                "summary": "blue eye color, 99% of the time"
          },
          {
                "rsid": "rs17822931",
                "genotype": "TT",
                "magnitude": 2.5,
                "summary": "Dry earwax. No body odour. Likely Asian ancestry. Reduced colostrum."
          },
          {
                "rsid": "rs17822931",
                "genotype": "CC",
                "magnitude": 2.0,
                "summary": "Wet earwax. Normal body odour. Normal colostrum."
          },
          {
                "rsid": "rs17822931",
                "genotype": "CT",
                "magnitude": 2.0,
                "summary": "Wet earwax. Slightly better body odour."
          },
          {
                "rsid": "rs762551",
                "genotype": "AA",
                "magnitude": 1.5,
                "summary": "Faster caffeine metabolism in smokers and heavy coffee consumers"
          },
          {
                "rsid": "rs4988235",
                "genotype": "CC",
                "magnitude": 2.5,
                "summary": "likely to be lactose intolerant as an adult"
          },
          {
                "rsid": "rs4988235",
                "genotype": "CT",
                "magnitude": 1.1,
                "summary": "likely to be able to digest milk as an adult"
          },
          {
                "rsid": "rs4988235",
                "genotype": "TT",
                "magnitude": 1.1,
                "summary": "can digest milk"
          }
    ]);
  });

  it('stores every SNPedia genotype in the sorted form the mirror keys by', () => {
    for (const row of SNPEDIA_ROWS) expect(normalizeGenotype(row.genotype)).toBe(row.genotype);
  });

  it('pins positions, checked against the repository’s sample 23andMe file', () => {
    expect(POSITIONS).toEqual({
      rs1815739: ['11', 66328095],
      rs671: ['12', 112241766],
      rs12913832: ['15', 28365618],
      rs17822931: ['16', 48258198],
      rs762551: ['15', 75041917],
      rs4988235: ['2', 136608646],
    });
    expect(MIN_MAGNITUDE).toBe(2);
  });
});

describe('normalize_genotype', () => {
  it('sorts the two alleles', () => {
    expect(normalizeGenotype('GA')).toBe('AG');
    expect(normalizeGenotype('AG')).toBe('AG');
    expect(normalizeGenotype(' tc ')).toBe('CT');
  });

  it('gives no key for no-calls, indels and single alleles', () => {
    expect(normalizeGenotype('--')).toBeNull();
    expect(normalizeGenotype('DI')).toBeNull();
    expect(normalizeGenotype('A')).toBeNull();
    expect(normalizeGenotype('AN')).toBeNull();
    expect(normalizeGenotype('NA')).toBeNull();
    expect(normalizeGenotype('AGT')).toBeNull();
  });

  it('does not complement — the strand bug, pinned', () => {
    // 23andMe "GG" at rs4988235 is SNPedia's "CC" on the other strand.
    expect(normalizeGenotype('GG')).toBe('GG');
  });
});

describe('runMirror', () => {
  it('shows a match at or above the magnitude floor', () => {
    expect(runMirror('rs671', 'GG')).toEqual({ outcome: 'shown', row: SNPEDIA_ROWS[5], display: SNPEDIA_ROWS[5].summary });
    expect(runMirror('rs671', 'GA').display).toBe(SNPEDIA_ROWS[4].summary);
  });

  it('filters a match under the floor', () => {
    expect(runMirror('rs762551', 'AA')).toEqual({ outcome: 'below-magnitude', row: SNPEDIA_ROWS[10], display: NOTHING_SHOWN });
  });

  it('finds nothing across the strand mismatch', () => {
    expect(runMirror('rs4988235', 'GG')).toEqual({ outcome: 'no-match', row: null, display: NOTHING_SHOWN });
    expect(runMirror('rs4988235', 'CC').outcome).toBe('shown');
  });

  it('skips a no-call', () => {
    expect(runMirror('rs12913832', '--')).toEqual({ outcome: 'no-call', row: null, display: NOTHING_SHOWN });
  });
});

describe('rounds', () => {
  it('writes the raw line exactly as 23andMe does', () => {
    expect(RAW_FILE_HEADER).toBe('# rsid\tchromosome\tposition\tgenotype');
    expect(getInitialRound().line).toBe('rs1815739\t11\t66328095\tCT');
  });

  it('covers every way a line can end', () => {
    expect(ROUNDS.map((_, i) => buildRound(i).result.outcome)).toEqual([
      'shown', 'shown', 'shown', 'below-magnitude', 'shown', 'no-match', 'no-call',
    ]);
  });

  it('offers every SNPedia summary for the rsid plus nothing', () => {
    expect(getInitialRound().options).toEqual([
      'Better performing muscles. Likely sprinter.',
      'Impaired muscle performance. Likely endurance athlete.',
      'Mix of muscle types. Likely sprinter.',
      NOTHING_SHOWN,
    ]);
    expect(buildRound(2).options).toEqual(['blue eye color, 99% of the time', NOTHING_SHOWN]);
  });

  it('advances and wraps', () => {
    expect(getNextRound(getInitialRound()).rsid).toBe('rs671');
    expect(buildRound(ROUNDS.length).rsid).toBe('rs1815739');
  });
});

describe('copy', () => {
  it('describes the lookup table', () => {
    expect(describeLookup(buildRound(3))).toBe('SNPedia has rs762551 as AA (magnitude 1.5). The mirror shows magnitude 2 and up.');
    expect(describeLookup(getInitialRound())).toBe(
      'SNPedia has rs1815739 as CC (magnitude 2.2), TT (magnitude 2.2), CT (magnitude 2.1). The mirror shows magnitude 2 and up.'
    );
  });

  it('explains each outcome', () => {
    expect(explainResult(buildRound(0))).toBe(
      'CT matches SNPedia at magnitude 2.1, above the floor, so it floats around the reflection.'
    );
    expect(explainResult(buildRound(1))).toBe(
      'AG (sorted from GA) matches SNPedia at magnitude 3.5, above the floor, so it floats around the reflection.'
    );
    expect(explainResult(buildRound(3))).toBe(
      "AA matches SNPedia, but at magnitude 1.5 — under the mirror's 2 floor, so it is filtered out."
    );
    expect(explainResult(buildRound(5))).toBe(
      'GG matches nothing. 23andMe reports this SNP on the plus strand (A/G); SNPedia files it on the minus strand ' +
        '(C/T). The mirror sorts alleles but never complements them, so the lookup misses — GG here is SNPedia\'s CC.'
    );
    expect(explainResult(buildRound(6))).toBe(
      '"--" is a no-call: the chip did not read this position, so the parser skips it.'
    );
  });

  it('prefixes the verdict', () => {
    const round = getInitialRound();
    expect(getResultMessage(round, round.result.display)).toBe(`Correct. ${explainResult(round)}`);
    expect(getResultMessage(round, NOTHING_SHOWN)).toBe(`Not quite. ${explainResult(round)}`);
  });
});

describe('scoring and presentation', () => {
  it('scores streaks and keeps the best', () => {
    const one = computeScoreUpdate(INITIAL_SCORE_STATE, true);
    expect(one).toEqual({ score: 1, streak: 1, bestStreak: 1 });
    expect(computeScoreUpdate(computeScoreUpdate(one, true), false)).toEqual({ score: 2, streak: 0, bestStreak: 2 });
    expect(computeScoreUpdate({ score: 5, streak: 0, bestStreak: 3 }, true)).toEqual({ score: 6, streak: 1, bestStreak: 3 });
  });

  it('derives option states and classes', () => {
    const round = getInitialRound();
    const answer = round.result.display;
    expect(getOptionVisualState(answer, round, null)).toBe('idle');
    expect(getOptionVisualState(answer, round, NOTHING_SHOWN)).toBe('correct');
    expect(getOptionVisualState(NOTHING_SHOWN, round, NOTHING_SHOWN)).toBe('wrong');
    expect(getOptionVisualState(round.options[0], round, NOTHING_SHOWN)).toBe('dimmed');
    expect(getOptionClassName('correct')).toBe('border-emerald-300/70 bg-emerald-400/15');
    expect(getOptionClassName('wrong')).toBe('border-rose-300/70 bg-rose-400/15');
    expect(getOptionClassName('dimmed')).toBe('border-white/10 bg-white/[0.02] opacity-60');
    expect(getOptionClassName('idle')).toBe('border-white/15 bg-white/5 hover:border-cyan-300/60 hover:bg-cyan-400/10');
  });
});
