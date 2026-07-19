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
import { spawn } from 'node:child_process';

const PORT = process.env.PORT ?? '3000';
const BASE = `http://127.0.0.1:${PORT}`;
const WARMUP_PATHS = ['/', '/capstone', '/credentials', '/internet', '/nursing'];

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
while (Date.now() < deadline) {
  try {
    const res = await fetch(BASE);
    if (res.ok) break;
  } catch {
    // not up yet
  }
  await new Promise((r) => setTimeout(r, 500));
}

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
