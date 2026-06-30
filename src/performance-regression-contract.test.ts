import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('performance regression contract', () => {
  it('keeps npm performance scripts wired for static budgets and lighthouse', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      scripts?: Record<string, string>;
    };

    const scripts = packageJson.scripts ?? {};

    expect(scripts['test:performance:contracts']).toBe('node scripts/performance-budgets.mjs');
    expect(scripts['test:performance']).toContain('pnpm run build');
    expect(scripts['test:performance']).toContain('pnpm run test:performance:contracts');
    expect(scripts['test:performance']).toContain('@lhci/cli');
    expect(scripts['deploy:pages:prod']).toContain('pnpm run test:performance');
  });

  it('keeps CI performance checks in both build contracts and lighthouse assertions', () => {
    const ciWorkflow = read('.github/workflows/ci.yml');

    expect(ciWorkflow).toContain('Run static performance budget contracts');
    expect(ciWorkflow).toContain('npm run test:performance:contracts');
    expect(ciWorkflow).toContain('Lighthouse Assertions');
    expect(ciWorkflow).toContain('configPath: ./lighthouserc.json');
  });

  it('keeps lighthouse thresholds for performance and core web vitals assertions', () => {
    const lighthouseConfig = JSON.parse(read('lighthouserc.json')) as {
      ci?: {
        assert?: {
          preset?: string;
          assertions?: Record<string, unknown>;
        };
      };
    };

    expect(lighthouseConfig.ci?.assert?.preset).toBe('lighthouse:recommended');

    const assertions = lighthouseConfig.ci?.assert?.assertions ?? {};

    expect(assertions['categories:performance']).toBeTruthy();
    // Score must be 1.0 (100) — we achieved this via CLS elimination and hold the line.
    expect(assertions['categories:performance']).toEqual(['error', { minScore: 1 }]);
    expect(assertions['categories:accessibility']).toEqual(['error', { minScore: 1 }]);
    expect(assertions['categories:best-practices']).toEqual(['error', { minScore: 1 }]);
    expect(assertions['categories:seo']).toEqual(['error', { minScore: 1 }]);
    expect(assertions['first-contentful-paint']).toBeTruthy();
    expect(assertions['largest-contentful-paint']).toBeTruthy();
    expect(assertions['cumulative-layout-shift']).toBeTruthy();
    expect(assertions['total-blocking-time']).toBeTruthy();
    expect(assertions['speed-index']).toBeTruthy();
    expect(assertions['interactive']).toBeTruthy();
    expect(assertions['image-delivery-insight']).toBe('warn');
    expect(assertions['label-content-name-mismatch']).toBe('warn');
    expect(assertions['legacy-javascript-insight']).toBe('warn');
    expect(assertions['network-dependency-tree-insight']).toBe('warn');
    expect(assertions['unused-javascript']).toBe('warn');
    expect(assertions['uses-responsive-images']).toBe('warn');
  });

  it('keeps pre-deployment verification wired to strict performance checks', () => {
    const verifyScript = read('verify-deployment.sh');

    expect(verifyScript).toContain('pnpm run test:performance');
  });
});
