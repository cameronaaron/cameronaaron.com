'use client';

import dynamic from 'next/dynamic';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
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
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';

const CURRENT_YEAR = new Date().getFullYear();

const AmbientBackground = dynamic(() => import('@/components/ui/AmbientBackground'), { ssr: false });
const QuickActionsDock = dynamic(() => import('@/components/ui/QuickActionsDock'), { ssr: false });
const SectionRail = dynamic(() => import('@/components/ui/SectionRail'), { ssr: false });

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
  const pageProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 32, mass: 0.45 });

  return (
    <>
      <IntroCurtain />
      <AmbientBackground performanceTier={performanceTier} />
      {showFloatingOverlays ? <QuickActionsDock performanceTier={performanceTier} /> : null}
      {showFloatingOverlays ? <SectionRail /> : null}
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
        {showSectionHandoffs ? <SectionHandoff label="Connect" cue="ready for your next conversation" index={7} targetId="contact" /> : null}
        <SectionReveal index={7}>
          <Contact />
        </SectionReveal>
      </main>

      {/* Footer */}
      <motion.footer
        className="bg-slate-900 text-white py-8 relative overflow-hidden"
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
        <div className="container mx-auto px-6 text-center relative z-10">
          <p className="text-gray-400">
            © {CURRENT_YEAR} Cameron Aaron. All rights reserved.
          </p>
        </div>
      </motion.footer>
    </>
  );
}
