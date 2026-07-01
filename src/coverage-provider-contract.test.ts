import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('coverage provider contract', () => {
  it('keeps istanbul as the primary, strictly-thresholded coverage provider', () => {
    const config = read('vitest.config.ts');

    // Istanbul's explicit branch counting (ternaries, &&/||, optional chaining,
    // default params each counted separately) is the precise, enforced gate.
    expect(config).toContain("provider: 'istanbul'");
    expect(config).toContain('lines: 100');
    expect(config).toContain('functions: 100');
    expect(config).toContain('branches: 100');
    expect(config).toContain('statements: 100');
  });

  it('keeps a fast V8-provider script as a cross-check against istanbul', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      scripts?: Record<string, string>;
    };

    const scripts = packageJson.scripts ?? {};

    expect(scripts['test:coverage']).toBe('vitest run --coverage');
    // CLI override, not a second config file — inherits the same thresholds/
    // include/exclude from vitest.config.ts, just swaps the provider.
    expect(scripts['test:coverage:v8']).toContain('--coverage');
    expect(scripts['test:coverage:v8']).toContain('--coverage.provider=v8');
  });

  it('runs both coverage providers in CI — istanbul for the strict gate, V8 to catch provider-specific blind spots', () => {
    const ciWorkflow = read('.github/workflows/ci.yml');

    expect(ciWorkflow).toContain('pnpm run test:coverage');
    expect(ciWorkflow).toContain('pnpm run test:coverage:v8');
  });
});
