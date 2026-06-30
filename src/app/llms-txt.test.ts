/**
 * Contract tests: public/llms.txt follows the llmstxt.org spec recommendations.
 *
 * Spec: https://llmstxt.org/
 *   - H1 with project/site name
 *   - Blockquote (>) with a short one-line description
 *   - At least one section with markdown links
 *   - Contact information
 *   - Optional: link to llms-full.txt and mcp.json
 *
 * Cross-check: key values must match src/data/profile.ts so drift is caught.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { profile } from '@/data/profile';

const ROOT = join(import.meta.dirname, '..', '..');
const LLMS_TXT = readFileSync(join(ROOT, 'public', 'llms.txt'), 'utf8');

describe('llms.txt follows recommendations', () => {
  it('starts with an H1 title line', () => {
    const firstLine = LLMS_TXT.split('\n')[0];
    expect(firstLine).toMatch(/^# .+/);
  });

  it('H1 contains the site owner name from profile data', () => {
    const [firstName, lastName] = profile.name.split(' ');
    expect(LLMS_TXT).toContain(`# ${firstName}`);
    expect(LLMS_TXT).toContain(lastName);
  });

  it('has a blockquote description line (> ...)', () => {
    const lines = LLMS_TXT.split('\n');
    const blockquote = lines.find((l) => l.startsWith('> '));
    expect(blockquote, 'Expected a > blockquote description').toBeTruthy();
    expect(blockquote!.length).toBeGreaterThan(20);
  });

  it('has at least one section with markdown links', () => {
    const linkPattern = /^\- \[.+\]\(.+\)/m;
    expect(LLMS_TXT).toMatch(linkPattern);
    const headingPattern = /^## .+/m;
    expect(LLMS_TXT).toMatch(headingPattern);
  });

  it('has a Contact section with email from profile data', () => {
    expect(LLMS_TXT).toContain('## Contact');
    expect(LLMS_TXT).toContain(profile.email);
  });

  it('links to GitHub and LinkedIn from profile data', () => {
    expect(LLMS_TXT).toContain(profile.social.github);
    expect(LLMS_TXT).toContain(profile.social.linkedin);
  });

  it('links to the MCP manifest', () => {
    expect(LLMS_TXT).toContain('mcp.json');
  });

  it('links to llms-full.txt in Optional section', () => {
    expect(LLMS_TXT).toContain('llms-full.txt');
  });

  it('references all four site pages', () => {
    expect(LLMS_TXT).toContain('https://cameronaaron.com/');
    expect(LLMS_TXT).toContain('/capstone');
    expect(LLMS_TXT).toContain('/credentials');
    expect(LLMS_TXT).toContain('/internet');
  });

  it('uses HTTPS links only (no HTTP)', () => {
    // Extract all markdown links: [text](url)
    const linkUrls = [...LLMS_TXT.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
    const httpLinks = linkUrls.filter((url) => url.startsWith('http://'));
    expect(httpLinks, `Found non-HTTPS links: ${httpLinks.join(', ')}`).toHaveLength(0);
  });
});
