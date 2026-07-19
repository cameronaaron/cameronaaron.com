import type { ApplicationWindow, NursingProgram } from '@/data/nursingPrograms';

export type WindowStatus = 'open' | 'closing-soon' | 'closed' | 'upcoming';

/** Below this many days-to-close, an open window is flagged "closing soon". */
export const CLOSING_SOON_DAYS = 14;

/** How often the dashboard re-reads the clock to refresh window statuses.
 *  Deadlines move in days, not seconds, so this stays coarse. */
export const NOW_REFRESH_MS = 5 * 60 * 1000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Pure — never reads `Date()` itself. The caller supplies `now` (read once,
 * post-mount, per the site's SSR-safe date pattern — see
 * src/components/ui/local-time-logic.ts), so this stays testable and never
 * causes a hydration mismatch on this static-export site.
 */
export function getWindowStatus(window: ApplicationWindow, now: Date): WindowStatus {
  const opens = new Date(window.opens);
  const closes = new Date(window.closes);

  if (now < opens) return 'upcoming';
  if (now > closes) return 'closed';

  const daysToClose = (closes.getTime() - now.getTime()) / MS_PER_DAY;
  return daysToClose <= CLOSING_SOON_DAYS ? 'closing-soon' : 'open';
}

export interface ActiveWindow {
  window: ApplicationWindow;
  status: WindowStatus;
}

/**
 * Picks the window most relevant right now: an open/closing-soon window
 * wins outright; otherwise the soonest upcoming window; otherwise the first
 * closed one on file (still useful context — "closed as of when"). Three
 * independent, sequential passes over what is always a tiny per-program
 * array (a handful of admission cycles) rather than one branch deciding
 * every concern mid-loop.
 */
export function getActiveWindow(program: NursingProgram, now: Date): ActiveWindow | null {
  const entries: ActiveWindow[] = program.applicationWindows.map((window) => ({
    window,
    status: getWindowStatus(window, now),
  }));

  const active = entries.find((entry) => entry.status === 'open' || entry.status === 'closing-soon');
  if (active) return active;

  let soonestUpcoming: ActiveWindow | null = null;
  for (const entry of entries) {
    if (entry.status !== 'upcoming') continue;
    if (!soonestUpcoming || new Date(entry.window.opens) < new Date(soonestUpcoming.window.opens)) {
      soonestUpcoming = entry;
    }
  }
  if (soonestUpcoming) return soonestUpcoming;

  // Every status is one of open/closing-soon/closed/upcoming; both prior
  // passes came up empty, so anything left in `entries` is closed — no
  // predicate needed, just take the first one on file.
  return entries[0] ?? null;
}

export const WINDOW_STATUS_STYLES: Record<WindowStatus, { label: string; className: string }> = {
  open: { label: 'Open now', className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200' },
  'closing-soon': { label: 'Closing soon', className: 'border-amber-400/25 bg-amber-500/10 text-amber-200' },
  closed: { label: 'Closed', className: 'border-white/15 bg-white/5 text-muted-foreground' },
  upcoming: { label: 'Upcoming', className: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200' },
};
