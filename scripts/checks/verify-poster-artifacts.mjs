/**
 * Verify the poster PDFs this site serves, and refresh their ledger.
 *
 * Origin (2026-09-06): /bridging-transitions shipped serving a copy of the
 * SNS26 poster taken from the poster repo at one moment in time. That repo
 * kept moving, and the served copy silently became a poster whose printed QR
 * code pointed at the site ROOT — so a visitor who downloaded the poster from
 * the landing page got a poster that led back to the homepage instead of to
 * the page they were standing on. Nothing was watching: the bytes are opaque,
 * the page still rendered, every test still passed.
 *
 * The thing that must never drift is not the file's provenance but a property
 * INSIDE it: the QR code printed on a poster served at /bridging-transitions
 * has to resolve to /bridging-transitions. That is only checkable by actually
 * decoding the code, which needs a rasteriser and a QR reader — too heavy for
 * the commit gate, and the same shape of problem as external link liveness.
 * So it uses the same solution as `check:links`: this networked/tool-dependent
 * script does the real work and writes a ledger; the fast offline contract
 * (src/poster-artifact-contract.test.ts) fails the commit if a PDF's bytes no
 * longer match its ledger entry. Swapping a PDF without re-running this is
 * therefore a red gate, not a silent regression.
 *
 * Text extraction is deliberately NOT the check. Typst subsets its fonts, so
 * the URL is not recoverable as plain text from the PDF's content streams
 * (verified: 18 inflated streams, zero containing the literal path). Decoding
 * the actual QR is both the stronger property and the only workable one.
 *
 * Requires `pdftoppm` (poppler) and `zbarimg` (zbar), the same posture as the
 * gitleaks wrapper: an external tool the script shells out to and fails loudly
 * without, rather than a vendored dependency.
 *
 *   pnpm run check:poster
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const POSTER_DIR = join(ROOT, 'public', 'poster');
const LEDGER_PATH = join(ROOT, 'scripts', 'checks', 'poster-artifact-ledger.json');

/** Rasterise at a resolution high enough that a 1.5in code on a 48in sheet
 *  still lands on enough pixels to decode. 150dpi clears it with room. */
const RASTER_DPI = 150;

function requireTool(tool) {
  try {
    execFileSync('which', [tool], { stdio: 'pipe' });
  } catch {
    console.error(
      `\n${tool} is not installed. This check decodes the QR code inside each\n` +
        `served poster PDF and cannot be faked from the file's text.\n` +
        `  brew install ${tool === 'zbarimg' ? 'zbar' : 'poppler'}\n`,
    );
    process.exit(1);
  }
}

/** Decode every QR code on page 1 of a PDF. Returns the decoded strings. */
function decodeQrCodes(pdfPath) {
  const work = mkdtempSync(join(tmpdir(), 'poster-qr-'));
  try {
    const stem = join(work, 'page');
    execFileSync('pdftoppm', ['-png', '-r', String(RASTER_DPI), '-f', '1', '-l', '1', pdfPath, stem], {
      stdio: 'pipe',
    });
    const png = readdirSync(work).find((name) => name.endsWith('.png'));
    if (!png) throw new Error(`pdftoppm produced no image for ${pdfPath}`);

    // zbarimg exits 4 when it finds nothing — that is a real result here
    // (a poster with no scannable code), not a crash, so catch and report it.
    let out = '';
    try {
      out = execFileSync('zbarimg', ['--quiet', '--raw', join(work, png)], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      if (error.status === 4) return [];
      throw error;
    }
    return out.split('\n').map((line) => line.trim()).filter(Boolean);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

requireTool('pdftoppm');
requireTool('zbarimg');

const pdfs = readdirSync(POSTER_DIR).filter((name) => name.endsWith('.pdf')).sort();
if (pdfs.length === 0) {
  console.error('public/poster/ holds no PDFs — nothing to verify.');
  process.exit(1);
}

const ledger = {};
let failed = false;

for (const name of pdfs) {
  const full = join(POSTER_DIR, name);
  const bytes = readFileSync(full);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const decoded = decodeQrCodes(full);

  if (decoded.length === 0) {
    console.error(`✗ ${name}: no QR code could be decoded from page 1`);
    failed = true;
    continue;
  }

  ledger[name] = {
    sha256,
    bytes: bytes.length,
    qrTargets: decoded,
    lastVerified: new Date().toISOString().slice(0, 10),
  };
  console.log(`✓ ${name}  ${(bytes.length / 1024).toFixed(0)}KB  ->  ${decoded.join(', ')}`);
}

if (failed) process.exit(1);

writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(`\nwrote ${LEDGER_PATH.replace(`${ROOT}/`, '')}`);
