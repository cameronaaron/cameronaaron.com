#!/usr/bin/env node
/**
 * Regenerates public/llms.txt and public/mcp.json from source data.
 *
 * Runs as part of the prebuild step so these files are always in sync with
 * src/data/profile.ts. The generated files are committed to git so tests can
 * validate them without requiring a full build.
 *
 * Cannot import TypeScript directly, so critical constants are mirrored here.
 * The contract tests in src/app/llms-txt.test.ts and src/app/mcp-json.test.ts
 * cross-check these files against the TypeScript source data and will fail if
 * the two drift apart.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PUBLIC = join(ROOT, 'public');

// ─── mirrored from src/data/profile.ts ───────────────────────────────────────
const PROFILE = {
  name: 'Cameron Aaron, M.Ed.',
  title: 'EMT, CNA, Software Engineer, Security Researcher & Future Nurse Practitioner',
  tagline:
    'Interdisciplinary professional bridging emergency care, neuroscience research, software engineering, and cybersecurity while preparing for Nurse Practitioner school.',
  bio: 'Dedicated healthcare and technology professional with experience in aerospace medicine, clinical research, public health operations, software engineering, and security research. My next stage is Nurse Practitioner training, while continuing to build secure, high-impact technology for health and science.',
  email: 'cameronthescientist@pm.me',
  location: 'Los Angeles, CA',
  social: {
    github: 'https://github.com/cameronaaron',
    linkedin: 'https://www.linkedin.com/in/kamisama',
  },
};

// ─── llms.txt ─────────────────────────────────────────────────────────────────

const llmsTxt = `# ${PROFILE.name}

> ${PROFILE.tagline.replace(/\.$/, '')} — ${PROFILE.location}.

${PROFILE.bio}

## Pages

- [Home](https://cameronaaron.com/): Overview of Cameron's interdisciplinary background, featured projects, work experience, education, and certifications.
- [Capstone Research](https://cameronaaron.com/capstone): Arts-based graduate dissertation on thrice-exceptional Black male students in higher education transition — a five-part educational video series.
- [Credentials](https://cameronaaron.com/credentials): Complete list of clinical certifications, academic credentials, and verification links.
- [My Internet Presence](https://cameronaaron.com/internet): Publications, media appearances, and links to Cameron's online presence.

## Contact

- [Email](mailto:${PROFILE.email}): ${PROFILE.email}
- [GitHub](${PROFILE.social.github}): Open-source projects and code repositories
- [LinkedIn](${PROFILE.social.linkedin}): Professional profile and endorsements

## Optional

- [llms-full.txt](https://cameronaaron.com/llms-full.txt): Extended content including full project descriptions, detailed experience history, and complete certifications list.
- [MCP Manifest](https://cameronaaron.com/mcp.json): Machine-readable tool manifest for AI assistants (WebMCP).
- [Sitemap](https://cameronaaron.com/sitemap.xml): Complete site map for crawling.
`;

// ─── mcp.json ────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_profile',
    description:
      "Returns Cameron Aaron's professional profile including name, title, bio, location, and social links.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    endpoint: 'https://cameronaaron.com',
  },
  {
    name: 'get_projects',
    description:
      "Returns Cameron Aaron's portfolio projects including research, software, and security projects.",
    inputSchema: {
      type: 'object',
      properties: {
        featured: { type: 'boolean', description: 'When true, returns only featured projects.' },
      },
      additionalProperties: false,
    },
    endpoint: 'https://cameronaaron.com/#projects',
  },
  {
    name: 'get_experience',
    description:
      "Returns Cameron Aaron's professional work experience history sorted by recency.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    endpoint: 'https://cameronaaron.com/#experience',
  },
  {
    name: 'get_education',
    description:
      "Returns Cameron Aaron's academic education, degrees, and current prerequisite coursework.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    endpoint: 'https://cameronaaron.com/#education',
  },
  {
    name: 'get_certifications',
    description:
      "Returns Cameron Aaron's active clinical and professional certifications with verification links.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    endpoint: 'https://cameronaaron.com/credentials',
  },
  {
    name: 'get_contact_info',
    description:
      'Returns contact information for Cameron Aaron including email address and social profile links.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    endpoint: 'https://cameronaaron.com/#contact',
  },
];

const FORMS = {
  contact: {
    description:
      'Contact Cameron Aaron via email. This site is statically hosted; contact is via mailto link.',
    submitVia: `mailto:${PROFILE.email}`,
    fields: {
      to: { type: 'string', format: 'email', const: PROFILE.email },
      subject: { type: 'string', minLength: 1, description: 'Subject line of the email.' },
      body: { type: 'string', minLength: 1, description: 'Body of the email message.' },
    },
    required: ['to', 'subject', 'body'],
  },
};

const mcpManifest = {
  mcpVersion: '0.1',
  name: 'Cameron Aaron Portfolio',
  description: `WebMCP manifest for cameronaaron.com — a portfolio site for ${PROFILE.name}, ${PROFILE.title}.`,
  version: '1.0.0',
  baseUrl: 'https://cameronaaron.com',
  tools: TOOLS,
  forms: FORMS,
};

// ─── write ────────────────────────────────────────────────────────────────────

writeFileSync(join(PUBLIC, 'llms.txt'), llmsTxt, 'utf8');
writeFileSync(join(PUBLIC, 'mcp.json'), JSON.stringify(mcpManifest, null, 2) + '\n', 'utf8');

console.log('✓ generated public/llms.txt');
console.log('✓ generated public/mcp.json');
