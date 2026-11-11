// Server Component (no 'use client'): the home page shell renders as static
// HTML and ships zero client JS of its own. Section components imported here
// are Server Components unless they need interactivity, in which case only the
// interactive slice is a client island.
//
// Sections stay statically imported on purpose: code-splitting them was measured
// (2026-07) to *hurt* Lighthouse — the extra chunk round-trip after hydration
// deepens the critical request graph (mobile LCP 3.4s→3.8s, TTI 3.6s→4.0s).
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import SelectedWork from '@/components/SelectedWork';
import Certifications from '@/components/Certifications';
import Experience from '@/components/Experience';
import Education from '@/components/Education';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import PageChrome from '@/components/ui/PageChrome';
import { SectionReveal } from '@/components/ui/SectionTransitions';
import { HOME_FONT_PRELOADS, preloadFontFiles } from './font-preloads';

export default function Home() {
  preloadFontFiles(HOME_FONT_PRELOADS);
  return (
    <>
      {/* First focusable element on the page, ahead of PageChrome's floating
          buttons, and Navigation sits outside <main> so "skip" actually skips
          it. Both were wrong once: the link was the third Tab stop and landed
          back at the top of the nav it was meant to bypass (WCAG 2.4.1). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-6 focus:py-3 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        Skip to main content
      </a>

      <PageChrome />

      <Navigation />

      <main className="min-h-screen" id="main-content">
        <SectionReveal index={0}>
          <Hero />
        </SectionReveal>
        <SelectedWork />
        <SectionReveal index={1}>
          <Certifications />
        </SectionReveal>
        <SectionReveal index={2}>
          <Experience />
        </SectionReveal>
        <SectionReveal index={3}>
          <Education />
        </SectionReveal>
        <SectionReveal index={4}>
          <Projects />
        </SectionReveal>
        <SectionReveal index={5}>
          <Skills />
        </SectionReveal>
        <SectionReveal index={6}>
          <Testimonials />
        </SectionReveal>
        <SectionReveal index={7}>
          <Contact />
        </SectionReveal>
      </main>

      <Footer />
    </>
  );
}
