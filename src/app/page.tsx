'use client';

import dynamic from 'next/dynamic';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
// Sections are statically imported on purpose: code-splitting them was measured
// (2026-07) to *hurt* Lighthouse — the extra chunk round-trip after hydration
// deepens the critical request graph (mobile LCP 3.4s→3.8s, TTI 3.6s→4.0s).
import Certifications from '@/components/Certifications';
import Experience from '@/components/Experience';
import Education from '@/components/Education';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import BackToTop from '@/components/ui/BackToTop';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import IntroCurtain from '@/components/ui/IntroCurtain';
import { SectionHandoff, SectionReveal } from '@/components/ui/SectionTransitions';
import VelocityMarquee from '@/components/ui/VelocityMarquee';
import { CONTACT_MARQUEE_PHRASES, HERO_MARQUEE_PHRASES } from '@/components/ui/velocity-marquee-logic';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import { navItems } from '@/data/navigation';
import { profile } from '@/data/profile';
import { socialPlatforms } from '@/data/contact';

const CURRENT_YEAR = new Date().getFullYear();

const AmbientBackground = dynamic(() => import('@/components/ui/AmbientBackground'), { ssr: false });
const QuickActionsDock = dynamic(() => import('@/components/ui/QuickActionsDock'), { ssr: false });
const SectionRail = dynamic(() => import('@/components/ui/SectionRail'), { ssr: false });
const CursorComet = dynamic(() => import('@/components/ui/CursorComet'), { ssr: false });
const PointerRipple = dynamic(() => import('@/components/ui/PointerRipple'), { ssr: false });
const AuroraSurge = dynamic(() => import('@/components/ui/AuroraSurge'), { ssr: false });

export default function Home() {
  const { scrollYProgress } = useScroll();
  const { performanceTier } = usePerformanceProfile();
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) return;

    const onFirstInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction);
    window.addEventListener('touchstart', onFirstInteraction, { passive: true });
    window.addEventListener('scroll', onFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
    };
  }, [hasInteracted]);

  const showFloatingOverlays = hasInteracted && (performanceTier === 'full' || performanceTier === 'balanced');
  const showSectionHandoffs = performanceTier === 'full' || performanceTier === 'balanced';
  const showCursorEffects = hasInteracted && performanceTier === 'full';
  const pageProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 32, mass: 0.45 });

  return (
    <>
      <IntroCurtain />
      <div className="grain-overlay" aria-hidden="true" />
      <AmbientBackground performanceTier={performanceTier} />
      {showFloatingOverlays ? <QuickActionsDock performanceTier={performanceTier} /> : null}
      {showFloatingOverlays ? <SectionRail /> : null}
      {/* Interaction layer: deferred until first input (same LCP-friendly gate
          as the other floating overlays), then tier-gated — comet + easter egg
          are desktop full-tier; the tap ripple also runs on balanced (mobile). */}
      {showCursorEffects ? <CursorComet /> : null}
      {showCursorEffects ? <AuroraSurge /> : null}
      {showFloatingOverlays ? <PointerRipple /> : null}
      <KeyboardShortcuts />
      <BackToTop />

      {showFloatingOverlays ? (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 xl:hidden" aria-hidden="true">
          <div className="h-1 w-full bg-white/10 backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-primary to-secondary"
              style={{ scaleX: pageProgress, transformOrigin: 'left' }}
            />
          </div>
        </div>
      ) : null}

      <main className="min-h-screen" id="main-content">
        <Navigation />
        <SectionReveal index={0}>
          <Hero />
        </SectionReveal>
        <VelocityMarquee phrases={HERO_MARQUEE_PHRASES} performanceTier={performanceTier} />
        {showSectionHandoffs ? <SectionHandoff label="Credentials" cue="transitioning to verified credentials" index={1} targetId="certifications" /> : null}
        <SectionReveal index={1}>
          <Certifications />
        </SectionReveal>
        {showSectionHandoffs ? <SectionHandoff label="Experience" cue="switching from proof to practice" index={2} targetId="experience" /> : null}
        <SectionReveal index={2}>
          <Experience />
        </SectionReveal>
        {showSectionHandoffs ? <SectionHandoff label="Education" cue="entering training and milestones" index={3} targetId="education" /> : null}
        <SectionReveal index={3}>
          <Education />
        </SectionReveal>
        {showSectionHandoffs ? <SectionHandoff label="Research" cue="opening research and publications" index={4} targetId="projects" /> : null}
        <SectionReveal index={4}>
          <Projects />
        </SectionReveal>
        {showSectionHandoffs ? <SectionHandoff label="Capabilities" cue="mapping strengths and specialties" index={5} targetId="skills" /> : null}
        <SectionReveal index={5}>
          <Skills />
        </SectionReveal>
        {showSectionHandoffs ? <SectionHandoff label="Testimonials" cue="hearing voices from collaborators" index={6} targetId="testimonials" /> : null}
        <SectionReveal index={6}>
          <Testimonials />
        </SectionReveal>
        <VelocityMarquee phrases={CONTACT_MARQUEE_PHRASES} performanceTier={performanceTier} direction={-1} />
        {showSectionHandoffs ? <SectionHandoff label="Connect" cue="ready for your next conversation" index={7} targetId="contact" /> : null}
        <SectionReveal index={7}>
          <Contact />
        </SectionReveal>
      </main>

      {/* Footer */}
      <motion.footer
        className="border-t border-white/5 bg-background/80 text-white py-14 relative overflow-hidden"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <a href="#home" className="font-display text-2xl font-bold tracking-tight text-white transition-colors hover:text-cyan-100">
                Cameron Aaron
              </a>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Emergency care, clinical research, and secure software — building toward Nurse Practitioner practice.
              </p>
            </div>

            <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-12 gap-y-2.5">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-cyan-100"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-2.5">
              {socialPlatforms.map((platform) => (
                <a
                  key={platform.key}
                  href={profile.social[platform.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-cyan-100"
                >
                  {platform.name}
                </a>
              ))}
              <a
                href={`mailto:${profile.email}`}
                className="text-sm text-muted-foreground transition-colors hover:text-cyan-100"
              >
                {profile.email}
              </a>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-sm text-muted-foreground md:flex-row">
            <p>© {CURRENT_YEAR} Cameron Aaron. All rights reserved.</p>
            <p className="font-mono-accent text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
              {profile.location}
            </p>
          </div>
        </div>
      </motion.footer>
    </>
  );
}
