// commit-msg hook: strips AI-tool attribution lines (see ai-attribution.mjs)
// from the message being committed, so no tool, editor or agent can add a
// co-author credit to this repo's history. Git passes the message file path
// as the first argument; the hook rewrites it in place and says what it took
// out. It strips rather than rejects because the trailer is usually added by
// a tool, not typed, and a blocked commit teaches nothing the note doesn't.
import { readFileSync, writeFileSync } from 'node:fs';

import { findAttribution, stripAttribution } from './ai-attribution.mjs';

const file = process.argv[2];
if (!file) {
  console.error('verify-commit-message: expected the commit message file path as the first argument');
  process.exit(1);
}

const message = readFileSync(file, 'utf8');
const found = findAttribution(message);
if (found.length > 0) {
  writeFileSync(file, stripAttribution(message));
  console.log(`commit-msg: removed AI attribution (${found.length} line${found.length === 1 ? '' : 's'}):`);
  for (const line of found) console.log(`  - ${line.trim()}`);
}
