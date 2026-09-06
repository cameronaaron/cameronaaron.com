/**
 * Why /bridging-transitions detaches Cross-Origin-Embedder-Policy.
 *
 * ENGINEERING-STANDARDS §0: "impossible" is a claim to verify. The claim here
 * was the opposite — that the site's global `Cross-Origin-Embedder-Policy:
 * require-corp` would be fine with a YouTube embed, because YouTube does send
 * `cross-origin-resource-policy: cross-origin`. That reasoning is wrong, and
 * the failure is silent: the frame renders as an empty black box with NO
 * console error, and `next dev` never reproduces it because the dev server
 * sends none of public/_headers.
 *
 * So this measures it instead of arguing about it. It serves the real header
 * set at three COEP settings and asks a real Chrome whether the frame
 * committed a document.
 *
 * Recorded result, 2026-09-05, Chromium via playwright 1.62:
 *
 *   require-corp     frame did NOT commit   (no document, no console error)
 *   credentialless   frame did NOT commit   (COEP relaxes subresources; a
 *                                             nested DOCUMENT must still
 *                                             assert COEP, and YouTube sends
 *                                             only the report-only variant)
 *   (no COEP)        frame committed, 187KB document
 *
 * Re-run with `pnpm run check:coep-embed` if the header policy is ever
 * revisited, or if YouTube starts sending a real (non-report-only) COEP —
 * that is the reopen condition for putting require-corp back on this route.
 * This is a manual measurement tool, not a gate; the gate is the pin in
 * src/headers-integrity-contract.test.ts.
 */
import http from 'node:http';
import { chromium } from 'playwright';

import { capstone } from '../../src/data/capstone.ts';

const FIRST = capstone.videos[0];
const EMBED = `https://www.youtube-nocookie.com/embed/${FIRST.youtubeId}?list=${capstone.playlistId}&listType=playlist`;

/** Long enough for a cross-continent frame navigation on a slow link; the
 *  blocked cases fail closed and simply spend it. */
const FRAME_SETTLE_MS = 5000;

/** Serve one page carrying the same security headers public/_headers sends,
 *  with COEP varied. Port 0 so a stray dev server cannot be measured by
 *  mistake (§0.5: validate the ruler). */
function serve(coep) {
  return new Promise((resolve) => {
    const server = http.createServer((_req, res) => {
      const headers = {
        'Content-Type': 'text/html; charset=utf-8',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
      };
      if (coep) headers['Cross-Origin-Embedder-Policy'] = coep;
      res.writeHead(200, headers);
      res.end(
        `<!doctype html><title>coep probe</title>` +
          `<iframe id="f" width="560" height="315" src="${EMBED}" allowfullscreen></iframe>`,
      );
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function probe(coep) {
  const server = await serve(coep);
  const browser = await chromium.launch();
  const consoleErrors = [];

  try {
    const page = await browser.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
    await page.waitForTimeout(FRAME_SETTLE_MS);

    // The distinguishing signal: a BLOCKED frame element still exists in the
    // DOM with its src attribute intact, but never navigates, so no child
    // frame ever appears in page.frames(). Asserting on the element alone
    // would report success in every case.
    const frame = page.frames().find((candidate) => candidate.url().includes('youtube'));
    const documentBytes = frame ? (await frame.content()).length : 0;

    return {
      coep: coep ?? '(none)',
      frameCommitted: Boolean(frame),
      documentBytes,
      consoleErrors: consoleErrors.slice(0, 3),
    };
  } finally {
    await browser.close();
    server.close();
  }
}

for (const coep of ['require-corp', 'credentialless', null]) {
  const result = await probe(coep);
  console.log(
    `${result.coep.padEnd(15)} frame ${result.frameCommitted ? 'COMMITTED' : 'BLOCKED  '} ` +
      `${String(result.documentBytes).padStart(7)} bytes` +
      (result.consoleErrors.length ? `  errors: ${result.consoleErrors.join(' | ')}` : ''),
  );
}
