/**
 * "Decode the Response" — paired with Mechanic, the open vehicle-diagnostics
 * project.
 *
 * Mechanic's premise is that the protocol stack is solved and the hard part is
 * knowing what a manufacturer's bytes mean: that on a 2015–2020 F-150 the PCM
 * answers identifier 0x1E1C with a 16-bit transmission-fluid temperature in
 * sixteenths of a degree. Its database makes that knowledge contributable by
 * requiring every data identifier to ship the raw bytes a contributor captured
 * next to the values they must decode to, and CI decodes them.
 *
 * Every round here IS one of those test vectors, copied from
 * db/module/ford/pcm.f150.2015-2020.toml with its signal definition. The player
 * reads a UDS positive response and picks the decoded value. The wrong options
 * are not random: each is what one specific, common decoding mistake produces —
 * reading the bytes little-endian, ignoring the sign bit, skipping the scale,
 * or dropping the offset. Those are exactly the errors a test vector exists to
 * catch before a reviewer has to trust anyone's bit offsets.
 *
 * Honest scope, matching the repository's own provenance blocks: these
 * scalings come from community sources (OBDb's Ford-F-150 signal set and
 * TheTom/elm327_obd_for_mac), are marked `unverified`, and the vectors prove
 * the arithmetic rather than a capture from a truck.
 *
 * Everything is pure and deterministic — rounds advance in catalog order — so
 * the first paint is identical on server and client (CLAUDE.md #10).
 */

/** UDS ReadDataByIdentifier request SID; a positive response adds 0x40. */
export const READ_DATA_BY_IDENTIFIER_SID = 0x22;
export const POSITIVE_RESPONSE_OFFSET = 0x40;
export const POSITIVE_RESPONSE_SID = READ_DATA_BY_IDENTIFIER_SID + POSITIVE_RESPONSE_OFFSET;

export type MistakeKind = 'byte-order' | 'sign' | 'scale' | 'offset';

export interface DecodeChallenge {
  /** Signal name as written in the module definition. */
  name: string;
  label: string;
  did: number;
  /** The test vector's response, exactly as it appears in the TOML. */
  responseHex: string;
  /** Width of the signal in bits, starting at bit 0 of the payload. */
  bits: 8 | 16;
  signed: boolean;
  unit: string;
  /** The definition's formula, as text for the player. */
  formulaText: string;
  /** The definition's formula. `withOffset: false` drops the additive term. */
  decode: (raw: number, withOffset: boolean) => number;
  /** The value the repository's test vector expects. */
  expected: number;
  /** The mistakes that produce a distinct wrong answer for this signal. */
  mistakes: readonly MistakeKind[];
}

export const MODULE_HEADER = 'Ford F-150 PCM · request 0x7E0 → response 0x7E8 · 2015–2020';

export const CHALLENGES: readonly DecodeChallenge[] = [
  {
    name: 'tft',
    label: 'Transmission fluid temperature',
    did: 0x1e1c,
    responseHex: '62 1E 1C 03 20',
    bits: 16,
    signed: false,
    unit: '°C',
    formulaText: 'raw / 16',
    decode: (raw) => raw / 16,
    expected: 50,
    mistakes: ['byte-order', 'scale'],
  },
  {
    name: 'cylinder_head_temp',
    label: 'Cylinder head temperature',
    did: 0x0334,
    responseHex: '62 03 34 0C 80',
    bits: 16,
    signed: true,
    unit: '°C',
    formulaText: 'raw / 64 (signed)',
    decode: (raw) => raw / 64,
    expected: 50,
    mistakes: ['byte-order', 'scale'],
  },
  {
    name: 'learned_octane_ratio',
    label: 'Learned octane ratio',
    did: 0x03e8,
    responseHex: '62 03 E8 F0 00',
    bits: 16,
    signed: true,
    unit: '',
    formulaText: 'raw / 16384 (signed)',
    decode: (raw) => raw / 16384,
    expected: -0.25,
    mistakes: ['sign', 'byte-order', 'scale'],
  },
  {
    name: 'desired_boost',
    label: 'Desired boost',
    did: 0x033e,
    responseHex: '62 03 3E 40 00',
    bits: 16,
    signed: false,
    unit: 'psi',
    formulaText: 'raw / 128 × 0.145 − 14.7',
    decode: (raw, withOffset) => (raw / 128) * 0.145 - (withOffset ? 14.7 : 0),
    expected: 3.86,
    mistakes: ['offset', 'byte-order', 'scale'],
  },
  {
    name: 'iat',
    label: 'Intake air temperature',
    did: 0xf40f,
    responseHex: '62 F4 0F 5A',
    bits: 8,
    signed: false,
    unit: '°C',
    formulaText: 'raw − 40',
    decode: (raw, withOffset) => raw - (withOffset ? 40 : 0),
    expected: 50,
    mistakes: ['offset'],
  },
  {
    name: 'axle_ratio',
    label: 'Axle gear ratio, measured',
    did: 0x1e16,
    responseHex: '62 1E 16 20 00',
    bits: 16,
    signed: false,
    unit: '',
    formulaText: 'raw / 4096',
    decode: (raw) => raw / 4096,
    expected: 2,
    mistakes: ['byte-order', 'scale'],
  },
];

export const MISTAKE_EXPLANATIONS: Record<MistakeKind, string> = {
  'byte-order':
    'That reads the payload little-endian. UDS data identifiers are big-endian: the first byte is the high byte.',
  sign: 'That ignores the sign bit. This signal is two’s-complement signed, so a leading byte of 0x80 or above is negative.',
  scale: 'That is the raw integer. The definition scales it before it means anything in physical units.',
  offset: 'That applies the scale but drops the offset, so every reading is shifted by a constant.',
};

export function parseHexBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (const token of hex.trim().split(/\s+/)) bytes.push(Number.parseInt(token, 16));
  return bytes;
}

export interface ParsedResponse {
  sid: number;
  did: number;
  payload: number[];
}

/** Splits a positive ReadDataByIdentifier response into SID, DID, and payload. */
export function parseResponse(hex: string): ParsedResponse {
  const bytes = parseHexBytes(hex);
  return { sid: bytes[0], did: (bytes[1] << 8) | bytes[2], payload: bytes.slice(3) };
}

/** Reads the payload's leading `bits` as an integer, honoring byte order and sign. */
export function readRaw(payload: readonly number[], bits: 8 | 16, signed: boolean, littleEndian: boolean): number {
  const unsignedValue =
    bits === 8 ? payload[0] : littleEndian ? payload[0] | (payload[1] << 8) : (payload[0] << 8) | payload[1];
  const signBit = 2 ** (bits - 1);
  return signed && unsignedValue >= signBit ? unsignedValue - 2 * signBit : unsignedValue;
}

/** The value a decoder produces when it makes `mistake` (or none). */
export function decodeWith(challenge: DecodeChallenge, mistake: MistakeKind | null): number {
  const { payload } = parseResponse(challenge.responseHex);
  const raw = readRaw(
    payload,
    challenge.bits,
    challenge.signed && mistake !== 'sign',
    mistake === 'byte-order'
  );
  if (mistake === 'scale') return raw;
  return challenge.decode(raw, mistake !== 'offset');
}

/** Rounds away floating-point noise; four decimals covers every catalog value. */
export function formatValue(value: number, unit: string): string {
  const rounded = Math.round(value * 10_000) / 10_000;
  return unit ? `${rounded} ${unit}` : String(rounded);
}

export interface DecodeOption {
  text: string;
  /** null for the correct reading. */
  mistake: MistakeKind | null;
}

export interface DecodeRound {
  index: number;
  challenge: DecodeChallenge;
  options: DecodeOption[];
}

/**
 * Builds a round: the correct reading plus one option per applicable mistake.
 * The correct option's slot rotates with the round index so position carries
 * no information.
 */
export function buildRound(index: number): DecodeRound {
  const challenge = CHALLENGES[index % CHALLENGES.length];
  const wrong: DecodeOption[] = [];
  for (const mistake of challenge.mistakes) {
    wrong.push({ text: formatValue(decodeWith(challenge, mistake), challenge.unit), mistake });
  }
  const correct: DecodeOption = { text: formatValue(decodeWith(challenge, null), challenge.unit), mistake: null };
  const slot = index % (wrong.length + 1);
  const options = [...wrong.slice(0, slot), correct, ...wrong.slice(slot)];
  return { index, challenge, options };
}

export function getInitialRound(): DecodeRound {
  return buildRound(0);
}

export function getNextRound(round: DecodeRound): DecodeRound {
  return buildRound(round.index + 1);
}

export function getResultMessage(round: DecodeRound, chosen: DecodeOption): string {
  const answer = formatValue(round.challenge.expected, round.challenge.unit);
  if (chosen.mistake === null) {
    return `Correct — ${answer}, the value the repository's test vector expects.`;
  }
  return `Not quite. ${MISTAKE_EXPLANATIONS[chosen.mistake]} The right reading is ${answer}.`;
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

export type ByteRole = 'sid' | 'did' | 'data';

/** Which part of the response each byte is, for colouring the byte tiles. */
export function getByteRole(position: number): ByteRole {
  if (position === 0) return 'sid';
  return position < 3 ? 'did' : 'data';
}

const BYTE_ROLE_CLASS: Record<ByteRole, string> = {
  sid: 'border-amber-300/50 bg-amber-400/10 text-amber-200',
  did: 'border-violet-300/50 bg-violet-400/10 text-violet-200',
  data: 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100',
};

export type OptionVisualState = 'idle' | 'correct' | 'wrong' | 'dimmed';

export function getOptionVisualState(option: DecodeOption, chosen: DecodeOption | null): OptionVisualState {
  if (chosen === null) return 'idle';
  if (option.mistake === null) return 'correct';
  return option === chosen ? 'wrong' : 'dimmed';
}

const OPTION_STATE_CLASS: Record<OptionVisualState, string> = {
  idle: 'border-white/15 bg-white/5 hover:border-cyan-300/60 hover:bg-cyan-400/10',
  correct: 'border-emerald-300/70 bg-emerald-400/15',
  wrong: 'border-rose-300/70 bg-rose-400/15',
  dimmed: 'border-white/10 bg-white/[0.02] opacity-60',
};

export function formatDid(did: number): string {
  return `0x${did.toString(16).toUpperCase().padStart(4, '0')}`;
}

/** The request a tester sends for `did`: the RDBI SID then the identifier's two bytes. */
export function formatRequest(did: number): string {
  const hex = did.toString(16).toUpperCase().padStart(4, '0');
  return `22 ${hex.slice(0, 2)} ${hex.slice(2)}`;
}

export function getByteRoleClassName(role: ByteRole): string {
  return BYTE_ROLE_CLASS[role];
}

export function getOptionClassName(state: OptionVisualState): string {
  return OPTION_STATE_CLASS[state];
}
