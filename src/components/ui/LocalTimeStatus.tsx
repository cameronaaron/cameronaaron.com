'use client';

import { useEffect, useState } from 'react';

import {
  LOCAL_TIME_REFRESH_MS,
  formatLocalTime,
  getDaypartLabel,
} from '@/components/ui/local-time-logic';

/**
 * Live "· 2:34 PM in LA" clock for the hero availability pill. One interval
 * drives it; each tick does O(1) work (a single Intl format) and only commits
 * when the displayed minute actually changes. SSR-safe: renders nothing until
 * the client mounts, so the static HTML never bakes in a stale time.
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

  if (!label) return null;

  return (
    <span className="font-mono-accent text-cyan-100/70" data-testid="local-time-status">
      <span aria-hidden="true"> · </span>
      <span className="tabular-nums">{label}</span> in LA
      <span className="sr-only"> ({daypart})</span>
    </span>
  );
}
