'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import { educationItems, prerequisiteCourses, honorsAndAffiliations } from '@/data/education';
import { buildEducationCollections, formatGradeDisplay } from '@/components/education/logic';

export default function Education() {
  const { sortedEducationItems, sortedHonorsAndAffiliations, sortedPrerequisiteCourses } = useMemo(
    () => buildEducationCollections(educationItems, prerequisiteCourses, honorsAndAffiliations),
    []
  );

  return (
    <section id="education" className="py-20 bg-background relative overflow-hidden" aria-labelledby="education-heading">
      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          headingId="education-heading"
          title="Education & Nursing Prerequisites"
          subtitle="Graduate training, interdisciplinary scholarship, and prerequisite readiness for nursing pathways"
          className="[&>h2]:font-display"
        />

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-14">
          {sortedEducationItems.map((item, index) => (
            <motion.article
              key={`${item.institution}-${item.credential}`}
              data-testid={`education-card-${index}`}
              data-period={item.period}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 h-full"
            >
              <p className="text-cyan-300 text-sm mb-3">{item.period}</p>
              <h3 className="text-foreground text-xl font-bold mb-2 font-display">{item.credential}</h3>
              <div className="mb-4">
                {item.verificationLinks?.[0] ? (
                  <a
                    href={item.verificationLinks[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground font-medium hover:text-cyan-200 transition-colors"
                  >
                    {item.institution}
                  </a>
                ) : (
                  <p className="text-muted-foreground">{item.institution}</p>
                )}
                {item.verificationLinks && item.verificationLinks.length > 1 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.verificationLinks.slice(1).map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100 hover:border-cyan-300/40 hover:bg-cyan-500/15 hover:text-cyan-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
              <ul className="space-y-2">
                {item.details.map((detail) => (
                  <li key={detail} className="text-muted-foreground text-sm flex gap-2">
                    <span className="text-emerald-300 mt-[2px]">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>

        <div
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 mb-12 overflow-x-auto"
          role="region"
          aria-label="Nursing program prerequisite coursework table"
          tabIndex={0}
        >
          <h3 className="text-2xl font-bold text-foreground mb-5 font-display">Nursing Program Prerequisite Coursework</h3>
          <div className="space-y-3 md:hidden">
            {sortedPrerequisiteCourses.map((course, index) => (
              <motion.article
                key={`${course.requirement}-${course.course}-mobile`}
                data-testid={`prereq-mobile-row-${index}`}
                data-status={course.status}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 p-4"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/80">{course.requirement}</p>
                <p className="mt-1 text-sm text-foreground font-medium leading-relaxed">{course.course}</p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-center">
                    <p className="text-muted-foreground/80 uppercase tracking-[0.08em]">Units</p>
                    <p className="mt-1 text-foreground font-semibold">{course.units}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-center">
                    <p className="text-muted-foreground/80 uppercase tracking-[0.08em]">Grade / GPA</p>
                    <p className="mt-1 text-foreground font-semibold">{formatGradeDisplay(course.grade, course.gpa)}</p>
                  </div>
                  <div className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-2 text-center">
                    <p className="text-cyan-200/80 uppercase tracking-[0.08em]">Status</p>
                    <p className="mt-1 text-cyan-200 font-semibold">{course.status}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="hidden md:block min-w-[920px]">
            <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
              <p className="col-span-3">Requirement</p>
              <p className="col-span-5">Relevant Course</p>
              <p className="col-span-1">Units</p>
              <p className="col-span-1">Grade/GPA</p>
              <p className="col-span-2">Status</p>
            </div>
            {sortedPrerequisiteCourses.map((course, index) => (
              <div
                key={`${course.requirement}-${course.course}`}
                data-testid={`prereq-desktop-row-${index}`}
                data-status={course.status}
                className="grid grid-cols-12 gap-3 px-3 py-3 border-b border-white/5 last:border-b-0"
              >
                <p className="col-span-3 text-foreground text-sm font-medium">{course.requirement}</p>
                <p className="col-span-5 text-muted-foreground text-sm">{course.course}</p>
                <p className="col-span-1 text-muted-foreground text-sm">{course.units}</p>
                <p className="col-span-1 text-muted-foreground text-sm">{formatGradeDisplay(course.grade, course.gpa)}</p>
                <p className="col-span-2 text-sm text-cyan-300 flex items-center gap-1.5">
                  {course.nonFinalized ? (
                    <span className="relative flex h-1.5 w-1.5 flex-shrink-0" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    </span>
                  ) : null}
                  {course.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-foreground mb-4 font-display">Honors & Affiliations</h3>
          <div className="flex flex-wrap gap-3">
            {sortedHonorsAndAffiliations.map((honor, index) => {
              const pillClass = "px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-100 text-sm";
              const sharedProps = {
                'data-testid': `honor-pill-${index}`,
                initial: { opacity: 0, scale: 0.92 },
                whileInView: { opacity: 1, scale: 1 },
                viewport: { once: true },
                transition: { delay: index * 0.04 },
              };
              return honor.url ? (
                <motion.a
                  key={honor.label}
                  {...sharedProps}
                  href={honor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${pillClass} hover:border-cyan-300/40 hover:bg-cyan-500/15 hover:text-cyan-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background`}
                >
                  {honor.label}
                </motion.a>
              ) : (
                <motion.span key={honor.label} {...sharedProps} className={pillClass}>
                  {honor.label}
                </motion.span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
