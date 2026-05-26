'use client';

import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import AmbientBackground from '@/components/ui/AmbientBackground';
import CursorTrail from '@/components/ui/CursorTrail';

// Lazy load below-the-fold components for better performance
const Certifications = dynamic(() => import('@/components/Certifications'), {
  loading: () => <div className="h-screen" />,
  ssr: false
});
const Experience = dynamic(() => import('@/components/Experience'), {
  loading: () => <div className="h-screen" />,
  ssr: false
});
const Education = dynamic(() => import('@/components/Education'), {
  loading: () => <div className="h-screen" />,
  ssr: false
});
const Projects = dynamic(() => import('@/components/Projects'), {
  loading: () => <div className="h-screen" />,
  ssr: false
});
const Skills = dynamic(() => import('@/components/Skills'), {
  loading: () => <div className="h-screen" />,
  ssr: false
});
const Testimonials = dynamic(() => import('@/components/Testimonials'), {
  loading: () => <div className="h-screen" />,
  ssr: false
});
const Contact = dynamic(() => import('@/components/Contact'), {
  loading: () => <div className="h-screen" />,
  ssr: false
});

export default function Home() {
  return (
    <>
      <AmbientBackground />
      <CursorTrail />
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
      <main className="min-h-screen" id="main-content">
        <Navigation />
        <Hero />
        <Certifications />
        <Experience />
        <Education />
        <Projects />
        <Skills />
        <Testimonials />
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
