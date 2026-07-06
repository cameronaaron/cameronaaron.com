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

          <div className="hidden md:grid md:grid-cols-12 md:gap-3 md:px-3 md:py-2 md:text-xs md:uppercase md:tracking-wider md:text-muted-foreground md:border-b md:border-white/10 md:min-w-[920px]">
            <p className="md:col-span-3">Requirement</p>
            <p className="md:col-span-5">Relevant Course</p>
            <p className="md:col-span-1">Units</p>
            <p className="md:col-span-1">Grade/GPA</p>
            <p className="md:col-span-2">Status</p>
          </div>

          {/* One row per course, reflowed by breakpoint rather than duplicated —
              md:contents on the field-group wrappers below dissolves them into
              this row's 12-col grid on desktop while keeping the boxed mobile
              card layout on narrow viewports. Halves this table's DOM node
              count versus rendering separate mobile/desktop trees. */}
          <div className="space-y-3 md:space-y-0 md:min-w-[920px]">
            {sortedPrerequisiteCourses.map((course, index) => (
              <motion.div
                key={`${course.requirement}-${course.course}`}
                data-testid={`prereq-row-${index}`}
                data-status={course.status}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 p-4 md:grid md:grid-cols-12 md:items-center md:gap-3 md:rounded-none md:border-0 md:border-b md:border-white/5 md:bg-none md:from-transparent md:to-transparent md:p-3 md:last:border-b-0"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/80 md:col-span-3 md:normal-case md:tracking-normal md:text-sm md:font-medium md:text-foreground">
                  {course.requirement}
                </p>
                <p className="mt-1 text-sm text-foreground font-medium leading-relaxed md:col-span-5 md:mt-0 md:font-normal md:text-muted-foreground">
                  {course.course}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs md:contents md:mt-0 md:text-sm">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-center md:contents">
                    <p className="text-muted-foreground/80 uppercase tracking-[0.08em] md:hidden">Units</p>
                    <p className="mt-1 text-foreground font-semibold md:col-span-1 md:mt-0 md:font-normal md:text-muted-foreground">
                      {course.units}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-center md:contents">
                    <p className="text-muted-foreground/80 uppercase tracking-[0.08em] md:hidden">Grade / GPA</p>
                    <p className="mt-1 text-foreground font-semibold md:col-span-1 md:mt-0 md:font-normal md:text-muted-foreground">
                      {formatGradeDisplay(course.grade, course.gpa)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-2 text-center md:contents">
                    <p className="text-cyan-200/80 uppercase tracking-[0.08em] md:hidden">Status</p>
                    <p className="mt-1 text-cyan-200 font-semibold md:col-span-2 md:mt-0 md:font-normal md:flex md:items-center md:gap-1.5">
                      {course.nonFinalized ? (
                        <span className="relative flex h-1.5 w-1.5 flex-shrink-0" aria-hidden="true">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/60" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        </span>
                      ) : null}
                      {course.status}
                    </p>
                  </div>
                </div>
              </motion.div>
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
