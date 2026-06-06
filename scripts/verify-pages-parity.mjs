import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function read(relPath) {
  return readFileSync(resolve(root, relPath), 'utf8');
}

function assertMatches(content, checks, label, errors) {
  for (const check of checks) {
    if (!check.pattern.test(content)) {
      errors.push(`${label}: missing ${check.description}`);
    }
  }
}

const redirects = read('public/_redirects');
const headers = read('public/_headers');
const worker = read('public/_worker.js');
const pkgRaw = read('package.json');
const workflow = read('.github/workflows/deploy-production.yml');

const packageJson = JSON.parse(pkgRaw);
const scripts = packageJson.scripts ?? {};

const errors = [];

assertMatches(
  redirects,
  [
    {
      description: 'www to apex redirect rule',
      pattern: /^https:\/\/www\.cameronaaron\.com\/\*\s+https:\/\/cameronaaron\.com\/:splat\s+301$/m,
    },
    {
      description: 'workshop host redirect rule',
      pattern: /^https:\/\/workshop\.cameronaaron\.com\/\*\s+https:\/\/cameronaaron\.com\/\s+301$/m,
    },
    {
      description: '2eschool host redirect rule',
      pattern: /^https:\/\/2eschool\.org\/\*\s+https:\/\/cameronaaron\.com\/\s+301$/m,
    },
    {
      description: 'www 2eschool host redirect rule',
      pattern: /^https:\/\/www\.2eschool\.org\/\*\s+https:\/\/cameronaaron\.com\/\s+301$/m,
    },
    {
      description: 'index canonicalization rule',
      pattern: /^\/index\.html\s+\/\s+301$/m,
    },
    {
      description: 'extensionless capstone rewrite',
      pattern: /^\/capstone\s+\/capstone\.html\s+200$/m,
    },
  ],
  'public/_redirects',
  errors
);

assertMatches(
  worker,
  [
    {
      description: 'canonical host constant',
      pattern: /const CANONICAL_HOST = 'cameronaaron\.com';/m,
    },
    {
      description: 'www host redirect set',
      pattern: /HOSTS_REDIRECT_WITH_PATH = new Set\(\['www\.cameronaaron\.com'\]\);/m,
    },
    {
      description: 'workshop host redirect set',
      pattern: /HOSTS_REDIRECT_TO_ROOT = new Set\(\[[^\]]*'workshop\.cameronaaron\.com'[^\]]*'2eschool\.org'[^\]]*'www\.2eschool\.org'[^\]]*\]\);/m,
    },
    {
      description: 'index.html canonicalization in worker',
      pattern: /if \(url\.pathname === '\/index\.html'\)/m,
    },
  ],
  'public/_worker.js',
  errors
);

assertMatches(
  headers,
  [
    {
      description: 'X-Frame-Options deny policy',
      pattern: /^\s*X-Frame-Options:\s*DENY\s*$/m,
    },
    {
      description: 'nosniff header policy',
      pattern: /^\s*X-Content-Type-Options:\s*nosniff\s*$/m,
    },
    {
      description: 'referrer policy',
      pattern: /^\s*Referrer-Policy:\s*strict-origin-when-cross-origin\s*$/m,
    },
    {
      description: 'immutable static asset cache policy',
      pattern: /^\s*Cache-Control:\s*public,\s*max-age=31536000,\s*immutable\s*$/m,
    },
    {
      description: '404 no-store cache policy',
      pattern: /^\/404\.html[\s\S]*?^\s*Cache-Control:\s*no-store,\s*max-age=0,\s*must-revalidate\s*$/m,
    },
  ],
  'public/_headers',
  errors
);

if (scripts['deploy:prod'] !== 'npm run deploy:pages:prod') {
  errors.push('package.json: deploy:prod must point to npm run deploy:pages:prod');
}

if (typeof scripts['deploy:pages:prod'] !== 'string' || !scripts['deploy:pages:prod'].includes('wrangler pages deploy out')) {
  errors.push('package.json: deploy:pages:prod must run wrangler pages deploy out');
}

if (!/^\s*name:\s*Deploy to Cloudflare Pages \(Production\)\s*$/m.test(workflow)) {
  errors.push('.github/workflows/deploy-production.yml: deploy job name must indicate Pages');
}

if (!/^\s*- name:\s*Deploy production pages site\s*$/m.test(workflow)) {
  errors.push('.github/workflows/deploy-production.yml: deploy step label must indicate Pages');
}

if (errors.length > 0) {
  console.error('Pages parity checks failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Pages parity checks passed.');