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
import CursorTrail from '@/components/ui/CursorTrail';
import QuickActionsDock from '@/components/ui/QuickActionsDock';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';

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
      initial={{ opacity: 0, y: 10 }}
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
  const { performanceTier, shouldRenderCursorTrail } = usePerformanceProfile();
  const pageProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 32, mass: 0.45 });

  return (
    <>
      <AmbientBackground performanceTier={performanceTier} />
      {shouldRenderCursorTrail ? <CursorTrail /> : null}
      <QuickActionsDock performanceTier={performanceTier} />

      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 xl:hidden" aria-hidden="true">
        <div className="h-1 w-full bg-white/10 backdrop-blur-sm">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-primary to-secondary"
            style={{ scaleX: pageProgress, transformOrigin: 'left' }}
          />
        </div>
      </div>

      <div className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 xl:flex xl:flex-col xl:items-center" aria-hidden="true">
        <div className="relative h-64 w-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400 via-primary to-secondary"
            style={{ scaleY: pageProgress, transformOrigin: 'bottom' }}
          />
        </div>
      </div>

      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
      <main className="min-h-screen" id="main-content">
        <Navigation />
        <Hero />
        <SectionHandoff label="Credentials" cue="transitioning to verified credentials" index={1} targetId="certifications" />
        <Certifications />
        <SectionHandoff label="Experience" cue="switching from proof to practice" index={2} targetId="experience" />
        <Experience />
        <SectionHandoff label="Education" cue="entering training and milestones" index={3} targetId="education" />
        <Education />
        <SectionHandoff label="Research" cue="opening research and publications" index={4} targetId="projects" />
        <Projects />
        <SectionHandoff label="Capabilities" cue="mapping strengths and specialties" index={5} targetId="skills" />
        <Skills />
        <SectionHandoff label="Testimonials" cue="hearing voices from collaborators" index={6} targetId="testimonials" />
        <Testimonials />
        <SectionHandoff label="Connect" cue="ready for your next conversation" index={7} targetId="contact" />
        <Contact />
      
      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Cameron Aaron. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
    </>
  );
}
