import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');

/** Real source span of the `if`/`else if` block whose condition calls
 * `isHtmlLikePath(...)`, rather than a lazy `[\s\S]*?\}` scan from the call
 * site to the next `}`. That lazy regex happens to land on the right brace
 * only because today's branch body has no nested block of its own — adding
 * one (an inner `if`, a `try`, anything with its own `{...}`) would make the
 * lazy match stop at that INNER closing brace, silently narrowing what the
 * check inspects and potentially hiding a real `no-store` regression added
 * after the truncation point but still inside the real branch. */
function findHtmlBranchSource(workerSrc: string): string | undefined {
  const sourceFile = ts.createSourceFile('index.js', workerSrc, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let branch: ts.Node | undefined;

  const visit = (node: ts.Node) => {
    if (branch) return;
    if (
      ts.isIfStatement(node) &&
      ts.isCallExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'isHtmlLikePath'
    ) {
      branch = node.thenStatement;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return branch?.getText(sourceFile);
}

describe('route deployment regression checks', () => {
  it('keeps canonical app routes and avoids conflicting .html app segments', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src/app/capstone/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'src/app/credentials/page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'src/app/internet/page.tsx'))).toBe(true);

    expect(fs.existsSync(path.join(repoRoot, 'src/app/capstone.html/page.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/app/credentials.html/page.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/app/internet.html/page.tsx'))).toBe(false);
  });

  it('uses loop-safe legacy .html redirects without extensionless self-rewrites', () => {
    const redirectsPath = path.join(repoRoot, 'public/_redirects');
    const redirects = fs.readFileSync(redirectsPath, 'utf8');

    expect(redirects).toContain('/capstone.html /capstone 301');
    expect(redirects).toContain('/credentials.html /credentials 301');
    expect(redirects).toContain('/internet.html /internet 301');

    // Guard against rewrite loops like /route -> /route.html 200 combined with /route.html -> /route 301.
    expect(redirects).not.toContain('/capstone /capstone.html 200');
    expect(redirects).not.toContain('/credentials /credentials.html 200');
    expect(redirects).not.toContain('/internet /internet.html 200');
  });

  it('prevents rewrite/redirect cycles for extensionless and .html route pairs', () => {
    const redirectsPath = path.join(repoRoot, 'public/_redirects');
    const redirects = fs.readFileSync(redirectsPath, 'utf8');

    const routeRules = redirects
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.startsWith('/'))
      .map((line) => {
        const [from, to, status] = line.split(/\s+/);
        return { from, to, status };
      })
      .filter((rule) => rule.from && rule.to && rule.status);

    const rewriteToHtml = new Set(
      routeRules
        .filter((rule) => rule.status === '200' && /\.html$/.test(rule.to) && !/\.html$/.test(rule.from))
        .map((rule) => `${rule.from}=>${rule.to}`)
    );

    const redirectFromHtml = new Set(
      routeRules
        .filter((rule) => /^30[1278]$/.test(rule.status) && /\.html$/.test(rule.from) && !/\.html$/.test(rule.to))
        .map((rule) => `${rule.from}=>${rule.to}`)
    );

    const loops: string[] = [];
    for (const rewrite of rewriteToHtml) {
      const [from, to] = rewrite.split('=>');
      const reverseKey = `${to}=>${from}`;
      if (redirectFromHtml.has(reverseKey)) {
        loops.push(`${from} <-> ${to}`);
      }
    }

    expect(loops).toEqual([]);
  });

  it('does not include a GitHub deploy workflow that requires Cloudflare secrets', () => {
    const deployWorkflowPath = path.join(repoRoot, '.github/workflows/deploy-production.yml');
    expect(fs.existsSync(deployWorkflowPath)).toBe(false);

    const ciWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');
    expect(ciWorkflow).not.toContain('workflow-order-guard');
    expect(ciWorkflow).not.toContain('deploy-production.yml');
    expect(ciWorkflow).not.toContain('CLOUDFLARE_API_TOKEN');
    expect(ciWorkflow).not.toContain('CLOUDFLARE_ACCOUNT_ID');
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
    const htmlBranch = findHtmlBranchSource(workerSrc);
    expect(htmlBranch).toBeTruthy();
    expect(htmlBranch).not.toContain('no-store');
  });

  it('public/_headers keeps HTML cacheable for bfcache', () => {
    const headers = fs.readFileSync(path.join(repoRoot, 'public/_headers'), 'utf8');
    const htmlBlock = headers.split('/*.html')[1] ?? '';
    expect(htmlBlock).not.toContain('no-store');
  });
});
