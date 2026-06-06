import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');

describe('route deployment regression checks', () => {
  it('keeps canonical app routes and avoids conflicting .html app segments', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src/app/capstone/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'src/app/credentials/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'src/app/internet/page.tsx'))).toBe(true);

    expect(fs.existsSync(path.join(repoRoot, 'src/app/capstone.html/page.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/app/credentials.html/page.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/app/internet.html/page.tsx'))).toBe(false);
  });

  it('keeps extensionless Cloudflare rewrites for key exported pages', () => {
    const redirectsPath = path.join(repoRoot, 'public/_redirects');
    const redirects = fs.readFileSync(redirectsPath, 'utf8');

    expect(redirects).toContain('/capstone /capstone.html 200');
    expect(redirects).toContain('/capstone/ /capstone.html 200');
    expect(redirects).toContain('/credentials /credentials.html 200');
    expect(redirects).toContain('/credentials/ /credentials.html 200');
    expect(redirects).toContain('/internet /internet.html 200');
    expect(redirects).toContain('/internet/ /internet.html 200');
  });

  it('does not ship a production worker deployment surface in a Pages-only setup', () => {
    const wranglerConfig = fs.readFileSync(path.join(repoRoot, 'wrangler.toml'), 'utf8');

    expect(wranglerConfig).not.toContain('[env.production]');
    expect(wranglerConfig).not.toContain('routes = [');
    expect(fs.existsSync(path.join(repoRoot, 'public/_worker.js'))).toBe(false);
  });

  it('serves HTML 200 responses with a bfcache-safe Cache-Control (never no-store)', () => {
    const workerSrc = fs.readFileSync(path.join(repoRoot, 'src/index.js'), 'utf8');
    // `no-store` blocks back/forward cache restoration in Chrome and Firefox,
    // which manifests as the home page appearing to "break" on browser back.
    // The 404 fallback may still use no-store; only assert the HTML branch.
    const htmlBranch = workerSrc.match(/isHtmlLikePath\(resolvedPath\)[\s\S]*?\}\s*\n/);
    expect(htmlBranch?.[0]).toBeTruthy();
    expect(htmlBranch?.[0]).not.toContain('no-store');
  });

  it('public/_headers keeps HTML cacheable for bfcache', () => {
    const headers = fs.readFileSync(path.join(repoRoot, 'public/_headers'), 'utf8');
    const htmlBlock = headers.split('/*.html')[1] ?? '';
    expect(htmlBlock).not.toContain('no-store');
  });
});
