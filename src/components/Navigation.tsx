'use client';

import { AnimatePresence, m, useScroll, useSpring } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { navItems, type NavItem } from '@/data/navigation';
import {
  ACTIVE_SECTION_TRIGGER_LINE,
  buildNavLabelMap,
  computeSectionBounds,
  pickActiveHref,
  shouldCloseMobileMenuOnResize,
} from '@/components/navigation/navigation-logic';

// Memoized so toggling mobileMenuOpen — which re-renders all of Navigation —
// doesn't also reconcile all 8 desktop links. Confirmed necessary: this list
// was the dominant cost of the mobile-menu-toggle interaction's one long task
// (measured via scripts/checks/measure-interaction-latency.mjs, 2026-07).
const DesktopNavLink = memo(function DesktopNavLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  return (
    <a
      href={item.href}
      className={`relative inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-[0.9375rem] font-medium transition-colors ${
        isActive ? 'text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* The highlighter marks where you are; it slides between links
          (shared layoutId) rather than blinking from one to the next. */}
      {isActive ? (
        <m.span
          layoutId="active-nav-pill"
          className="absolute inset-0 rounded-full bg-accent"
          transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.4 }}
        />
      ) : null}
      <span className="relative z-10">{item.name}</span>
    </a>
  );
});

// Memoized for the same reason as DesktopNavLink — these only mount while
// the mobile panel is open, but once open, re-renders of Navigation for
// unrelated reasons (e.g. scroll-driven activeHref changes) would otherwise
// still reconcile all of them.
const MobileNavLink = memo(function MobileNavLink({
  item,
  index,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  index: number;
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <m.a
      href={item.href}
      onClick={onNavigate}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`min-h-[44px] rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
        isActive
          ? 'border-transparent bg-accent text-accent-foreground'
          : 'border-foreground/10 bg-surface text-muted-foreground hover:text-foreground active:bg-muted'
      }`}
    >
      {item.name}
    </m.a>
  );
});

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

    // Coalesce scroll/resize into one rAF tick: computeSectionBounds reads
    // getBoundingClientRect per section, so at most one layout read per frame.
    let frameId = 0;
    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        updateActiveSection();
      });
    };

    updateActiveSection();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape, { passive: true });

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

  const navLabelMap = useMemo(() => buildNavLabelMap(navItems), []);
  const activeNavLabel = navLabelMap.get(activeHref) ?? 'Home';
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      {/* Scroll Progress Bar */}
      <m.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary origin-left z-[60]"
        style={{ scaleX }}
      />

      <nav
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${
          isScrolled || mobileMenuOpen
            ? 'border-foreground/10 bg-background/95 md:bg-background/80 md:backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto">
        <div className="px-6 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <a href="#home" className="font-display text-[1.375rem] font-medium leading-none text-foreground">
              Cameron Aaron
            </a>

            {/* Below the desktop breakpoint the links are behind the menu
                button, so the bar itself says which section is on screen. */}
            <div
              className="ml-auto text-sm font-medium text-muted-foreground lg:sr-only"
              aria-live="polite"
            >
              {activeNavLabel}
            </div>

            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Primary navigation">
              {navItems.map((item) => (
                <DesktopNavLink key={item.href} item={item} isActive={activeHref === item.href} />
              ))}
            </nav>

            <div className="flex items-center lg:hidden">
              <m.button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                whileTap={{ scale: 0.92 }}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-surface text-foreground transition-colors hover:border-foreground/45"
                aria-expanded={mobileMenuOpen}
                aria-controls={mobileMenuOpen ? 'mobile-nav-panel' : undefined}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                <span className="relative block h-3.5 w-5" aria-hidden="true">
                  <m.span
                    className="absolute left-0 top-0 h-[2px] w-full origin-center rounded-full bg-current"
                    animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                  <m.span
                    className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-current"
                    animate={mobileMenuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.18 }}
                  />
                  <m.span
                    className="absolute bottom-0 left-0 h-[2px] w-full origin-center rounded-full bg-current"
                    animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                </span>
              </m.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <m.div
              id="mobile-nav-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="border-t border-foreground/10 lg:hidden pb-[env(safe-area-inset-bottom)]"
            >
              <div className="container mx-auto px-6 py-4">
                <div className="grid grid-cols-2 gap-2">
                  {navItems.map((item, index) => (
                    <MobileNavLink
                      key={item.href}
                      item={item}
                      index={index}
                      isActive={activeHref === item.href}
                      onNavigate={closeMobileMenu}
                    />
                  ))}
                </div>
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
        </div>
      </nav>
    </>
  );
}
