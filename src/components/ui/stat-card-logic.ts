export const STAT_COUNT_UP_DURATION_S = 1.4;

export interface ParsedStatValue {
  /** Numeric part to count up to, or null when the value isn't countable. */
  target: number | null;
  /** Trailing decoration preserved verbatim ("+", "%", "K+", …). */
  suffix: string;
}

const LEADING_INTEGER_PATTERN = /^(\d+)(.*)$/;

/** Split "50+" into { target: 50, suffix: '+' }; non-numeric values opt out. */
export function parseStatValue(value: string): ParsedStatValue {
  const match = LEADING_INTEGER_PATTERN.exec(value);
  if (!match) return { target: null, suffix: '' };
  return { target: Number(match[1]), suffix: match[2] };
}

/** Render one count-up frame's text ("37+" for latest=37, suffix='+'). */
export function formatStatValue(latest: number, suffix: string): string {
  return `${Math.round(latest)}${suffix}`;
}
