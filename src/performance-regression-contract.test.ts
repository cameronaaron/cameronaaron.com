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
    expect(scripts['test:performance']).toContain('npm run build');
    expect(scripts['test:performance']).toContain('npm run test:performance:contracts');
    expect(scripts['test:performance']).toContain('@lhci/cli');
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
          assertions?: Record<string, unknown>;
        };
      };
    };

    const assertions = lighthouseConfig.ci?.assert?.assertions ?? {};

    expect(assertions['categories:performance']).toBeTruthy();
    expect(assertions['first-contentful-paint']).toBeTruthy();
    expect(assertions['largest-contentful-paint']).toBeTruthy();
    expect(assertions['cumulative-layout-shift']).toBeTruthy();
    expect(assertions['total-blocking-time']).toBeTruthy();
    expect(assertions['speed-index']).toBeTruthy();
    expect(assertions['interactive']).toBeTruthy();
  });
});
