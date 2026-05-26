'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { experiences } from '@/data/experience';
import SectionHeader from '@/components/ui/SectionHeader';
import ExperienceCard from '@/components/experience/ExperienceCard';

export default function Experience() {
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const handleJumpToExperience = (index: number) => {
    setActiveExperienceIndex(index);
    const target = document.getElementById(`experience-item-${index}`);
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
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto mb-10 flex max-w-5xl flex-wrap justify-center gap-3"
          aria-label="Experience quick navigation"
        >
          {experiences.map((exp, index) => {
            const isActive = activeExperienceIndex === index;

            return (
              <motion.button
                key={`${exp.company}-${index}`}
                type="button"
                onClick={() => handleJumpToExperience(index)}
                onMouseEnter={() => setActiveExperienceIndex(index)}
                onFocus={() => setActiveExperienceIndex(index)}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
          {/* Timeline Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2 hidden md:block">
            <motion.div 
              style={{ scaleY, transformOrigin: "top" }}
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-500 via-pink-500 to-purple-500"
            />
          </div>

          <div className="space-y-12 md:space-y-24">
            {experiences.map((exp, index) => (
              <div
                key={index}
                id={`experience-item-${index}`}
                className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                
                {/* Timeline Dot */}
                <motion.div
                  className="absolute left-8 md:left-1/2 z-20 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-background md:block"
                  animate={
                    activeExperienceIndex === index
                      ? {
                          scale: 1.35,
                          backgroundColor: 'rgb(34 211 238)',
                          boxShadow: '0 0 16px rgba(34, 211, 238, 0.85)',
                        }
                      : {
                          scale: 1,
                          backgroundColor: 'rgb(168 85 247)',
                          boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                        }
                  }
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                />

                {/* Content */}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
