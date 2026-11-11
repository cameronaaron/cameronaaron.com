import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function listProductionSources(): string[] {
  const src = resolve(process.cwd(), 'src');
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx$/.test(entry.name) && !/\.test\./.test(entry.name)) files.push(full);
    }
  };
  walk(src);
  return files;
}

describe('Accessibility regression guards', () => {
  it('keeps validator-incompatible head directives out of layout', () => {
    const layoutSource = readSource('src/app/layout.tsx');

    expect(layoutSource).not.toContain('httpEquiv="Accept-CH"');
    expect(layoutSource).not.toContain('httpEquiv="X-Content-Type-Options"');
    expect(layoutSource).not.toContain('httpEquiv="X-XSS-Protection"');

    // The icon prefetch was removed on purpose (2026-07): any request that
    // starts before first paint sits in Lighthouse's pessimistic LCP graph,
    // and this one cost ~20ms of simulated LCP for a cache-warming nicety.
    // If a prefetch ever returns, Nu validator requires it not to carry as=.
    expect(layoutSource).not.toContain('rel="prefetch"');
  });

  it('keeps iframe title guard mounted in the root layout', () => {
    const layoutSource = readSource('src/app/layout.tsx');

    expect(layoutSource).toContain('import IframeTitleGuard from "@/components/ui/IframeTitleGuard";');
    expect(layoutSource).toContain('<IframeTitleGuard />');
  });

  it('prevents known low-contrast regressions in the Hero section', () => {
    const source = readSource('src/components/Hero.tsx');

    expect(source).not.toContain('bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70');
    expect(source).not.toContain('text-lg text-muted-foreground/80 mb-10 leading-relaxed max-w-xl');
    expect(source).not.toContain('from-purple-600 to-pink-600');
  });

  it('prevents known low-contrast regressions in Navigation and signal chips', () => {
    const navigationSource = readSource('src/components/Navigation.tsx');
    const projectsSource = readSource('src/components/Projects.tsx');
    const skillsSource = readSource('src/components/Skills.tsx');

    expect(navigationSource).not.toContain('text-foreground/90 hover:text-foreground');
    expect(projectsSource).not.toContain('text-foreground/90');
    expect(skillsSource).not.toContain('text-foreground/90');
  });

  it('repo-wide: every custom-widget role is keyboard-operable, not pointer-only (WCAG 2.1.1)', () => {
    // Found 2026-07: PredatorPreyChase's arena only ever wired onPointerMove — a
    // keyboard-only visitor had zero way to play it. role="application"/"slider"/
    // "scrollbar" (the ARIA "custom widget with its own keyboard model" roles) are a
    // commitment that the widget IS keyboard-operable; a file declaring one without
    // ever handling a key event is exactly the bug this line pins shut. Present and
    // future — walks every .tsx file, not just the one already fixed.
    const customWidgetRolePattern = /role=(?:"|\{["'])(application|slider|scrollbar)/;
    const offenders = listProductionSources().filter((file) => {
      const source = readFileSync(file, 'utf8');
      return customWidgetRolePattern.test(source) && !/onKeyDown/.test(source);
    });

    expect(
      offenders,
      `custom-widget role with no onKeyDown handler anywhere in the file — every pointer interaction needs a keyboard equivalent:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('repo-wide: no aria-label/aria-labelledby on a role-less span or div (ARIA 1.2 prohibits naming generic)', () => {
    // Found 2026-09 by the Nu validator (35 errors on the home page):
    // A since-removed text effect put aria-label on a bare <span>. Generic elements cannot be
    // named, so assistive tech ignores the label — it looked like a11y work and
    // did nothing. Walks the JSX AST of every production .tsx (attributes span
    // lines and contain `=>`, which defeats a regex over opening tags).
    const GENERIC_TAGS = new Set(['span', 'div', 'm.span', 'm.div', 'motion.span', 'motion.div']);
    const offenders: string[] = [];
    let genericTagsSeen = 0;
    for (const file of listProductionSources()) {
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && GENERIC_TAGS.has(node.tagName.getText(source))) {
          genericTagsSeen += 1;
          const names = new Set<string>();
          for (const attribute of node.attributes.properties) {
            if (ts.isJsxAttribute(attribute)) names.add(attribute.name.getText(source));
          }
          if ((names.has('aria-label') || names.has('aria-labelledby')) && !names.has('role')) {
            const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
            offenders.push(`${file}:${line + 1} <${node.tagName.getText(source)}>`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }

    expect(genericTagsSeen, 'sweep matched no span/div at all — the AST walk is broken').toBeGreaterThan(0);
    expect(offenders, `name the element with a real role, or drop the no-op label:\n${offenders.join('\n')}`).toEqual([]);
  });
});
