import ScrambleText from '@/components/ui/ScrambleText';
import SectionHeader from '@/components/ui/SectionHeader';
import { educationItems, prerequisiteCourses, honorsAndAffiliations } from '@/data/education';
import { buildEducationCollections, formatGradeDisplay } from '@/components/education/education-logic';

// Server Component (no 'use client'): Education is display content — cards, a
// prerequisite table, honor pills — with zero interactive state. It ships zero
// client JS and never hydrates; only the small client islands it embeds
// (SectionHeader, the per-credential ScrambleText headings) hydrate. The
// former framer `whileInView` entrance fades are dropped (RSC migration,
// 2026-07): the section is below the fold, content-visibility already skips its
// off-screen paint, and the collections are sorted once here at BUILD time
// (previously a client-side memoized call — pointless for static data that
// never changes between renders). §5 render-path law.
export default function Education() {
  const { sortedEducationItems, sortedHonorsAndAffiliations, sortedPrerequisiteCourses, prerequisiteProgress } =
    buildEducationCollections(educationItems, prerequisiteCourses, honorsAndAffiliations);

  return (
    <section id="education" className="py-20 bg-background relative overflow-hidden" aria-labelledby="education-heading">
      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          headingId="education-heading"
          index="03"
          title="Education & Nursing Prerequisites"
          subtitle="Graduate training, interdisciplinary scholarship, and prerequisite readiness for nursing pathways"
          className="[&>h2]:font-display"
        />

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-14">
          {sortedEducationItems.map((item, index) => (
            <article
              key={`${item.institution}-${item.credential}`}
              data-testid={`education-card-${index}`}
              data-period={item.period}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 h-full"
            >
              <p className="text-cyan-300 text-sm mb-3">{item.period}</p>
              <h3 className="text-foreground text-xl font-bold mb-2 font-display">
                <ScrambleText text={item.credential} />
              </h3>
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
                {item.pillLinks.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.pillLinks.map((link) => (
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
            </article>
          ))}
        </div>

        <div
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 mb-12 overflow-x-auto"
          role="region"
          aria-label="Nursing program prerequisite coursework table"
          tabIndex={0}
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="text-2xl font-bold text-foreground font-display">Nursing Program Prerequisite Coursework</h3>
            <p className="text-sm font-medium text-cyan-200/80 flex-shrink-0" aria-hidden="true">
              {prerequisiteProgress.completed}/{prerequisiteProgress.total} complete
            </p>
          </div>

          <div
            className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white/5"
            role="progressbar"
            aria-valuenow={prerequisiteProgress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Nursing prerequisite coursework: ${prerequisiteProgress.completed} of ${prerequisiteProgress.total} courses complete`}
          >
            {/* Static fill (no framer entrance): the width is the real value,
                rendered server-side. */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
              style={{ width: `${prerequisiteProgress.percent}%` }}
            />
          </div>

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
              <div
                key={`${course.requirement}-${course.course}`}
                data-testid={`prereq-row-${index}`}
                data-status={course.status}
                className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 p-4 md:grid md:grid-cols-12 md:items-center md:gap-3 md:rounded-none md:border-0 md:border-b md:border-white/5 md:bg-none md:from-transparent md:to-transparent md:p-3 md:last:border-b-0"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/80 md:col-span-3 md:normal-case md:tracking-normal md:text-sm md:font-medium md:text-foreground">
                  {course.requirement}
                </p>
                <p className="mt-1 text-sm text-foreground font-medium leading-relaxed md:col-span-5 md:mt-0 md:font-normal md:text-muted-foreground">
                  {course.url ? (
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-sm underline decoration-cyan-400/40 underline-offset-2 transition-colors hover:text-cyan-200 hover:decoration-cyan-300/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                    >
                      {course.course}
                    </a>
                  ) : (
                    course.course
                  )}
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
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-foreground mb-4 font-display">Honors & Affiliations</h3>
          <div className="flex flex-wrap gap-3">
            {sortedHonorsAndAffiliations.map((honor, index) => {
              const pillClass = "px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-100 text-sm";
              return honor.url ? (
                <a
                  key={honor.label}
                  data-testid={`honor-pill-${index}`}
                  href={honor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${pillClass} hover:border-cyan-300/40 hover:bg-cyan-500/15 hover:text-cyan-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background`}
                >
                  {honor.label}
                </a>
              ) : (
                <span key={honor.label} data-testid={`honor-pill-${index}`} className={pillClass}>
                  {honor.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
