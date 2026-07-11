/**
 * Config integrity contract.
 *
 * Every quality gate in this repo is itself configured somewhere — tsconfig
 * strictness, the 100% coverage thresholds, the static-export settings, the
 * pinned Node major. A one-line config edit can silently disarm all of them
 * while every test stays green (weakened thresholds still "pass"). This
 * contract pins the configuration OF the gates, the same way the complexity
 * contract pins its own pre-commit wiring.
 *
 * When a pinned value legitimately changes (e.g. a Node major upgrade),
 * update source, this contract, and the docs together — that is a
 * requirements change (ENGINEERING-STANDARDS §6.8), not test weakening.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('config-integrity-contract — TypeScript stays strict', () => {
  it('tsconfig keeps strict mode and casing consistency on', () => {
    const tsconfig = read('tsconfig.json');
    expect(tsconfig).toMatch(/"strict":\s*true/);
    expect(tsconfig).toMatch(/"forceConsistentCasingInFileNames":\s*true/);
    // Nobody quietly opts files out of checking.
    expect(tsconfig).not.toMatch(/"strict":\s*false/);
    expect(tsconfig).not.toMatch(/"noEmitOnError":\s*false/);
  });
});

describe('config-integrity-contract — the coverage gate stays at 100%', () => {
  it('vitest coverage thresholds are 100 on all four metrics', () => {
    const config = read('vitest.config.ts');
    const thresholds = config.match(/thresholds:\s*\{([^}]*)\}/);
    expect(thresholds, 'vitest.config.ts must declare coverage thresholds').not.toBeNull();
    for (const metric of ['lines', 'functions', 'branches', 'statements']) {
      expect(thresholds![1]).toMatch(new RegExp(`${metric}:\\s*100`));
    }
  });
});

describe('config-integrity-contract — static export invariants', () => {
  it("next.config keeps output: 'export', strict mode, and unoptimized images", () => {
    const config = read('next.config.mjs');
    // The whole deploy pipeline (Cloudflare Pages serving /out) assumes these.
    expect(config).toContain("output: 'export'");
    expect(config).toMatch(/reactStrictMode:\s*true/);
    expect(config).toMatch(/unoptimized:\s*true/);
  });
});

describe('config-integrity-contract — one Node major everywhere', () => {
  it('.nvmrc, package.json engines, and every CI workflow agree on the Node major', () => {
    const nvmMajor = Number.parseInt(read('.nvmrc').trim(), 10);
    expect(Number.isInteger(nvmMajor), '.nvmrc must contain a Node major version').toBe(true);

    const enginesNode = (JSON.parse(read('package.json')) as { engines?: { node?: string } }).engines?.node ?? '';
    const enginesMajor = Number.parseInt(enginesNode.replace(/^[^\d]*/, ''), 10);
    expect(enginesMajor, `package.json engines.node ("${enginesNode}") must state the same major as .nvmrc`).toBe(nvmMajor);

    const workflowsDir = join(ROOT, '.github', 'workflows');
    let checkedAny = false;
    for (const entry of readdirSync(workflowsDir)) {
      if (!/\.ya?ml$/.test(entry)) continue;
      const workflow = readFileSync(join(workflowsDir, entry), 'utf8');
      for (const match of workflow.matchAll(/node-version:\s*['"]?(\d+)/g)) {
        checkedAny = true;
        expect(
          Number.parseInt(match[1], 10),
          `${entry} pins node-version ${match[1]} but .nvmrc says ${nvmMajor}`,
        ).toBe(nvmMajor);
      }
    }
    expect(checkedAny, 'no workflow declares node-version — CI must pin the Node major').toBe(true);
  });
});
