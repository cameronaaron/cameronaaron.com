'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { experiences } from '@/data/experience';
import SectionHeader from '@/components/ui/SectionHeader';
import ExperienceCard from '@/components/experience/ExperienceCard';

export default function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="experience" className="py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10" ref={containerRef}>
        <SectionHeader
          title="Professional Experience"
          subtitle="Building innovative solutions at world-class companies"
        />

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
              <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                
                {/* Timeline Dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-background bg-purple-500 z-20 hidden md:block shadow-[0_0_10px_rgba(168,85,247,0.5)]" />

                {/* Content */}
                <div className="w-full md:w-[calc(50%-2rem)] pl-20 md:pl-0">
                  <ExperienceCard experience={exp} index={index} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
