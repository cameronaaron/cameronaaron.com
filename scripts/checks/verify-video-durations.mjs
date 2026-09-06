/**
 * Verify the declared runtime of every capstone video against YouTube, and
 * refresh the ledger the offline contract pins.
 *
 * Origin (2026-09-06): every duration in src/data/capstone.ts was the video's
 * PLANNED length, entered while the series was being written and never
 * reconciled with what was actually published. All five were wrong — the page
 * advertised 2:30 / 2:40 / 2:35 / 2:40 / 2:50 for videos that run 3:12 / 2:33 /
 * 4:42 / 3:41 / 5:00 — and a hand-typed "Five videos, about twelve minutes"
 * summed the plan rather than the series, understating it by seven minutes.
 * The page is the target of a printed QR code on a conference poster, so the
 * first thing a stranger does with it is press play and discover the number
 * under the title is wrong.
 *
 * The heading is now derived from the durations (seriesSummary), which closes
 * total-vs-parts. This closes parts-vs-reality, which is what actually drifted:
 * a duration written down by hand has no relationship to the video it
 * describes, and nothing was watching the join.
 *
 * Same two-part shape as `check:poster` and `check:links`, for the same reason
 * — the real check needs the network, so it cannot sit in the commit gate:
 *
 *   - this script asks YouTube what each video actually runs and writes the
 *     ledger;
 *   - src/video-duration-contract.test.ts is the fast offline half, failing the
 *     commit when capstone.ts disagrees with the ledger.
 *
 * Editing a duration by hand without re-running this is therefore a red gate,
 * not a silent regression.
 *
 * Uses YouTube's public oEmbed/watch page rather than the Data API so it needs
 * no key. Durations come from the watch page's `approxDurationMs`/`lengthSeconds`,
 * which is what the player itself reads.
 *
 *   pnpm run check:video-durations
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const LEDGER_PATH = join(ROOT, 'scripts', 'checks', 'video-duration-ledger.json');
const CAPSTONE_PATH = join(ROOT, 'src', 'data', 'capstone.ts');

const SECONDS_PER_MINUTE = 60;

/** `PT3M12S` from a whole number of seconds — the shape capstone.ts stores. */
export function toIsoDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `PT${minutes}M${seconds}S`;
}

/** Pull `youtubeId` / `duration` pairs straight out of the data file's source.
 *  Reading the .ts rather than importing it keeps this script free of the app's
 *  TypeScript/alias resolution, the same posture as the other check scripts. */
function declaredVideos() {
  const source = readFileSync(CAPSTONE_PATH, 'utf8');
  const pattern =
    /youtubeId:\s*'([\w-]{11})'[\s\S]*?duration:\s*'(PT\d+M\d+S)'/g;
  const found = [];
  let match;
  while ((match = pattern.exec(source)) !== null) {
    found.push({ youtubeId: match[1], declared: match[2] });
  }
  return found;
}

/** Seconds YouTube reports for a video, or undefined if it cannot be read. */
async function actualSeconds(youtubeId) {
  const response = await fetch(`https://www.youtube.com/watch?v=${youtubeId}`, {
    headers: { 'accept-language': 'en-US,en;q=0.9' },
  });
  if (!response.ok) return undefined;

  const html = await response.text();
  // lengthSeconds is the player's own field and is present on the watch page
  // for public videos; approxDurationMs is the streaming-data fallback.
  const lengthSeconds = /"lengthSeconds":"(\d+)"/.exec(html);
  if (lengthSeconds) return Number(lengthSeconds[1]);

  const approxMs = /"approxDurationMs":"(\d+)"/.exec(html);
  if (approxMs) return Math.round(Number(approxMs[1]) / 1000);

  return undefined;
}

const videos = declaredVideos();
if (videos.length === 0) {
  console.error(`no videos parsed out of ${CAPSTONE_PATH.replace(`${ROOT}/`, '')}`);
  process.exit(1);
}

const ledger = {};
let failed = false;

for (const { youtubeId, declared } of videos) {
  const seconds = await actualSeconds(youtubeId);
  if (seconds === undefined) {
    console.error(`✗ ${youtubeId}: YouTube did not report a duration`);
    failed = true;
    continue;
  }

  const actual = toIsoDuration(seconds);
  const agrees = actual === declared;
  if (!agrees) failed = true;

  ledger[youtubeId] = {
    duration: actual,
    seconds,
    lastVerified: new Date().toISOString().slice(0, 10),
  };

  const mark = agrees ? '✓' : '✗';
  const note = agrees ? '' : `  (capstone.ts says ${declared} — update it)`;
  console.log(`${mark} ${youtubeId}  ${actual}  ${seconds}s${note}`);
}

const total = Object.values(ledger).reduce((sum, entry) => sum + entry.seconds, 0);
console.log(
  `\ntotal ${total}s = ${Math.floor(total / SECONDS_PER_MINUTE)}:` +
    `${String(total % SECONDS_PER_MINUTE).padStart(2, '0')}`,
);

writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(`wrote ${LEDGER_PATH.replace(`${ROOT}/`, '')}`);

if (failed) process.exit(1);
