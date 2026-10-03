// Recognises AI-tool attribution in commit messages: co-author and similar
// trailers naming a coding assistant, "Generated with <tool>" lines, and the
// 🤖 marker some tools prepend. Commits in this repo are authored by Cameron;
// tools don't get credit lines (2026-10: 191 Claude trailers and 1 Cursor
// trailer were stripped from history with git filter-repo).
//
// Shared by the commit-msg hook (verify-commit-message.mjs), which strips
// these lines from every new commit, and commit-attribution-contract.test.ts,
// which fails if any commit in history still carries one.

const TOOLS = [
  'claude',
  'anthropic',
  'cursor',
  'codex',
  'openai',
  'chatgpt',
  'copilot',
  'gemini',
  'aider',
  'windsurf',
  'codeium',
  'devin',
  'jules',
  'tabnine',
  'codewhisperer',
  'amazon q',
  'sourcegraph',
  'cody',
  'cline',
  'continue\\.dev',
  'augment',
  'kiro',
  'qodo',
  'opencode',
].join('|');

const TRAILER_KEYS = 'co-authored-by|signed-off-by|assisted-by|generated-by|ai-assisted-by|helped-by|made-with';

/** One attribution line, matched whole. Human co-authors never match: the line must name a tool. */
export const ATTRIBUTION_LINE = new RegExp(
  `^(?:(?:${TRAILER_KEYS})[^\\S\\n]*:[^\\n]*\\b(?:${TOOLS})\\b[^\\n]*` +
    `|[^\\w\\n]*generated (?:with|by)\\b[^\\n]*\\b(?:${TOOLS})\\b[^\\n]*` +
    `|\\u{1F916}[^\\n]*)$`,
  'gimu'
);

/** Every attribution line in a message. */
export function findAttribution(message) {
  return message.match(ATTRIBUTION_LINE) ?? [];
}

/** The message with attribution lines removed and the gap they leave closed. */
export function stripAttribution(message) {
  const stripped = message.replace(ATTRIBUTION_LINE, '');
  if (stripped === message) return message;
  return `${stripped.replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}
