'use client';

import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { getMostVisibleEntry, RAIL_SECTIONS, type SectionRailItem } from './section-rail-logic';
import { getActiveLenis } from './lenis-registry';
import { useEffect, useState } from 'react';

interface SectionRailProps {
  sections?: SectionRailItem[];
}

export default function SectionRail({ sections = RAIL_SECTIONS }: SectionRailProps) {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.4,
  });
  const [activeId, setActiveId] = useState<string>(sections[0].id);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observed: HTMLElement[] = [];
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observed.push(el);
    }

    if (observed.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = getMostVisibleEntry(entries);
        if (mostVisible) {
          setActiveId(mostVisible.target.id);
        }
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    for (const el of observed) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    // event.preventDefault() stops the browser's native jump but doesn't stop
    // propagation, so Lenis's own anchors-driven click listener on window
    // would also fire; stopPropagation() keeps this a single, deterministic
    // scroll instead of two animations racing to the same target.
    event.stopPropagation();

    const lenis = getActiveLenis();
    if (lenis) {
      lenis.scrollTo(target, { immediate: Boolean(prefersReducedMotion) });
    } else {
      // Touch devices: SmoothScroll never constructs Lenis there.
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }

    setActiveId(id);
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <nav
      aria-label="Section progress"
      className="pointer-events-none fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 xl:flex"
      data-testid="section-rail"
    >
      <ul className="pointer-events-auto relative flex flex-col items-center gap-5 rounded-full border border-white/10 bg-black/40 px-3 py-5 backdrop-blur-md shadow-lg shadow-cyan-900/20">
        <li
          className="absolute left-1/2 top-5 bottom-5 w-px -translate-x-1/2 overflow-hidden rounded-full bg-white/10 list-none"
          aria-hidden="true"
        >
          <motion.span
            className="block w-full origin-top bg-gradient-to-b from-cyan-300 via-primary to-emerald-300"
            style={{ scaleY: progress, height: '100%' }}
          />
        </li>

        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id} className="relative">
              <a
                href={`#${section.id}`}
                onClick={handleClick(section.id)}
                aria-label={`Jump to ${section.label}`}
                aria-current={isActive ? 'location' : undefined}
                data-active={isActive ? 'true' : 'false'}
                data-section-id={section.id}
                className="group relative block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <motion.span
                  className="relative z-10 block h-2.5 w-2.5 rounded-full border border-white/40 bg-white/10 transition-colors group-hover:border-cyan-200 group-focus-visible:border-cyan-200"
                  animate={
                    isActive
                      ? { scale: 1.4, backgroundColor: 'rgba(126, 231, 255, 0.95)', borderColor: 'rgba(126, 231, 255, 0.95)' }
                      : { scale: 1, backgroundColor: 'rgba(255,255,255,0.10)' }
                  }
                  transition={{
                    // A spring computes color samples through an interpolation path that can
                    // serialize to oklab() mid-transition — some browsers reject setting that
                    // via inline style ("not an animatable color", motion.dev/troubleshooting/
                    // color-not-animatable). Scale keeps its springy feel; color properties use
                    // a plain tween, which only ever interpolates within the source rgba() space.
                    scale: { type: 'spring', stiffness: 320, damping: 22 },
                    backgroundColor: { type: 'tween', duration: 0.2, ease: 'easeOut' },
                    borderColor: { type: 'tween', duration: 0.2, ease: 'easeOut' },
                  }}
                />
                {isActive ? (
                  <motion.span
                    layoutId="section-rail-halo"
                    className="absolute -inset-2 z-0 rounded-full border"
                    style={{ borderColor: 'rgba(126, 231, 255, 0.4)' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {section.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
