import { execFileSync } from 'node:child_process';

// Local half of the leak-detection gate — CI runs the other half via
// gitleaks/gitleaks-action on every push/PR (.github/workflows/ci.yml).
// Catching a secret at commit time is cheaper than catching it after a push
// (see ENGINEERING-STANDARDS.md's mutation-testing rationale for the same
// "local gate carries real weight, CI is a second independent pass" logic).
const mode = process.argv[2];

const MODES = {
  '--staged': {
    args: ['protect', '--staged', '--redact', '-v'],
    description: 'staged changes',
  },
  '--full': {
    args: ['detect', '--source', '.', '--log-opts=--all', '--redact', '-v'],
    description: 'full git history',
  },
};

const config = MODES[mode];
if (!config) {
  console.error(`Usage: node scripts/checks/gitleaks-scan.mjs <${Object.keys(MODES).join('|')}>`);
  process.exit(1);
}

try {
  execFileSync('gitleaks', ['version'], { stdio: 'ignore' });
} catch {
  console.error(
    '\ngitleaks is not installed — required for the leak-detection gate.\n' +
      'Install it with `brew install gitleaks` (or see https://github.com/gitleaks/gitleaks#installing), then retry.\n',
  );
  process.exit(1);
}

try {
  execFileSync('gitleaks', config.args, { stdio: 'inherit' });
  console.log(`✓ gitleaks found no leaks in ${config.description}`);
} catch {
  console.error(`\n✗ gitleaks found a potential leak in ${config.description} — see output above.`);
  process.exit(1);
}
