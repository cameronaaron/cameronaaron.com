'use client';

import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { navItems } from '@/data/navigation';
import Magnetic from '@/components/ui/Magnetic';
import {
  ACTIVE_SECTION_TRIGGER_LINE,
  computeSectionBounds,
  getActiveNavLabel,
  pickActiveHref,
  shouldCloseMobileMenuOnResize,
} from '@/components/navigation/logic';

export default function Navigation() {
  const isScrolled = useScrollPosition(50);
  const [activeHref, setActiveHref] = useState(navItems[0]?.href ?? '#home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const updateActiveSection = () => {
      const sections = computeSectionBounds(navItems);
      setActiveHref((current) => {
        const nextHref = pickActiveHref(sections, ACTIVE_SECTION_TRIGGER_LINE, current);
        return current === nextHref ? current : nextHref;
      });
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnDesktop = () => {
      if (shouldCloseMobileMenuOnResize(window.innerWidth)) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', closeOnDesktop, { passive: true });

    return () => {
      window.removeEventListener('resize', closeOnDesktop);
    };
  }, [mobileMenuOpen]);

  const activeNavLabel = getActiveNavLabel(navItems, activeHref);

  return (
    <>
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 origin-left z-[60]"
        style={{ scaleX }}
      />

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
            ? 'bg-background/95 border-b border-white/10 shadow-lg md:bg-background/80 md:border-white/5 md:backdrop-blur-md'
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
              className="text-2xl font-bold text-white transition-colors hover:text-cyan-100 font-display"
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
                        ? 'text-foreground hover:text-cyan-100'
                        : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] hover:text-cyan-100'
                    } ${activeHref === item.href ? 'text-cyan-100' : ''}`}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                    aria-current={activeHref === item.href ? 'page' : undefined}
                  >
                    {activeHref === item.href ? (
                      <motion.span
                        layoutId="active-nav-pill"
                        className="absolute inset-0 -z-10 rounded-full border"
                        style={{
                          background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.24), rgba(14, 165, 233, 0.18))',
                          borderColor: 'rgba(103, 232, 249, 0.25)',
                        }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.35 }}
                      />
                    ) : null}
                    <span className="relative z-10">{item.name}</span>
                  </motion.a>
                </Magnetic>
              ))}
            </nav>

            <div className="flex items-center md:hidden">
              <motion.button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                whileTap={{ scale: 0.92 }}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-cyan-100 backdrop-blur-md transition-colors hover:border-cyan-300/40 hover:text-cyan-200"
                aria-expanded={mobileMenuOpen}
                aria-controls={mobileMenuOpen ? 'mobile-nav-panel' : undefined}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                <span className="relative block h-3.5 w-5" aria-hidden="true">
                  <motion.span
                    className="absolute left-0 top-0 h-[2px] w-full origin-center rounded-full bg-current"
                    animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                  <motion.span
                    className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-current"
                    animate={mobileMenuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.18 }}
                  />
                  <motion.span
                    className="absolute bottom-0 left-0 h-[2px] w-full origin-center rounded-full bg-current"
                    animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              id="mobile-nav-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="border-t border-white/10 bg-black/85 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom)]"
            >
              <div className="container mx-auto px-6 py-4">
                <div className="grid grid-cols-2 gap-2">
                  {navItems.map((item, index) => (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`min-h-[44px] rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
                        activeHref === item.href
                          ? 'border-cyan-300/45 bg-cyan-300/15 text-cyan-100'
                          : 'border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground active:bg-white/10'
                      }`}
                    >
                      {item.name}
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
