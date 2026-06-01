import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Accessibility regression guards', () => {
  it('keeps validator-incompatible head directives out of layout', () => {
    const layoutSource = readSource('src/app/layout.tsx');

    expect(layoutSource).not.toContain('httpEquiv="Accept-CH"');
    expect(layoutSource).not.toContain('httpEquiv="X-Content-Type-Options"');
    expect(layoutSource).not.toContain('httpEquiv="X-XSS-Protection"');

    // Nu validator requires rel=prefetch links not to carry as= attributes.
    expect(layoutSource).toContain('<link rel="prefetch" href="/icon-192x192.png" />');
    expect(layoutSource).not.toContain('rel="prefetch" href="/icon-192x192.png" as=');
  });

  it('keeps iframe title guard mounted in the root layout', () => {
    const layoutSource = readSource('src/app/layout.tsx');

    expect(layoutSource).toContain('import IframeTitleGuard from "@/components/ui/IframeTitleGuard";');
    expect(layoutSource).toContain('<IframeTitleGuard />');
  });

  it('preserves valid list semantics in SectionRail', () => {
    const source = readSource('src/components/ui/SectionRail.tsx');

    // This guard rail was added after a Nu validator list-role violation.
    expect(source).not.toContain('role="presentation"');
  });

  it('prevents known low-contrast regressions in the Hero section', () => {
    const source = readSource('src/components/Hero.tsx');

    expect(source).not.toContain('bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70');
    expect(source).not.toContain('text-lg text-muted-foreground/80 mb-10 leading-relaxed max-w-xl');
    expect(source).not.toContain('from-purple-600 to-pink-600');
  });

  it('prevents known low-contrast regressions in Navigation, StatCard, and signal chips', () => {
    const navigationSource = readSource('src/components/Navigation.tsx');
    const statCardSource = readSource('src/components/ui/StatCard.tsx');
    const projectsSource = readSource('src/components/Projects.tsx');
    const skillsSource = readSource('src/components/Skills.tsx');

    expect(navigationSource).not.toContain('text-white/90 hover:text-white');
    expect(statCardSource).not.toContain('text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-emerald-200');
    expect(statCardSource).not.toContain('text-muted-foreground/90');
    expect(projectsSource).not.toContain('text-cyan-100/90');
    expect(skillsSource).not.toContain('text-cyan-100/90');
  });
});
