'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { navItems } from '@/data/navigation';
import Button from '@/components/ui/Button';
import Magnetic from '@/components/ui/Magnetic';

export default function Navigation() {
  const isScrolled = useScrollPosition(50);
  const [activeHref, setActiveHref] = useState(navItems[0]?.href ?? '#home');
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const updateActiveSection = () => {
      const triggerLine = 140;
      let closest: { href: string; distance: number } | null = null;

      for (const item of navItems) {
        const sectionId = item.href.replace('#', '');
        const section = document.getElementById(sectionId);
        if (!section) continue;

        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - triggerLine);
        const isIntersectingTrigger = rect.top <= triggerLine && rect.bottom >= triggerLine;

        if (isIntersectingTrigger) {
          closest = { href: item.href, distance: 0 };
          break;
        }

        if (!closest || distance < closest.distance) {
          closest = { href: item.href, distance };
        }
      }

      if (closest) {
        const nextHref = closest.href;
        setActiveHref((current) => (current === nextHref ? current : nextHref));
      }
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, []);

  const activeNavLabel = navItems.find((item) => item.href === activeHref)?.name ?? 'Home';

  return (
    <>
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 origin-left z-[60]"
        style={{ scaleX }}
      />

      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        Skip to main content
      </a>

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-md border-b border-white/5 shadow-lg'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.a
              href="#home"
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold transition-colors bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent font-display"
            >
              Cameron
            </motion.a>

            <motion.div
              key={activeHref}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/90 lg:flex"
              aria-live="polite"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
              </span>
              {activeNavLabel}
            </motion.div>

            <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
              {navItems.map((item, index) => (
                <Magnetic key={index}>
                  <motion.a
                    href={item.href}
                    className={`relative inline-block rounded-full px-3 py-1.5 font-semibold transition-colors ${
                      isScrolled
                        ? 'text-muted-foreground hover:text-primary'
                        : 'text-muted-foreground/80 hover:text-white'
                    } ${activeHref === item.href ? 'text-white' : ''}`}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                    aria-current={activeHref === item.href ? 'page' : undefined}
                  >
                    {activeHref === item.href ? (
                      <motion.span
                        layoutId="active-nav-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-cyan-500/25 to-primary/30 ring-1 ring-cyan-300/25"
                        transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.35 }}
                      />
                    ) : null}
                    <span className="relative z-10">{item.name}</span>
                  </motion.a>
                </Magnetic>
              ))}
            </nav>

            <Button
              href="#contact"
              variant="primary"
              size="md"
              className="shadow-lg shadow-primary/20 hover:shadow-primary/40"
            >
              Contact
            </Button>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
