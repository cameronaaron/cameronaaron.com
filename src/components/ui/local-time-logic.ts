/** Cameron is in Los Angeles — the status pill shows his wall-clock time. */
export const LOCAL_TIME_ZONE = 'America/Los_Angeles';

/** Refresh cadence for the live clock. One timer, one O(1) format per tick. */
export const LOCAL_TIME_REFRESH_MS = 30_000;

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: LOCAL_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};

/**
 * Format a timestamp as LA wall-clock time (e.g. "2:34 PM"). Pure given the
 * input date; the component owns the single interval that supplies `now`.
 * O(1) — one Intl format call, no allocation beyond the returned string.
 */
export function formatLocalTime(now: Date): string {
  return new Intl.DateTimeFormat('en-US', TIME_FORMAT).format(now);
}

/** Hour (0–23) in LA, used to pick a day-part label without a second format. */
export function getLocalHour(now: Date): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: LOCAL_TIME_ZONE,
    hour: 'numeric',
    hour12: false,
  }).format(now);
  // "24" is midnight in some environments' hour12:false output — normalize to 0.
  return Number(hour) % 24;
}

const DAYPART_LABELS = [
  { untilHour: 5, label: 'up late' },
  { untilHour: 12, label: 'this morning' },
  { untilHour: 17, label: 'this afternoon' },
  { untilHour: 21, label: 'this evening' },
] as const;

/** A friendly day-part suffix chosen by the LA hour (dispatch, not if-chain). */
export function getDaypartLabel(now: Date): string {
  const hour = getLocalHour(now);
  for (const band of DAYPART_LABELS) {
    if (hour < band.untilHour) return band.label;
  }
  return 'tonight';
}
