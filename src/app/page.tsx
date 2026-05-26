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

function SectionHandoff({ label, index }: { label: string; index: number }) {
  return (
    <motion.div
      className="pointer-events-none relative z-10 px-6 py-5"
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: index * 0.03, ease: 'easeOut' }}
      aria-hidden="true"
    >
      <div className="mx-auto flex max-w-4xl items-center gap-4">
        <motion.div
          className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300/25 to-emerald-300/10"
          initial={{ scaleX: 0.4, opacity: 0.45 }}
          whileInView={{ scaleX: 1, opacity: 0.78 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
        <motion.span
          className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/90"
          initial={{ opacity: 0.72, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {label}
        </motion.span>
        <motion.div
          className="h-px flex-1 bg-gradient-to-l from-transparent via-emerald-300/25 to-cyan-300/10"
          initial={{ scaleX: 0.4, opacity: 0.45 }}
          whileInView={{ scaleX: 1, opacity: 0.78 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();
  const pageProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 32, mass: 0.45 });

  return (
    <>
      <AmbientBackground />
      <CursorTrail />

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
        <SectionHandoff label="Credentials" index={1} />
        <Certifications />
        <SectionHandoff label="Experience" index={2} />
        <Experience />
        <SectionHandoff label="Education" index={3} />
        <Education />
        <SectionHandoff label="Research" index={4} />
        <Projects />
        <SectionHandoff label="Capabilities" index={5} />
        <Skills />
        <SectionHandoff label="Testimonials" index={6} />
        <Testimonials />
        <SectionHandoff label="Connect" index={7} />
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
