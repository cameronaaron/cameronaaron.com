'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Certifications from '@/components/Certifications';
import Experience from '@/components/Experience';
import Education from '@/components/Education';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import AmbientBackground from '@/components/ui/AmbientBackground';
import QuickActionsDock from '@/components/ui/QuickActionsDock';
import BackToTop from '@/components/ui/BackToTop';
import IntroCurtain from '@/components/ui/IntroCurtain';
import SectionRail from '@/components/ui/SectionRail';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';

const CURRENT_YEAR = new Date().getFullYear();

function SectionReveal({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const glowTone = index % 2 === 0 ? 'from-cyan-400/10 via-primary/12 to-transparent' : 'from-emerald-400/10 via-secondary/12 to-transparent';

  return (
    <motion.div
      className="relative"
      initial={false}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.7, delay: index * 0.03, ease: 'easeOut' }}
    >
      <motion.div
        className={`pointer-events-none absolute inset-x-0 top-6 mx-auto h-24 w-3/4 rounded-full bg-gradient-to-r ${glowTone} blur-3xl`}
        animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 7 + index * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      {children}
    </motion.div>
  );
}

function SectionHandoff({
  label,
  index,
  cue,
  targetId,
}: {
  label: string;
  index: number;
  cue: string;
  targetId: string;
}) {
  return (
    <motion.div
      className="relative z-10 px-6 py-10"
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: index * 0.04, ease: 'easeOut' }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="h-24 w-full max-w-3xl rounded-full bg-gradient-to-r from-cyan-400/10 via-primary/15 to-emerald-400/10 blur-3xl"
          animate={{ scale: [0.96, 1.04, 0.96], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
        />
      </motion.div>

      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-4">
        <motion.div
          className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300/25 to-emerald-300/10"
          initial={{ scaleX: 0.4, opacity: 0.45 }}
          whileInView={{ scaleX: 1, opacity: 0.78 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />

        <motion.div
          className="group pointer-events-auto relative"
          whileHover={{ y: -2, scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          <motion.div
            className="absolute -inset-2 rounded-full border border-cyan-300/25"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 9, ease: 'linear', repeat: Infinity }}
          />
          <motion.a
            href={`#${targetId}`}
            className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs sm:text-[11px] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-muted-foreground/90 transition-colors group-hover:border-cyan-300/35 group-hover:text-cyan-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
            {label}
          </motion.a>
        </motion.div>

        <motion.div
          className="h-px flex-1 bg-gradient-to-l from-transparent via-emerald-300/25 to-cyan-300/10"
          initial={{ scaleX: 0.4, opacity: 0.45 }}
          whileInView={{ scaleX: 1, opacity: 0.78 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
        </div>

        <motion.div
          className="mt-4 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-cyan-200/85"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <span>{cue}</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((pulse) => (
              <motion.span
                key={pulse}
                className="h-1.5 w-1.5 rounded-full bg-cyan-300/75"
                animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: pulse * 0.13 + index * 0.05 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();
  const { performanceTier } = usePerformanceProfile();
  const showFloatingOverlays = performanceTier === 'full' || performanceTier === 'balanced';
  const showSectionHandoffs = performanceTier === 'full' || performanceTier === 'balanced';
  const pageProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 32, mass: 0.45 });

  return (
    <>
      <IntroCurtain />
      <AmbientBackground performanceTier={performanceTier} />
      {showFloatingOverlays ? <QuickActionsDock performanceTier={performanceTier} /> : null}
      {showFloatingOverlays ? <SectionRail /> : null}
      {showFloatingOverlays ? <KeyboardShortcuts /> : null}
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

      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
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
    </main>
    </>
  );
}
