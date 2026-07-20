'use client';

import { useEffect, useState } from 'react';

import {
  LOCAL_TIME_REFRESH_MS,
  formatLocalTime,
  getDaypartLabel,
} from '@/components/ui/local-time-logic';

// Widest 12-hour LA time string ("12:30 PM" = 8 glyphs). With tabular-nums every
// digit is one advance, so this reserves the exact inline width of any real time
// and — critically — bakes the pill's line-wrap into the SSR HTML. The clock
// mounting client-side then swaps text into an already-sized slot: zero layout
// shift (the pre-fix null→text swap wrapped the pill to a second line and pushed
// the hero name/tagline/CTA — the LCP block — down, costing ~0.09 CLS).
const RESERVED_TIME_PLACEHOLDER = '12:30 PM';

/**
 * Live "· 2:34 PM in LA" clock for the hero availability pill. One interval
 * drives it; each tick does O(1) work (a single Intl format) and only commits
 * when the displayed minute actually changes. The slot is always rendered at a
 * fixed width (hidden until the real time arrives) so the layout never shifts.
 */
export default function LocalTimeStatus() {
  const [label, setLabel] = useState<string | null>(null);
  const [daypart, setDaypart] = useState('');

  useEffect(() => {
    const sync = () => {
      const now = new Date();
      const next = formatLocalTime(now);
      // Functional updater bails out when the minute is unchanged — no commit.
      setLabel((current) => (current === next ? current : next));
      setDaypart(getDaypartLabel(now));
    };

    sync();
    const id = window.setInterval(sync, LOCAL_TIME_REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  const ready = label !== null;

  return (
    <span
      className="font-mono-accent text-cyan-100/70"
      data-testid="local-time-status"
      // Hidden-but-present until the clock mounts: reserves the slot's exact
      // width so the availability pill wraps identically before and after.
      style={ready ? undefined : { visibility: 'hidden' }}
    >
      <span aria-hidden="true"> · </span>
      <span className="tabular-nums">{ready ? label : RESERVED_TIME_PLACEHOLDER}</span> in LA
      {ready ? <span className="sr-only"> ({daypart})</span> : null}
    </span>
  );
}
