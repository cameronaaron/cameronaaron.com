'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { skills } from '@/data/skills';
import SectionHeader from '@/components/ui/SectionHeader';
import SkillBar from '@/components/ui/SkillBar';
import SpotlightCard from '@/components/ui/SpotlightCard';

export default function Skills() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section id="skills" className="py-20 bg-background relative overflow-hidden" ref={containerRef}>
      {/* Background decoration with parallax */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-900/10 to-transparent pointer-events-none" 
      />

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader 
          title="Skills & Expertise" 
          subtitle="Deep technical expertise across multiple domains"
        />

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Technical Skills */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h3 
              className="text-2xl font-bold mb-6 text-white"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Technical Skills
            </motion.h3>
            <div className="space-y-4">
              {skills.technical.map((skill, index) => (
                <SkillBar key={index} name={skill.name} level={skill.level} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Domain Expertise */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h3 
              className="text-2xl font-bold mb-6 text-white"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Domain Expertise
            </motion.h3>
            <div className="grid grid-cols-2 gap-4">
              {skills.domains.map((domain, index) => (
                <SpotlightCard key={index} className="p-4 flex items-center justify-center text-center h-full">
                  <p className="text-gray-300 font-medium">{domain}</p>
                </SpotlightCard>
              ))}
            </div>

            {/* Certifications */}
            <h3 className="text-2xl font-bold mt-12 mb-6 text-white">Certifications</h3>
            <div className="space-y-3">
              {skills.certifications.map((cert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-400">{cert}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
