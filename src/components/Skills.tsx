'use client';

import { m } from 'framer-motion';
import { useMemo, useState } from 'react';
import { skills } from '@/data/skills';
import SectionHeader from '@/components/ui/SectionHeader';
import SkillBar from '@/components/ui/SkillBar';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import {
  SKILLS_JOURNEY_PHASES,
  getDomainCardHoverTransition,
  getSkillBarEntryTransition,
  getSkillColumnVariants,
  getSkillsMotionConfig,
  getStrongestSkill,
  sortTechnicalSkills,
  type TechnicalView,
} from '@/components/skills/skills-logic';

export default function Skills() {
  const [technicalView, setTechnicalView] = useState<TechnicalView>('priority');
  const { performanceTier } = usePerformanceProfile();
  const { isLiteMotion, isCinematic, entryYOffset, staggerDelay } =
    getSkillsMotionConfig(performanceTier);
  const technicalSkills = useMemo(() => {
    return sortTechnicalSkills(skills.technical, technicalView);
  }, [technicalView]);

  const strongestSkill = getStrongestSkill(technicalSkills);

  return (
    <section id="skills" className="py-20 md:py-28 relative" aria-labelledby="skills-heading">
      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          headingId="skills-heading"
          title="Clinical & Technical Skills"
          subtitle="Clinical strengths, research tools, and technical skills"
        />

        <m.div
          initial={{ opacity: 0, y: entryYOffset }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: isLiteMotion ? 0.4 : 0.62, ease: 'easeOut' }}
          className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2"
          role="group"
          aria-label="Skills journey phases"
        >
          {SKILLS_JOURNEY_PHASES.map((phase, index) => (
            <m.div
              key={phase}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * (isLiteMotion ? 0.04 : 0.1), duration: 0.36, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              {phase}
            </m.div>
          ))}
        </m.div>

        <m.div
          initial={{ opacity: 0, y: entryYOffset }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: isLiteMotion ? 0.4 : 0.5, ease: 'easeOut' }}
          className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-surface px-5 py-3"
        >
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Sort skills:</span> view by proficiency or alphabetical order.
          </div>
          <div className="flex items-center gap-2">
            <m.button
              type="button"
              onClick={() => setTechnicalView('priority')}
              whileHover={isCinematic ? { y: -1 } : undefined}
              whileTap={isLiteMotion ? undefined : { scale: 0.98 }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                technicalView === 'priority'
                  ? 'border-transparent bg-accent text-accent-foreground'
                  : 'border-foreground/15 bg-surface text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={technicalView === 'priority'}
            >
              Priority
            </m.button>
            <m.button
              type="button"
              onClick={() => setTechnicalView('alphabetical')}
              whileHover={isCinematic ? { y: -1 } : undefined}
              whileTap={isLiteMotion ? undefined : { scale: 0.98 }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                technicalView === 'alphabetical'
                  ? 'border-transparent bg-accent text-accent-foreground'
                  : 'border-foreground/15 bg-surface text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={technicalView === 'alphabetical'}
            >
              Alphabetical
            </m.button>
          </div>
        </m.div>

        <m.div
          className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: staggerDelay },
            },
          }}
        >
          <m.div variants={getSkillColumnVariants(isLiteMotion, 'left', entryYOffset)}>
            <h3 className="font-display text-3xl font-medium mb-6 text-foreground">Core competencies</h3>
            {strongestSkill ? (
              <m.p
                key={`${technicalView}-${strongestSkill.name}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="font-data mb-5 text-sm text-muted-foreground"
              >
                Top skill: {strongestSkill.name} ({strongestSkill.level}%)
              </m.p>
            ) : null}
            <div className="space-y-4">
              {technicalSkills.map((skill, index) => (
                <m.div
                  key={skill.name}
                  initial={{ opacity: 0, y: entryYOffset }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={getSkillBarEntryTransition(isLiteMotion, index)}
                >
                  <SkillBar name={skill.name} level={skill.level} index={index} />
                </m.div>
              ))}
            </div>
          </m.div>

          <m.div variants={getSkillColumnVariants(isLiteMotion, 'right', entryYOffset)}>
            <h3 className="font-display text-3xl font-medium mb-6 text-foreground">Domain expertise</h3>
            <div className="grid grid-cols-2 gap-4">
              {skills.domains.map((domain, index) => (
                <m.div
                  key={domain}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * (isLiteMotion ? 0.03 : 0.08), duration: isLiteMotion ? 0.22 : 0.3, ease: 'easeOut' }}
                >
                  <SpotlightCard
                    className="p-4 flex items-center justify-center text-center h-full group cursor-default"
                    as={m.div}
                    whileHover={isCinematic ? { y: -2 } : undefined}
                    transition={getDomainCardHoverTransition(isLiteMotion)}
                  >
                    <p className="text-foreground font-medium">{domain}</p>
                  </SpotlightCard>
                </m.div>
              ))}
            </div>

            <h3 className="font-display text-3xl font-medium mt-12 mb-6 text-foreground">Certification highlights</h3>
            <div className="space-y-3">
              {skills.certifications.map((cert, index) => (
                <m.div
                  key={cert}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * (isLiteMotion ? 0.025 : 0.07), duration: isLiteMotion ? 0.24 : 0.35, ease: 'easeOut' }}
                  className="flex items-start gap-3"
                >
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-foreground">{cert}</p>
                </m.div>
              ))}
            </div>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
