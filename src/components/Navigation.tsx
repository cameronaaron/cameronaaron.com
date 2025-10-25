'use client';

import { motion } from 'framer-motion';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { navItems } from '@/data/navigation';
import Button from '@/components/ui/Button';

export default function Navigation() {
  const isScrolled = useScrollPosition(50);

  return (
    <>
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-6 focus:py-3 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        Skip to main content
      </a>

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-lg shadow-lg'
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
              className={`text-2xl font-bold transition-colors ${
                isScrolled
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
                  : 'text-white'
              }`}
              aria-label="Cameron E. Aaron - Home"
            >
              C.E.A.
            </motion.a>

            <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
              {navItems.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  whileHover={{ scale: 1.1 }}
                  className={`font-semibold transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-purple-600'
                      : 'text-white hover:text-purple-300'
                  }`}
                  aria-label={`Navigate to ${item.name} section`}
                >
                  {item.name}
                </motion.a>
              ))}
            </nav>

            <Button
              href="#contact"
              variant={isScrolled ? 'primary' : 'secondary'}
              size="md"
              ariaLabel="Contact me for hiring opportunities"
            >
              Hire Me
            </Button>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
