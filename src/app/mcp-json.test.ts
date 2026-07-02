/**
 * Contract tests: public/mcp.json is a valid WebMCP manifest.
 *
 * Four invariants enforced:
 *   1. WebMCP tools registered — all expected tools are present.
 *   2. WebMCP schemas are valid — every tool has a well-formed JSON Schema inputSchema.
 *   3. WebMCP form coverage — every contact surface on the site has a form entry.
 *   4. WebMCP discovery — the manifest is linked from <head> so agents can find
 *      it without first parsing llms.txt.
 *
 * Cross-check: contact email must match src/data/profile.ts so drift is caught.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { profile } from '@/data/profile';

const ROOT = join(import.meta.dirname, '..', '..');

interface JsonSchema {
  type: string;
  properties?: Record<string, unknown>;
  additionalProperties?: boolean;
  required?: string[];
  [key: string]: unknown;
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  endpoint?: string;
}

interface McpForm {
  description: string;
  submitVia: string;
  fields: Record<string, JsonSchema>;
  required: string[];
}

interface McpManifest {
  mcpVersion: string;
  name: string;
  description: string;
  version: string;
  baseUrl: string;
  tools: McpTool[];
  forms: Record<string, McpForm>;
}

const raw = readFileSync(join(ROOT, 'public', 'mcp.json'), 'utf8');
const manifest: McpManifest = JSON.parse(raw);

// ─── tools registered ─────────────────────────────────────────────────────────

const REQUIRED_TOOLS = [
  'get_profile',
  'get_projects',
  'get_experience',
  'get_education',
  'get_certifications',
  'get_contact_info',
] as const;

describe('WebMCP tools registered', () => {
  it('manifest has required top-level fields', () => {
    expect(manifest.mcpVersion).toBeTruthy();
    expect(manifest.name).toBeTruthy();
    expect(manifest.description).toBeTruthy();
    expect(manifest.version).toBeTruthy();
    expect(manifest.baseUrl).toBe('https://cameronaaron.com');
    expect(Array.isArray(manifest.tools)).toBe(true);
  });

  it.each(REQUIRED_TOOLS)('tool "%s" is registered', (toolName) => {
    const found = manifest.tools.find((t) => t.name === toolName);
    expect(found, `Tool "${toolName}" is missing from mcp.json`).toBeTruthy();
  });

  it('every tool has a name and non-empty description', () => {
    for (const tool of manifest.tools) {
      expect(tool.name, 'Tool is missing a name').toBeTruthy();
      expect(
        tool.description.trim().length,
        `Tool "${tool.name}" has an empty description`,
      ).toBeGreaterThan(10);
    }
  });

  it('tool names use snake_case', () => {
    for (const tool of manifest.tools) {
      expect(tool.name, `Tool name "${tool.name}" must be snake_case`).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('no duplicate tool names', () => {
    const names = manifest.tools.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

// ─── schemas are valid ────────────────────────────────────────────────────────

function isValidJsonSchema(schema: unknown): boolean {
  if (typeof schema !== 'object' || schema === null) return false;
  const s = schema as JsonSchema;
  if (typeof s.type !== 'string') return false;
  if (s.properties !== undefined && typeof s.properties !== 'object') return false;
  if (s.additionalProperties !== undefined && typeof s.additionalProperties !== 'boolean') return false;
  return true;
}

describe('WebMCP schemas are valid', () => {
  it('every tool has a valid inputSchema', () => {
    for (const tool of manifest.tools) {
      expect(
        isValidJsonSchema(tool.inputSchema),
        `Tool "${tool.name}" inputSchema is not a valid JSON Schema`,
      ).toBe(true);
    }
  });

  it('every inputSchema type is "object"', () => {
    for (const tool of manifest.tools) {
      expect(
        tool.inputSchema.type,
        `Tool "${tool.name}" inputSchema.type must be "object"`,
      ).toBe('object');
    }
  });

  it('every inputSchema has additionalProperties set', () => {
    for (const tool of manifest.tools) {
      expect(
        typeof tool.inputSchema.additionalProperties,
        `Tool "${tool.name}" inputSchema.additionalProperties must be a boolean`,
      ).toBe('boolean');
    }
  });

  it('form field schemas each have a type', () => {
    for (const [formName, form] of Object.entries(manifest.forms)) {
      for (const [fieldName, fieldSchema] of Object.entries(form.fields)) {
        expect(
          typeof fieldSchema.type,
          `Form "${formName}" field "${fieldName}" is missing a type`,
        ).toBe('string');
      }
    }
  });

  it('form required arrays reference only declared fields', () => {
    for (const [formName, form] of Object.entries(manifest.forms)) {
      const fieldNames = new Set(Object.keys(form.fields));
      for (const req of form.required) {
        expect(
          fieldNames.has(req),
          `Form "${formName}" requires field "${req}" which is not declared in fields`,
        ).toBe(true);
      }
    }
  });
});

// ─── form coverage ────────────────────────────────────────────────────────────

describe('WebMCP form coverage', () => {
  it('manifest has a forms map', () => {
    expect(typeof manifest.forms).toBe('object');
    expect(Object.keys(manifest.forms).length).toBeGreaterThan(0);
  });

  it('contact form is present', () => {
    expect(manifest.forms.contact, 'Contact form is missing from mcp.json').toBeTruthy();
  });

  it('contact form submitVia contains the profile email', () => {
    const form = manifest.forms.contact;
    expect(form.submitVia).toContain(profile.email);
  });

  it('contact form has required fields: to, subject, body', () => {
    const form = manifest.forms.contact;
    expect(form.required).toContain('to');
    expect(form.required).toContain('subject');
    expect(form.required).toContain('body');
  });

  it('contact form "to" field const matches profile email', () => {
    const toField = manifest.forms.contact.fields.to as JsonSchema & { const?: string };
    expect(toField.const).toBe(profile.email);
  });

  it('every form has a description and submitVia', () => {
    for (const [formName, form] of Object.entries(manifest.forms)) {
      expect(
        form.description.trim().length,
        `Form "${formName}" has an empty description`,
      ).toBeGreaterThan(5);
      expect(form.submitVia, `Form "${formName}" is missing submitVia`).toBeTruthy();
    }
  });
});

// ─── discovery ────────────────────────────────────────────────────────────────

describe('WebMCP manifest is discoverable from <head>', () => {
  it('layout.tsx links the manifest via <link rel="mcp">', () => {
    const layoutSrc = readFileSync(join(ROOT, 'src', 'app', 'layout.tsx'), 'utf8');
    expect(layoutSrc).toContain('rel="mcp"');
    expect(layoutSrc).toContain('href="/mcp.json"');
  });
});
