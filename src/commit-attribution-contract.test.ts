/**
 * Commit attribution contract: no AI tool is credited in this repo's history.
 *
 * 2026-10: history carried 191 `Co-Authored-By: Claude …` trailers and one
 * `Co-authored-by: Cursor` trailer, added by coding tools rather than typed.
 * They were stripped with git filter-repo (tree unchanged), and three layers
 * keep them out:
 *   1. a commit-msg hook strips them from every new commit,
 *   2. this file fails the commit and push gates, and CI, if any commit in
 *      history still has one — which catches whatever bypassed the hook
 *      (`--no-verify`, a commit made on GitHub, another clone),
 *   3. the wiring check below, so the hook can't be silently dropped.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { findAttribution, stripAttribution } from '../scripts/verify/ai-attribution.mjs';

const ROOT = resolve(process.cwd());

const TOOL_LINES = [
  'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>',
  'Co-authored-by: Cursor <cursoragent@cursor.com>',
  'Co-authored-by: Codex <codex@openai.com>',
  'Co-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>',
  'co-authored-by: google-labs-jules[bot] <jules@google.com>',
  'Assisted-by: Gemini',
  '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  'Generated with Cursor',
];

const KEPT_LINES = [
  'Co-authored-by: Jane Doe <jane@example.com>',
  'Track generated AGENTS.md so next dev stops dirtying CLAUDE.md',
  'refactor: remove custom cursor components and related tests',
  '- Update wrangler.toml, README, and copilot instructions',
];

describe('commit attribution contract', () => {
  it('no commit in history credits an AI tool', () => {
    const log = execFileSync('git', ['log', '--format=%H%n%B%x00'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const commits = log.split('\0').filter((entry) => entry.trim() !== '');
    expect(commits.length, 'git log returned nothing — the instrument is broken').toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const entry of commits) {
      const [sha, ...body] = entry.trim().split('\n');
      for (const line of findAttribution(body.join('\n'))) offenders.push(`${sha.slice(0, 7)}: ${line.trim()}`);
    }
    expect(offenders, 'strip these with git filter-repo (see this file’s header)').toEqual([]);
  });

  it('recognises every tool format, one line at a time', () => {
    for (const line of TOOL_LINES) expect(findAttribution(`Subject\n\nBody.\n\n${line}\n`), line).toEqual([line]);
  });

  it('never touches a human co-author or a message that merely mentions a tool', () => {
    for (const line of KEPT_LINES) expect(findAttribution(`Subject\n\n${line}\n`), line).toEqual([]);
    const message = `Subject\n\n${KEPT_LINES.join('\n')}\n`;
    expect(stripAttribution(message)).toBe(message);
  });

  it('strips the lines and closes the gap they leave', () => {
    const message = `Fix the thing\n\nWhy it was broken.\n\n${TOOL_LINES.slice(0, 2).join('\n')}\nCo-authored-by: Jane Doe <jane@example.com>\n`;
    expect(stripAttribution(message)).toBe('Fix the thing\n\nWhy it was broken.\n\nCo-authored-by: Jane Doe <jane@example.com>\n');
    expect(stripAttribution(`Subject\n\nBody.\n\n${TOOL_LINES[6]}\n\n${TOOL_LINES[0]}\n`)).toBe('Subject\n\nBody.\n');
  });

  it('the commit-msg hook rewrites the message file in place', () => {
    const dir = mkdtempSync(join(tmpdir(), 'commit-msg-'));
    try {
      const file = join(dir, 'COMMIT_EDITMSG');
      writeFileSync(file, `Subject\n\nBody.\n\n${TOOL_LINES[1]}\n`);
      const output = execFileSync('node', [join(ROOT, 'scripts/verify/verify-commit-message.mjs'), file], { encoding: 'utf8' });
      expect(readFileSync(file, 'utf8')).toBe('Subject\n\nBody.\n');
      expect(output).toContain('removed AI attribution (1 line)');

      const clean = 'Subject\n\nCo-authored-by: Jane Doe <jane@example.com>\n';
      writeFileSync(file, clean);
      expect(execFileSync('node', [join(ROOT, 'scripts/verify/verify-commit-message.mjs'), file], { encoding: 'utf8' })).toBe('');
      expect(readFileSync(file, 'utf8')).toBe(clean);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('the commit-msg hook is wired and installed', () => {
    const hooks = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))['simple-git-hooks'];
    expect(hooks['commit-msg']).toBe('node scripts/verify/verify-commit-message.mjs "$1"');
    const gitDir = execFileSync('git', ['rev-parse', '--git-dir'], { cwd: ROOT, encoding: 'utf8' }).trim();
    const installed = (() => {
      try {
        return readFileSync(resolve(ROOT, gitDir, 'hooks', 'commit-msg'), 'utf8');
      } catch {
        return null;
      }
    })();
    // CI checkouts never run `prepare`'s hook install; locally the hook must be live.
    if (!process.env.CI) expect(installed, 'run `pnpm exec simple-git-hooks`').toContain('verify-commit-message.mjs');
  });
});
