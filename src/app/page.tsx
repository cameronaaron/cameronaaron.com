'use client';

import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import Contact from '@/components/Contact';

export default function Home() {
  return (
    <main className="min-h-screen" id="main-content">
      <Navigation />
      <Hero />
      <Experience />
      <Projects />
      <Skills />
      <Testimonials />
      <FAQ />
      <Contact />
      
      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Cameron E. Aaron. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
