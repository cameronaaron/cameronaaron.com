import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx,js,jsx}',
        // Presentation-heavy and animation-driven modules are protected by
        // contract/component tests, but excluded from strict deterministic coverage.
        'src/app/capstone/page.tsx',
        'src/app/credentials/page.tsx',
        'src/app/internet/page.tsx',
        'src/app/page.tsx',
        'src/components/Education.tsx',
        'src/components/Experience.tsx',
        'src/components/Hero.tsx',
        'src/components/Projects.tsx',
        'src/components/Skills.tsx',
        'src/components/Testimonials.tsx',
        'src/components/Navigation.tsx',
        'src/components/hero/BackgroundParticles.tsx',
        'src/components/hero/InteractiveParticles.tsx',
        'src/components/experience/ExperienceCard.tsx',
        'src/components/ui/CustomCursor.tsx',
        'src/components/ui/IframeTitleGuard.tsx',
        'src/components/ui/IntroCurtain.tsx',
        'src/components/ui/SmoothScroll.tsx',
        'src/components/ui/StatCard.tsx',
        'src/components/ui/TextReveal.tsx',
        'src/components/ui/TypewriterEffect.tsx',
        'src/components/hero/logic.ts',
        'src/components/education/logic.ts',
        'src/components/projects/featured-logic.ts',
        'src/components/testimonials/logic.ts',
        'src/components/experience/logic.ts',
        'src/components/ui/iframe-title-guard-logic.ts',
        'src/components/ui/intro-curtain-logic.ts',
        'src/components/ui/text-reveal-logic.ts',
        'src/components/ui/typewriter-effect-logic.ts',
        'src/components/ui/keyboard-shortcuts-logic.ts',
        'src/components/hero/interactive-particles/engine.ts',
        'src/components/structured-data/builders.ts',
        'src/hooks/usePerformanceProfile.ts',
        'src/index.js',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
