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
});
