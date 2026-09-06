// Boots `wrangler pages dev out`, waits until it responds, then issues one
// warm-up request per page before printing the ready marker LHCI waits for.
//
// Why: LHCI's startServerCommand boots a COLD wrangler dev server, and its
// first requests (worker compile, lazy asset reads) are several times slower
// than steady-state. Lighthouse's lantern simulation scales those observed
// latencies up under throttling, so cold-start noise inflated LCP by 3-6s
// across otherwise-identical runs (measured 2026-07-19: 9.5s/9.5s/6.0s cold
// vs 3.8s warm for the same build). Warming first makes the gate measure the
// build, not wrangler's boot path.
import { spawn, execSync } from 'node:child_process';

const PORT = process.env.PORT ?? '3000';
const BASE = `http://127.0.0.1:${PORT}`;
const WARMUP_PATHS = ['/', '/capstone', '/credentials', '/internet', '/nursing', '/bridging-transitions'];

// ── Measurement-integrity guard (ENGINEERING-STANDARDS §0.5) ────────────────
// Every number this server feeds a gate is only as trustworthy as "am I even
// measuring the right build?". Twice (2026-07-19 and 2026-07-20) a stray
// `next dev` was left listening on PORT, Lighthouse audited the DEV bundle
// instead of /out, and the resulting numbers drove real decisions the wrong
// way — including reverting a LazyMotion migration that was actually a win.
// §4.7 item 8 documented "check pgrep first" after the first incident and it
// STILL recurred, because a documented instruction is not a gate. So: refuse
// to start against an occupied port, and refuse to declare ready until the
// bytes on the wire are provably the production export.
function assertPortIsFree() {
  let occupants = '';
  try {
    occupants = execSync(`lsof -iTCP:${PORT} -sTCP:LISTEN -n -P 2>/dev/null || true`, {
      encoding: 'utf8',
    }).trim();
  } catch {
    // lsof unavailable (non-macOS/Linux) — fall back to the response-content
    // check below, which catches the same contamination one step later.
    return;
  }
  if (!occupants) return;

  console.error(
    [
      '',
      `✗ REFUSING TO MEASURE: port ${PORT} is already in use, so any number produced here`,
      '  would describe whatever is already listening — not this repo\'s /out build.',
      '',
      occupants,
      '',
      '  This is the exact contamination that produced false Lighthouse data twice',
      '  (ENGINEERING-STANDARDS §0.5 / §4.7 item 8). Usually a leftover `next dev`.',
      '',
      `  Fix: pkill -f "next dev"; pkill -f "wrangler pages dev"   (or free port ${PORT})`,
      '',
    ].join('\n'),
  );
  process.exit(1);
}

assertPortIsFree();

const server = spawn('npx', ['wrangler', 'pages', 'dev', 'out', '--port', PORT, '--ip', '127.0.0.1'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.pipe(process.stdout);
server.stderr.pipe(process.stderr);
server.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.kill(signal);
  });
}

const deadline = Date.now() + 60_000;
let homepageHtml = '';
while (Date.now() < deadline) {
  try {
    const res = await fetch(BASE);
    if (res.ok) {
      homepageHtml = await res.text();
      break;
    }
  } catch {
    // not up yet
  }
  await new Promise((r) => setTimeout(r, 500));
}

// Prove the responder is the production export before any gate trusts it.
// A dev build is unmistakable: Next injects its devtools bundle and serves
// unhashed `_next/static/chunks/_next_dist_*` module paths, where a production
// export serves content-hashed chunk filenames and no devtools.
function assertServingProductionBuild(html) {
  if (!html) {
    console.error(`\n✗ REFUSING TO MEASURE: no response from ${BASE} within 60s.\n`);
    process.exit(1);
  }

  const devMarkers = ['next-devtools', '_next_dist_compiled', '_next_dist_client', '__nextDevClientId'];
  const found = devMarkers.filter((marker) => html.includes(marker));
  const hasHashedChunk = /_next\/static\/chunks\/[A-Za-z0-9_-]{6,}\.js/.test(html);

  if (found.length > 0 || !hasHashedChunk) {
    console.error(
      [
        '',
        `✗ REFUSING TO MEASURE: ${BASE} is not serving this repo's production /out build.`,
        found.length ? `  dev-build markers present: ${found.join(', ')}` : '',
        hasHashedChunk ? '' : '  no content-hashed _next/static chunk found in the HTML',
        '',
        '  Measuring a dev build yields numbers that look catastrophic and are',
        '  meaningless (unminified, devtools attached). This exact contamination',
        '  produced false data twice — see ENGINEERING-STANDARDS §0.5.',
        '',
        '  Fix: pkill -f "next dev"; pnpm run build; retry.',
        '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    server.kill('SIGTERM');
    process.exit(1);
  }
}

assertServingProductionBuild(homepageHtml);

for (const path of WARMUP_PATHS) {
  // Twice each: the first request triggers lazy compilation, the second
  // confirms the warmed path is actually serving at steady-state speed.
  for (let i = 0; i < 2; i += 1) {
    try {
      await fetch(`${BASE}${path}`);
    } catch {
      // warm-up is best-effort; the gate itself will surface real failures
    }
  }
}

console.log(`WARM_READY on ${BASE}`);
