'use client';

import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export interface SectionRailItem {
  id: string;
  label: string;
}

export const RAIL_SECTIONS: SectionRailItem[] = [
  { id: 'home', label: 'Intro' },
  { id: 'certifications', label: 'Credentials' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Research' },
  { id: 'skills', label: 'Skills' },
  { id: 'testimonials', label: 'Voices' },
  { id: 'contact', label: 'Connect' },
];

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

    const observed = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    if (observed.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
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
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
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
                      ? { scale: 1.4, backgroundColor: 'rgba(103, 232, 249, 0.95)', borderColor: 'rgba(103, 232, 249, 0.95)' }
                      : { scale: 1, backgroundColor: 'rgba(255,255,255,0.10)' }
                  }
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                />
                {isActive ? (
                  <motion.span
                    layoutId="section-rail-halo"
                    className="absolute -inset-2 z-0 rounded-full border border-cyan-300/40"
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
