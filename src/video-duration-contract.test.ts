/**
 * Video duration contract.
 *
 * 2026-09-06: every `duration` in src/data/capstone.ts was the video's PLANNED
 * length, written while the series was being scripted and never reconciled
 * with what was published. All five were wrong. The rail heading compounded it
 * with a hand-typed "Five videos, about twelve minutes" that summed the plan
 * rather than the series — the real total is 19:08. /bridging-transitions is
 * the target of a QR code printed on a conference poster, so a stranger's
 * first act on the page was to press play and find the runtime under the title
 * wrong.
 *
 * Two joins had to hold and neither was watched:
 *
 *   - total vs parts. Fixed by construction: `seriesSummary` derives the
 *     heading from the durations, so there is no longer a second number to
 *     drift. Pinned by playlist-theater-logic.test.ts.
 *   - parts vs reality. That is this file. A duration typed by hand has no
 *     relationship to the video it claims to describe.
 *
 * The real check needs the network, so it splits the way `check:poster` and
 * `check:links` do: `pnpm run check:video-durations` asks YouTube and writes
 * scripts/checks/video-duration-ledger.json; this contract is the fast offline
 * half that runs on every commit and fails when capstone.ts disagrees with the
 * ledger. Editing a duration without re-running the check is a red gate.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { capstone } from '@/data/capstone';

interface LedgerEntry {
  duration: string;
  seconds: number;
  lastVerified: string;
}

const LEDGER_PATH = join(
  resolve(process.cwd()),
  'scripts',
  'checks',
  'video-duration-ledger.json',
);

const ledger: Record<string, LedgerEntry> = JSON.parse(readFileSync(LEDGER_PATH, 'utf8'));

describe('video duration contract', () => {
  it('has a verified ledger entry for every video the site lists', () => {
    const missing = capstone.videos
      .filter((video) => !ledger[video.youtubeId])
      .map((video) => `${video.id} (${video.youtubeId})`);

    expect(
      missing,
      `no ledger entry — run \`pnpm run check:video-durations\` for: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('declares the runtime YouTube actually reports', () => {
    const wrong = capstone.videos
      .filter((video) => ledger[video.youtubeId]?.duration !== video.duration)
      .map(
        (video) =>
          `${video.id}: capstone.ts says ${video.duration}, ` +
          `YouTube says ${ledger[video.youtubeId]?.duration}`,
      );

    expect(wrong, `declared runtimes disagree with the ledger:\n  ${wrong.join('\n  ')}`).toEqual(
      [],
    );
  });

  it('keeps no ledger entry for a video the site no longer lists', () => {
    const listed = new Set(capstone.videos.map((video) => video.youtubeId));
    const orphans = Object.keys(ledger).filter((id) => !listed.has(id));

    expect(orphans, `stale ledger entries: ${orphans.join(', ')}`).toEqual([]);
  });

  it('records when each entry was verified', () => {
    for (const [youtubeId, entry] of Object.entries(ledger)) {
      expect(entry.lastVerified, `${youtubeId} has no verification date`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
      expect(entry.seconds, `${youtubeId} has a non-positive length`).toBeGreaterThan(0);
    }
  });

  /** The regression itself, stated as the number it was wrong by. */
  it('totals the series at its real length, not the planned one', () => {
    const total = capstone.videos.reduce(
      (sum, video) => sum + (ledger[video.youtubeId]?.seconds ?? 0),
      0,
    );
    expect(total).toBe(1148);
  });
});
