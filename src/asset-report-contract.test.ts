// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = resolve('scripts/checks/performance-budgets.mjs');
const fixtures: string[] = [];
const validHome = '<img src="/images/profile-hero.avif" fetchPriority="high">' +
  '<script type="speculationrules">{"prefetch":[],"prerender":[]}</script>';

function fixture(home = validHome) {
  const root = mkdtempSync(join(tmpdir(), 'asset-report-'));
  fixtures.push(root);
  mkdirSync(join(root, 'out', '_next', 'static', 'chunks'), { recursive: true });
  for (const name of ['capstone.html', 'credentials.html', 'internet.html', 'bridging-transitions.html', 'sw.js']) {
    writeFileSync(join(root, 'out', name), '');
  }
  writeFileSync(join(root, 'out', 'index.html'), home);
  return root;
}

function run(root: string) {
  return spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
}

afterEach(() => {
  for (const root of fixtures) rmSync(root, { recursive: true, force: true });
  fixtures.length = 0;
});

describe('asset reporting and build integrity', () => {
  it('reports oversized assets without blocking a valid export', () => {
    const root = fixture();
    // Incompressible payload crosses the former raw AND gzip ceilings.
    const large = randomBytes(2_000_000).toString('hex');
    writeFileSync(join(root, 'out', 'index.html'), validHome + large);
    for (const name of ['large.html', 'large.js', 'large.css', 'large.avif', 'sw.js']) {
      writeFileSync(join(root, 'out', name), large);
    }
    mkdirSync(join(root, 'public'));
    writeFileSync(join(root, 'public', 'large.pdf'), large);
    const result = run(root);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Asset sizes (informational; no byte limits)');
    // The JS total includes both large.js and the service worker.
    expect(result.stdout).toContain('JS total: 8,000,000 bytes');
    expect(result.stdout).toContain('Largest CSS: 4,000,000 bytes');
    expect(result.stdout).toContain('Service worker: 4,000,000 bytes');
    expect(result.stdout).toContain('Public files total: 4,000,000 bytes');
  });

  it('still rejects a missing output directory', () => {
    const root = fixture();
    rmSync(join(root, 'out'), { recursive: true });
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Build output directory "out" not found');
  });

  it('still rejects a missing required page', () => {
    const root = fixture();
    rmSync(join(root, 'out', 'capstone.html'));
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Required output file is missing: out/capstone.html');
  });

  it.each([
    [validHome.replace('fetchPriority="high"', ''), 'LCP priority lost'],
    [validHome.replace('"prerender"', '"other"'), 'Speculation Rules missing'],
  ])('rejects broken loading markup: %s', (home, error) => {
    const result = run(fixture(home));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(error);
  });

  it.each([
    ['noModule', 'legacy();', 'noModule legacy bundle came back'],
    ['', '"trimStart"in String.prototype||(String.prototype.trimStart=String.prototype.trimLeft)', 'Legacy polyfill shipped to modern browsers'],
  ])('still rejects restored legacy code (%s)', (attribute, source, error) => {
    const root = fixture(validHome + `<script ${attribute} src="/_next/static/chunks/legacy.js"></script>`);
    writeFileSync(join(root, 'out', '_next', 'static', 'chunks', 'legacy.js'), source);
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(error);
  });
});
