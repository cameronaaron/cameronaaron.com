// Server Component (no 'use client'): the home page shell renders as static
// HTML and ships zero client JS of its own. All client-side orchestration —
// intro curtain, ambient background, floating overlays, cursor effects, the
// scroll-progress bar, the first-interaction gate — lives in the <PageChrome>
// island; the tier-gated in-flow decorations (VelocityMarquee, RibbonBand,
// SectionHandoff) self-read the performance profile so this server shell can
// render them unconditionally. Section components imported here become client
// islands where they need interactivity, and Server Components (e.g. Education)
// where they don't — the latter never hydrate (RSC migration, 2026-07).
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
import { SectionHandoff, SectionReveal } from '@/components/ui/SectionTransitions';
import VelocityMarquee from '@/components/ui/VelocityMarquee';
import RibbonBandLazy from '@/components/ui/RibbonBandLazy';
import { CONTACT_MARQUEE_PHRASES, HERO_MARQUEE_PHRASES } from '@/components/ui/velocity-marquee-logic';

export default function Home() {
  return (
    <>
      <PageChrome />

      <main className="min-h-screen" id="main-content">
        <Navigation />
        <SectionReveal index={0}>
          <Hero />
        </SectionReveal>
        <VelocityMarquee phrases={HERO_MARQUEE_PHRASES} />
        <SelectedWork />
        <SectionHandoff label="Credentials" cue="transitioning to verified credentials" index={1} targetId="certifications" />
        <SectionReveal index={1}>
          <Certifications />
        </SectionReveal>
        <SectionHandoff label="Experience" cue="switching from proof to practice" index={2} targetId="experience" />
        <SectionReveal index={2}>
          <Experience />
        </SectionReveal>
        <SectionHandoff label="Education" cue="entering training and milestones" index={3} targetId="education" />
        <SectionReveal index={3}>
          <Education />
        </SectionReveal>
        <RibbonBandLazy />
        <SectionHandoff label="Research" cue="opening research and publications" index={4} targetId="projects" />
        <SectionReveal index={4}>
          <Projects />
        </SectionReveal>
        <SectionHandoff label="Capabilities" cue="mapping strengths and specialties" index={5} targetId="skills" />
        <SectionReveal index={5}>
          <Skills />
        </SectionReveal>
        <SectionHandoff label="Testimonials" cue="hearing voices from collaborators" index={6} targetId="testimonials" />
        <SectionReveal index={6}>
          <Testimonials />
        </SectionReveal>
        <VelocityMarquee phrases={CONTACT_MARQUEE_PHRASES} direction={-1} />
        <SectionHandoff label="Connect" cue="ready for your next conversation" index={7} targetId="contact" />
        <SectionReveal index={7}>
          <Contact />
        </SectionReveal>
      </main>

      <Footer />
    </>
  );
}
