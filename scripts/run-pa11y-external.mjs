#!/usr/bin/env node

import { spawn } from 'node:child_process';

const targetUrl = process.env.A11Y_EXTERNAL_URL ?? 'https://cameronaaron.com';
const standard = process.env.A11Y_STANDARD ?? 'WCAG2AA';
const isWindows = process.platform === 'win32';

function log(message) {
  console.log(`[pa11y-external] ${message}`);
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function main() {
  log(`Running pa11y against ${targetUrl} (${standard})`);

  const command = isWindows ? 'npx.cmd' : 'npx';
  const args = ['-y', 'pa11y', targetUrl, '--standard', standard, '--reporter', 'json'];

  const { code, stdout, stderr } = await run(command, args);

  let issues = [];
  if (stdout.trim()) {
    try {
      issues = JSON.parse(stdout);
    } catch {
      // Parsing failure handled below.
    }
  }

  if (issues.length > 0) {
    log(`Found ${issues.length} issue(s).`);
    for (const issue of issues.slice(0, 15)) {
      const selector = issue.selector ?? issue.context ?? 'no-selector';
      const issueCode = issue.code ?? 'unknown-code';
      log(`- ${issueCode}: ${issue.message} (${selector})`);
    }
    if (issues.length > 15) {
      log(`- ... ${issues.length - 15} more issue(s)`);
    }
    process.exitCode = 1;
    return;
  }

  if (code !== 0) {
    log('pa11y returned non-zero exit code without parseable JSON output.');
    if (stderr.trim()) {
      log(`stderr: ${stderr.trim()}`);
    }
    process.exitCode = 1;
    return;
  }

  log('No issues found.');
}

await main();
