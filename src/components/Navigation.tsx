'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { navItems } from '@/data/navigation';
import Button from '@/components/ui/Button';
import Magnetic from '@/components/ui/Magnetic';

export default function Navigation() {
  const isScrolled = useScrollPosition(50);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

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
              href="#"
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold transition-colors bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent"
            >
              Cameron
            </motion.a>

            <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
              {navItems.map((item, index) => (
                <Magnetic key={index}>
                  <motion.a
                    href={item.href}
                    className={`font-semibold transition-colors inline-block px-2 py-1 ${
                      isScrolled
                        ? 'text-muted-foreground hover:text-primary'
                        : 'text-muted-foreground/80 hover:text-white'
                    }`}
                  >
                    {item.name}
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
              Hire Me
            </Button>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
