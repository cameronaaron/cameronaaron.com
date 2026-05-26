'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { skills } from '@/data/skills';
import SectionHeader from '@/components/ui/SectionHeader';
import SkillBar from '@/components/ui/SkillBar';
import SpotlightCard from '@/components/ui/SpotlightCard';

export default function Skills() {
  const [technicalView, setTechnicalView] = useState<'priority' | 'alphabetical'>('priority');
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const technicalSkills = useMemo(() => {
    if (technicalView === 'alphabetical') {
      return [...skills.technical].sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...skills.technical].sort((a, b) => b.level - a.level);
  }, [technicalView]);

  const strongestSkill = technicalSkills[0];

  return (
    <section id="skills" className="py-20 bg-background relative overflow-hidden" ref={containerRef}>
      {/* Background decoration with parallax */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-900/10 to-transparent pointer-events-none" 
      />

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader 
          title="Clinical & Technical Skills" 
          subtitle="Clinical strengths, research tools, and technical skills"
          className="[&>h2]:font-display"
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mx-auto mb-10 flex max-w-5xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-md"
        >
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Sort skills:</span> view by proficiency or alphabetical order.
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={() => setTechnicalView('priority')}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                technicalView === 'priority'
                  ? 'border-cyan-300/45 bg-cyan-300/15 text-cyan-100'
                  : 'border-white/15 bg-white/5 text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={technicalView === 'priority'}
            >
              Priority
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setTechnicalView('alphabetical')}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                technicalView === 'alphabetical'
                  ? 'border-emerald-300/45 bg-emerald-300/15 text-emerald-100'
                  : 'border-white/15 bg-white/5 text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={technicalView === 'alphabetical'}
            >
              Alphabetical
            </motion.button>
          </div>
        </motion.div>

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
              Core Competencies
            </motion.h3>
            {strongestSkill ? (
              <motion.p
                key={`${technicalView}-${strongestSkill.name}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="mb-5 text-sm text-cyan-200/90"
              >
                  Top skill: {strongestSkill.name} ({strongestSkill.level}%)
              </motion.p>
            ) : null}
            <div className="space-y-4">
              {technicalSkills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  layout
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                >
                  <SkillBar name={skill.name} level={skill.level} index={index} />
                </motion.div>
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
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <SpotlightCard 
                    className="p-4 flex items-center justify-center text-center h-full group cursor-default"
                    as={motion.div}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -5,
                      boxShadow: "0 10px 30px rgba(168, 85, 247, 0.3)"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <p className="text-gray-300 font-medium group-hover:text-primary transition-colors">{domain}</p>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>

            {/* Certifications */}
            <motion.h3 
              className="text-2xl font-bold mt-12 mb-6 text-white"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Certification Highlights
            </motion.h3>
            <div className="space-y-3">
              {skills.certifications.map((cert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 10, scale: 1.02 }}
                  className="flex items-start gap-3 group cursor-default"
                >
                  <motion.div 
                    className="flex-shrink-0 mt-1"
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-5 h-5 text-purple-500 group-hover:text-pink-500 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                  <p className="text-gray-400 group-hover:text-gray-200 transition-colors">{cert}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
