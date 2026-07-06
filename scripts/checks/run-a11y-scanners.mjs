#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const A11Y_PORT = Number(process.env.A11Y_PORT ?? 3000);
const A11Y_URL = process.env.A11Y_URL ?? `http://127.0.0.1:${A11Y_PORT}`;
const A11Y_AUTOSTART = process.env.A11Y_AUTOSTART !== '0';
const A11Y_NU_STRICT = process.env.A11Y_NU_STRICT === '1';
const STARTUP_TIMEOUT_MS = Number(process.env.A11Y_STARTUP_TIMEOUT_MS ?? 90_000);

const isWindows = process.platform === 'win32';

let devServerProcess = null;

function log(message) {
  console.log(`[a11y-suite] ${message}`);
}

async function isServerReachable(url) {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    return response.status > 0;
  } catch {
    return false;
  }
}

function spawnAndCapture(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
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

async function startDevServerIfNeeded() {
  if (await isServerReachable(A11Y_URL)) {
    log(`Using existing server at ${A11Y_URL}`);
    return;
  }

  if (!A11Y_AUTOSTART) {
    throw new Error(`No server is reachable at ${A11Y_URL}. Start one or set A11Y_AUTOSTART=1.`);
  }

  log(`Starting dev server on port ${A11Y_PORT} for scanner checks...`);
  devServerProcess = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--port', String(A11Y_PORT)], {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  devServerProcess.stdout?.on('data', (chunk) => {
    const output = String(chunk).trim();
    if (output) {
      log(`dev: ${output}`);
    }
  });

  devServerProcess.stderr?.on('data', (chunk) => {
    const output = String(chunk).trim();
    if (output) {
      log(`dev: ${output}`);
    }
  });

  const startedAt = Date.now();
  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    if (await isServerReachable(A11Y_URL)) {
      log(`Server is reachable at ${A11Y_URL}`);
      return;
    }
    await delay(500);
  }

  throw new Error(`Timed out waiting for ${A11Y_URL} after ${STARTUP_TIMEOUT_MS}ms.`);
}

function stopDevServerIfStarted() {
  if (!devServerProcess) return;

  log('Stopping dev server...');
  try {
    devServerProcess.kill('SIGTERM');
  } catch {
    // Ignore cleanup failures.
  }
}

async function runPa11y() {
  log(`Running pa11y against ${A11Y_URL}`);

  const command = isWindows ? 'npx.cmd' : 'npx';
  const args = ['-y', 'pa11y', A11Y_URL, '--standard', 'WCAG2AA', '--reporter', 'json'];

  const { code, stdout, stderr } = await spawnAndCapture(command, args);

  let issues = [];
  if (stdout.trim()) {
    try {
      issues = JSON.parse(stdout);
    } catch {
      // Keep raw output for troubleshooting when JSON parsing fails.
    }
  }

  if (issues.length > 0) {
    log(`pa11y found ${issues.length} issue(s).`);
    for (const issue of issues.slice(0, 10)) {
      const codeLabel = issue.code ?? 'unknown-code';
      const selector = issue.selector ?? issue.context ?? 'no-selector';
      log(`- ${codeLabel}: ${issue.message} (${selector})`);
    }
    if (issues.length > 10) {
      log(`- ... ${issues.length - 10} more issue(s)`);
    }
    return { failed: true, count: issues.length };
  }

  if (code !== 0) {
    log('pa11y returned a non-zero exit code without parseable JSON output.');
    if (stderr.trim()) {
      log(`pa11y stderr: ${stderr.trim()}`);
    }
    return { failed: true, count: 1 };
  }

  log('pa11y found no issues.');
  return { failed: false, count: 0 };
}

async function runNuValidator() {
  log(`Running Nu HTML Validator against rendered HTML from ${A11Y_URL}`);

  const pageResponse = await fetch(A11Y_URL);
  if (!pageResponse.ok) {
    throw new Error(`Failed to fetch ${A11Y_URL}: ${pageResponse.status} ${pageResponse.statusText}`);
  }

  const html = await pageResponse.text();
  const validatorResponse = await fetch('https://validator.w3.org/nu/?out=json', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
    body: html,
  });

  if (!validatorResponse.ok) {
    throw new Error(`Nu validator request failed: ${validatorResponse.status} ${validatorResponse.statusText}`);
  }

  const report = await validatorResponse.json();
  const messages = Array.isArray(report.messages) ? report.messages : [];

  const counts = new Map();
  for (const message of messages) {
    const type = message.type ?? 'unknown';
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }

  const countSummary = [...counts.entries()]
    .map(([type, count]) => `${type}:${count}`)
    .join(', ');

  log(`Nu validator message counts -> ${countSummary || 'none'}`);

  const errorCount = counts.get('error') ?? 0;

  if (A11Y_NU_STRICT && errorCount > 0) {
    log(`Nu validator strict mode is enabled and found ${errorCount} error(s).`);
    return { failed: true, errorCount };
  }

  if (errorCount > 0) {
    log(`Nu validator reported ${errorCount} error(s). Not failing because A11Y_NU_STRICT=0.`);
  }

  return { failed: false, errorCount };
}

async function main() {
  let failed = false;

  const cleanup = () => stopDevServerIfStarted();
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await startDevServerIfNeeded();

    const pa11yResult = await runPa11y();
    if (pa11yResult.failed) {
      failed = true;
    }

    try {
      const nuResult = await runNuValidator();
      if (nuResult.failed) {
        failed = true;
      }
    } catch (error) {
      log(`Nu validator check could not complete: ${error instanceof Error ? error.message : String(error)}`);
      if (A11Y_NU_STRICT) {
        failed = true;
      }
    }
  } catch (error) {
    log(error instanceof Error ? error.message : String(error));
    failed = true;
  } finally {
    cleanup();
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  log('Accessibility scanner suite finished successfully.');
}

await main();
