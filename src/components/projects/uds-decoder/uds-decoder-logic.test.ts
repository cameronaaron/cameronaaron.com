import { describe, expect, it } from 'vitest';

import {
  CHALLENGES,
  INITIAL_SCORE_STATE,
  MISTAKE_EXPLANATIONS,
  MODULE_HEADER,
  POSITIVE_RESPONSE_SID,
  buildRound,
  computeScoreUpdate,
  decodeWith,
  formatDid,
  formatRequest,
  formatValue,
  getByteRole,
  getByteRoleClassName,
  getInitialRound,
  getNextRound,
  getOptionClassName,
  getOptionVisualState,
  getResultMessage,
  parseHexBytes,
  parseResponse,
  readRaw,
} from './uds-decoder-logic';

/**
 * The test vectors exactly as they appear in Mechanic's
 * db/module/ford/pcm.f150.2015-2020.toml (response -> expected value). If the
 * catalog drifts from the repository, this fails.
 */
const REPOSITORY_VECTORS: Record<string, { response: string; expect: number }> = {
  tft: { response: '62 1E 1C 03 20', expect: 50 },
  cylinder_head_temp: { response: '62 03 34 0C 80', expect: 50 },
  learned_octane_ratio: { response: '62 03 E8 F0 00', expect: -0.25 },
  desired_boost: { response: '62 03 3E 40 00', expect: 3.86 },
  iat: { response: '62 F4 0F 5A', expect: 50 },
  axle_ratio: { response: '62 1E 16 20 00', expect: 2.0 },
};

describe('uds-decoder catalog is the repository’s own test vectors', () => {
  it('covers exactly the pinned vectors, byte for byte', () => {
    expect(CHALLENGES.map((c) => c.name)).toEqual(Object.keys(REPOSITORY_VECTORS));
    for (const challenge of CHALLENGES) {
      expect(challenge.responseHex).toBe(REPOSITORY_VECTORS[challenge.name].response);
      expect(challenge.expected).toBe(REPOSITORY_VECTORS[challenge.name].expect);
    }
  });

  it('decodes every vector to its expected value (tolerance 0.001, as the TOML allows)', () => {
    for (const challenge of CHALLENGES) {
      expect(Math.abs(decodeWith(challenge, null) - challenge.expected)).toBeLessThan(0.001);
    }
  });

  it('every response is a positive RDBI reply for the identifier it claims', () => {
    expect(POSITIVE_RESPONSE_SID).toBe(0x62);
    for (const challenge of CHALLENGES) {
      const parsed = parseResponse(challenge.responseHex);
      expect(parsed.sid).toBe(POSITIVE_RESPONSE_SID);
      expect(parsed.did).toBe(challenge.did);
      expect(parsed.payload).toHaveLength(challenge.bits / 8);
    }
  });

  it('pins the display text of every challenge', () => {
    expect(
      CHALLENGES.map(({ label, did, bits, signed, unit, formulaText, mistakes }) => ({
        label,
        did,
        bits,
        signed,
        unit,
        formulaText,
        mistakes,
      }))
    ).toEqual([
      { label: 'Transmission fluid temperature', did: 0x1e1c, bits: 16, signed: false, unit: '°C', formulaText: 'raw / 16', mistakes: ['byte-order', 'scale'] },
      { label: 'Cylinder head temperature', did: 0x0334, bits: 16, signed: true, unit: '°C', formulaText: 'raw / 64 (signed)', mistakes: ['byte-order', 'scale'] },
      { label: 'Learned octane ratio', did: 0x03e8, bits: 16, signed: true, unit: '', formulaText: 'raw / 16384 (signed)', mistakes: ['sign', 'byte-order', 'scale'] },
      { label: 'Desired boost', did: 0x033e, bits: 16, signed: false, unit: 'psi', formulaText: 'raw / 128 × 0.145 − 14.7', mistakes: ['offset', 'byte-order', 'scale'] },
      { label: 'Intake air temperature', did: 0xf40f, bits: 8, signed: false, unit: '°C', formulaText: 'raw − 40', mistakes: ['offset'] },
      { label: 'Axle gear ratio, measured', did: 0x1e16, bits: 16, signed: false, unit: '', formulaText: 'raw / 4096', mistakes: ['byte-order', 'scale'] },
    ]);
    expect(MODULE_HEADER).toBe('Ford F-150 PCM · request 0x7E0 → response 0x7E8 · 2015–2020');
  });
});

describe('decoding mistakes produce the values a real mistake would', () => {
  const byName = (name: string) => CHALLENGES.find((c) => c.name === name)!;

  it('little-endian reads swap the bytes', () => {
    expect(decodeWith(byName('tft'), 'byte-order')).toBe(0x2003 / 16);
    expect(decodeWith(byName('cylinder_head_temp'), 'byte-order')).toBe((0x800c - 0x10000) / 64);
    expect(decodeWith(byName('axle_ratio'), 'byte-order')).toBe(0x0020 / 4096);
  });

  it('ignoring the sign bit turns a negative ratio positive', () => {
    expect(decodeWith(byName('learned_octane_ratio'), 'sign')).toBe(0xf000 / 16384);
    expect(decodeWith(byName('learned_octane_ratio'), null)).toBe(-0.25);
  });

  it('skipping the scale returns the raw integer, signed where the signal is', () => {
    expect(decodeWith(byName('tft'), 'scale')).toBe(800);
    expect(decodeWith(byName('learned_octane_ratio'), 'scale')).toBe(-4096);
  });

  it('dropping the offset shifts the reading by exactly the offset', () => {
    expect(decodeWith(byName('iat'), 'offset')).toBe(90);
    expect(decodeWith(byName('iat'), null)).toBe(50);
    expect(decodeWith(byName('desired_boost'), 'offset') - decodeWith(byName('desired_boost'), null)).toBeCloseTo(14.7, 10);
  });

  it('every option in every round is distinct, so no mistake collides with the answer', () => {
    for (let index = 0; index < CHALLENGES.length; index += 1) {
      const texts = buildRound(index).options.map((o) => o.text);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });
});

describe('readRaw', () => {
  it('reads 8- and 16-bit values in either byte order', () => {
    expect(readRaw([0x5a], 8, false, false)).toBe(90);
    expect(readRaw([0x03, 0x20], 16, false, false)).toBe(800);
    expect(readRaw([0x03, 0x20], 16, false, true)).toBe(0x2003);
  });

  it('applies two’s complement exactly at the sign bit', () => {
    expect(readRaw([0x7f, 0xff], 16, true, false)).toBe(32767);
    expect(readRaw([0x80, 0x00], 16, true, false)).toBe(-32768);
    expect(readRaw([0x80], 8, true, false)).toBe(-128);
    expect(readRaw([0x7f], 8, true, false)).toBe(127);
    expect(readRaw([0x80, 0x00], 16, false, false)).toBe(32768);
  });
});

describe('rounds', () => {
  it('rotates the correct answer’s slot with the round index', () => {
    const slots = CHALLENGES.map((_, index) => buildRound(index).options.findIndex((o) => o.mistake === null));
    // index % (mistakes + 1): the axle round (index 5) has two mistakes.
    expect(slots).toEqual([0, 1, 2, 3, 0, 2]);
  });

  it('keeps every mistake option in catalog order around the correct one', () => {
    expect(buildRound(2).options.map((o) => o.mistake)).toEqual(['sign', 'byte-order', null, 'scale']);
    expect(buildRound(2).options.map((o) => o.text)).toEqual(['3.75', '0.0146', '-0.25', '-4096']);
  });

  it('starts at the first vector and wraps after the last', () => {
    expect(getInitialRound().challenge.name).toBe('tft');
    expect(getNextRound(getInitialRound()).index).toBe(1);
    expect(buildRound(CHALLENGES.length).challenge.name).toBe('tft');
  });

  it('formats values without float noise and with the unit when there is one', () => {
    expect(formatValue(3.8600000000000012, 'psi')).toBe('3.86 psi');
    expect(formatValue(-0.25, '')).toBe('-0.25');
    expect(formatValue(0.0146484375, '')).toBe('0.0146');
  });
});

describe('feedback and scoring', () => {
  it('confirms a correct reading against the test vector', () => {
    const round = getInitialRound();
    const correct = round.options.find((o) => o.mistake === null)!;
    expect(getResultMessage(round, correct)).toBe("Correct — 50 °C, the value the repository's test vector expects.");
  });

  it('names the mistake behind a wrong reading', () => {
    const round = getInitialRound();
    const wrong = round.options.find((o) => o.mistake === 'scale')!;
    expect(getResultMessage(round, wrong)).toBe(`Not quite. ${MISTAKE_EXPLANATIONS.scale} The right reading is 50 °C.`);
  });

  it('pins every explanation', () => {
    expect(MISTAKE_EXPLANATIONS).toEqual({
      'byte-order': 'That reads the payload little-endian. UDS data identifiers are big-endian: the first byte is the high byte.',
      sign: 'That ignores the sign bit. This signal is two’s-complement signed, so a leading byte of 0x80 or above is negative.',
      scale: 'That is the raw integer. The definition scales it before it means anything in physical units.',
      offset: 'That applies the scale but drops the offset, so every reading is shifted by a constant.',
    });
  });

  it('scores streaks and keeps the best', () => {
    const one = computeScoreUpdate(INITIAL_SCORE_STATE, true);
    const two = computeScoreUpdate(one, true);
    const broken = computeScoreUpdate(two, false);
    expect(one).toEqual({ score: 1, streak: 1, bestStreak: 1 });
    expect(two).toEqual({ score: 2, streak: 2, bestStreak: 2 });
    expect(broken).toEqual({ score: 2, streak: 0, bestStreak: 2 });
    expect(computeScoreUpdate(broken, true)).toEqual({ score: 3, streak: 1, bestStreak: 2 });
  });
});

describe('presentation helpers', () => {
  it('labels the SID, the identifier, and the payload', () => {
    expect([0, 1, 2, 3, 4].map(getByteRole)).toEqual(['sid', 'did', 'did', 'data', 'data']);
    // Each role must be visibly distinct, or the tiles stop teaching the frame layout.
    expect(getByteRoleClassName('sid')).toBe('border-amber-300/50 bg-amber-400/10 text-amber-200');
    expect(getByteRoleClassName('did')).toBe('border-violet-300/50 bg-violet-400/10 text-violet-200');
    expect(getByteRoleClassName('data')).toBe('border-cyan-300/60 bg-cyan-400/15 text-cyan-100');
  });

  it('derives option states from the choice', () => {
    const round = getInitialRound();
    const correct = round.options.find((o) => o.mistake === null)!;
    const wrong = round.options.find((o) => o.mistake !== null)!;
    const other = round.options.find((o) => o !== correct && o !== wrong)!;
    expect(getOptionVisualState(correct, null)).toBe('idle');
    expect(getOptionVisualState(correct, wrong)).toBe('correct');
    expect(getOptionVisualState(wrong, wrong)).toBe('wrong');
    expect(getOptionVisualState(wrong, correct)).toBe('dimmed');
    expect(getOptionVisualState(other, wrong)).toBe('dimmed');
    expect(getOptionClassName('idle')).toBe('border-white/15 bg-white/5 hover:border-cyan-300/60 hover:bg-cyan-400/10');
    expect(getOptionClassName('correct')).toBe('border-emerald-300/70 bg-emerald-400/15');
    expect(getOptionClassName('wrong')).toBe('border-rose-300/70 bg-rose-400/15');
    expect(getOptionClassName('dimmed')).toBe('border-white/10 bg-white/[0.02] opacity-60');
  });

  it('formats identifiers and requests as a tester writes them', () => {
    expect(formatDid(0x033e)).toBe('0x033E');
    expect(formatRequest(0x033e)).toBe('22 03 3E');
    expect(formatRequest(0xf40f)).toBe('22 F4 0F');
    expect(parseHexBytes(' 62 f4 0F ')).toEqual([0x62, 0xf4, 0x0f]);
    // Captures pasted from a terminal often carry runs of spaces.
    expect(parseHexBytes('62  F4   0F')).toEqual([0x62, 0xf4, 0x0f]);
  });
});
