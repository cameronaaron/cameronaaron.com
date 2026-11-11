'use client';

import { m, useScroll, useTransform } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';
import { experiences } from '@/data/experience';
import SectionHeader from '@/components/ui/SectionHeader';
import ExperienceCard from '@/components/experience/ExperienceCard';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import { scrollToSection } from '@/components/ui/scroll-to-section';
import {
  EXPERIENCE_FLOW_PHASES,
  getExperienceItemId,
  getExperienceItemX,
  getExperienceMotionConfig,
  getExperienceNavStaggerDelay,
  getExperiencePhaseStaggerDelay,
  getTimelineDotAnimation,
  getTimelineDotTransition,
  sortExperiencesForTimeline,
} from '@/components/experience/experience-logic';

export default function Experience() {
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
  const { performanceTier } = usePerformanceProfile();
  const { isLiteMotion, isCinematic, entryYOffset, timelineTravel, timelineStagger } =
    getExperienceMotionConfig(performanceTier);
  const sortedExperiences = useMemo(() => sortExperiencesForTimeline(experiences), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const handleJumpToExperience = (index: number) => {
    setActiveExperienceIndex(index);
    // The quick-nav buttons and the items map the same list in one render,
    // so every button's item exists.
    scrollToSection(document.getElementById(getExperienceItemId(index))!, { reducedMotion: isLiteMotion });
  };

  // Stable identity so the memoized ExperienceCard never re-renders from a
  // fresh callback prop — only from its own isActive flip.
  const handleActivate = useCallback((index: number) => setActiveExperienceIndex(index), []);

  return (
    <section id="experience" className="experience-editorial py-20 md:py-28 relative" aria-labelledby="experience-heading">
      <div className="container mx-auto px-6 relative z-10" ref={containerRef}>
        <SectionHeader
          headingId="experience-heading"
          title="Healthcare & Technology Experience"
          subtitle="Clinical, research, and operations experience across aerospace medicine, neuroscience, and healthcare technology"
        />

        <div className="experience-journey">
        <aside className="experience-directory">
        <m.div
          initial={{ opacity: 0, y: entryYOffset }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: isLiteMotion ? 0.42 : 0.65, ease: 'easeOut' }}
          className="experience-phases mx-auto mb-8 flex max-w-5xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-foreground/10 bg-surface px-4 py-3"
          role="group"
          aria-label="Experience flow phases"
        >
          {EXPERIENCE_FLOW_PHASES.map((phase, index) => (
            <m.div
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: getExperiencePhaseStaggerDelay(index, isLiteMotion), duration: 0.4, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {phase}
            </m.div>
          ))}
        </m.div>

        <m.div
          initial={{ opacity: 0, y: entryYOffset }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: isLiteMotion ? 0.42 : 0.6, ease: 'easeOut' }}
          className="experience-links mx-auto mb-10 flex max-w-5xl flex-wrap justify-center gap-3"
          role="group"
          aria-label="Experience quick navigation"
        >
          {sortedExperiences.map((exp, index) => {
            const isActive = activeExperienceIndex === index;

            return (
              <m.button
                key={`${exp.company}-${index}`}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: getExperienceNavStaggerDelay(index, isLiteMotion), duration: 0.35, ease: 'easeOut' }}
                onClick={() => handleJumpToExperience(index)}
                onMouseEnter={() => setActiveExperienceIndex(index)}
                onFocus={() => setActiveExperienceIndex(index)}
                whileHover={isCinematic ? { y: -2, scale: 1.02 } : undefined}
                whileTap={isLiteMotion ? undefined : { scale: 0.98 }}
                data-testid={`experience-nav-${index}`}
                data-latest-period={exp.latestPeriod}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors duration-200 ${
                  isActive
                    ? 'border-transparent bg-accent text-accent-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                aria-pressed={isActive}
              >
                <span>{exp.company}</span>
              </m.button>
            );
          })}
        </m.div>

        </aside>
        <div className="experience-timeline relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-foreground/10 -translate-x-1/2 hidden md:block">
            <m.div 
              style={{ scaleY, transformOrigin: "top" }}
              className="absolute top-0 left-0 w-full h-full bg-primary"
            />
          </div>

          <m.div
            className="space-y-8 md:space-y-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: timelineStagger,
                },
              },
            }}
          >
            {sortedExperiences.map((exp, index) => (
              <m.div
                key={exp.company}
                id={getExperienceItemId(index)}
                data-testid={`experience-item-${index}`}
                data-latest-period={exp.latestPeriod}
                variants={{
                  hidden: {
                    opacity: 0,
                    y: entryYOffset,
                    x: getExperienceItemX(index, isLiteMotion, timelineTravel),
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    x: 0,
                    transition: {
                      duration: isLiteMotion ? 0.38 : 0.62,
                      ease: 'easeOut',
                    },
                  },
                }}
                className="experience-entry relative flex items-center"
              >

                <m.div
                  className="absolute left-0 top-10 z-20 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-background md:block"
                  animate={getTimelineDotAnimation(isLiteMotion, activeExperienceIndex === index)}
                  transition={getTimelineDotTransition(isLiteMotion)}
                />

                <div className="w-full md:pl-8">
                  <ExperienceCard
                    experience={exp}
                    index={index}
                    isActive={activeExperienceIndex === index}
                    onActivate={handleActivate}
                  />
                </div>
              </m.div>
            ))}
          </m.div>
        </div>
        </div>
      </div>
    </section>
  );
}
