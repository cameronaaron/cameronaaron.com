'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { experiences } from '@/data/experience';
import SectionHeader from '@/components/ui/SectionHeader';
import ExperienceCard from '@/components/experience/ExperienceCard';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import {
  EXPERIENCE_FLOW_PHASES,
  getExperienceItemId,
  getExperienceMotionConfig,
  sortExperiencesForTimeline,
} from '@/components/experience/logic';

export default function Experience() {
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
  const { performanceTier } = usePerformanceProfile();
  const { isLiteMotion, isCinematic, entryYOffset, timelineTravel, timelineStagger } =
    getExperienceMotionConfig(performanceTier);
  const sortedExperiences = sortExperiencesForTimeline(experiences);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const handleJumpToExperience = (index: number) => {
    setActiveExperienceIndex(index);
    const target = document.getElementById(getExperienceItemId(index));
    target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section id="experience" className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10" ref={containerRef}>
        <SectionHeader
          title="Healthcare & Technology Experience"
          subtitle="Clinical, research, and operations experience across aerospace medicine, neuroscience, and healthcare technology"
          className="[&>h2]:font-display"
        />

        <motion.div
          initial={{ opacity: 0, y: entryYOffset }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: isLiteMotion ? 0.42 : 0.65, ease: 'easeOut' }}
          className="mx-auto mb-8 flex max-w-5xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-md"
          role="group"
          aria-label="Experience flow phases"
        >
          {EXPERIENCE_FLOW_PHASES.map((phase, index) => (
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * (isLiteMotion ? 0.04 : 0.1), duration: 0.4, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/90"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
              {phase}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: entryYOffset }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: isLiteMotion ? 0.42 : 0.6, ease: 'easeOut' }}
          className="mx-auto mb-10 flex max-w-5xl flex-wrap justify-center gap-3"
          role="group"
          aria-label="Experience quick navigation"
        >
          {sortedExperiences.map((exp, index) => {
            const isActive = activeExperienceIndex === index;

            return (
              <motion.button
                key={`${exp.company}-${index}`}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * (isLiteMotion ? 0.02 : 0.05), duration: 0.35, ease: 'easeOut' }}
                onClick={() => handleJumpToExperience(index)}
                onMouseEnter={() => setActiveExperienceIndex(index)}
                onFocus={() => setActiveExperienceIndex(index)}
                whileHover={isCinematic ? { y: -2, scale: 1.02 } : undefined}
                whileTap={isLiteMotion ? undefined : { scale: 0.98 }}
                data-testid={`experience-nav-${index}`}
                data-latest-period={exp.latestPeriod}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                  isActive
                    ? 'border-cyan-300/45 bg-cyan-300/15 text-cyan-100 shadow-lg shadow-cyan-500/20'
                    : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/25 hover:text-foreground'
                }`}
                aria-pressed={isActive}
              >
                <span>{exp.company}</span>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="max-w-5xl mx-auto relative">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2 hidden md:block">
            <motion.div 
              style={{ scaleY, transformOrigin: "top" }}
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-500 via-pink-500 to-purple-500"
            />
          </div>

          <motion.div
            className="space-y-12 md:space-y-24"
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
              <motion.div
                key={index}
                id={getExperienceItemId(index)}
                data-testid={`experience-item-${index}`}
                data-latest-period={exp.latestPeriod}
                variants={{
                  hidden: {
                    opacity: 0,
                    y: entryYOffset,
                    x: isLiteMotion ? 0 : index % 2 === 0 ? -timelineTravel : timelineTravel,
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
                className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >

                <motion.div
                  className="absolute left-8 md:left-1/2 z-20 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-background md:block"
                  animate={
                    activeExperienceIndex === index
                      ? {
                          scale: 1.35,
                          backgroundColor: 'rgb(34 211 238)',
                          boxShadow: isLiteMotion ? '0 0 10px rgba(34, 211, 238, 0.55)' : '0 0 16px rgba(34, 211, 238, 0.85)',
                        }
                      : {
                          scale: 1,
                          backgroundColor: 'rgb(168 85 247)',
                          boxShadow: isLiteMotion ? '0 0 6px rgba(168, 85, 247, 0.35)' : '0 0 10px rgba(168, 85, 247, 0.5)',
                        }
                  }
                  transition={isLiteMotion ? { duration: 0.2, ease: 'easeOut' } : { type: 'spring', stiffness: 280, damping: 22 }}
                />

                <div
                  className="w-full pl-20 md:w-[calc(50%-2rem)] md:pl-0"
                  onMouseEnter={() => setActiveExperienceIndex(index)}
                >
                  <ExperienceCard
                    experience={exp}
                    index={index}
                    isActive={activeExperienceIndex === index}
                    onActivate={() => setActiveExperienceIndex(index)}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
