'use client';

import { motion } from 'framer-motion';
import SectionHeader from '@/components/ui/SectionHeader';
import { educationItems, prerequisiteCourses, honorsAndAffiliations } from '@/data/education';

export default function Education() {
  return (
    <section id="education" className="py-20 bg-background relative overflow-hidden" aria-labelledby="education-heading">
      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          title="Education & Nursing Prerequisites"
          subtitle="Graduate training, interdisciplinary scholarship, and prerequisite readiness for nursing pathways"
          className="[&>h2]:font-display"
        />

        <div className="grid lg:grid-cols-3 gap-6 mb-14">
          {educationItems.map((item, index) => (
            <motion.article
              key={`${item.institution}-${item.credential}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 h-full"
            >
              <p className="text-cyan-300 text-sm mb-3">{item.period}</p>
              <h3 className="text-foreground text-xl font-bold mb-2 font-display">{item.credential}</h3>
              <p className="text-muted-foreground mb-4">{item.institution}</p>
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

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 mb-12 overflow-x-auto">
          <h3 className="text-2xl font-bold text-foreground mb-5 font-display">Nursing Program Prerequisite Coursework</h3>
          <div className="min-w-[920px]">
            <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
              <p className="col-span-3">Requirement</p>
              <p className="col-span-5">Relevant Course</p>
              <p className="col-span-1">Units</p>
              <p className="col-span-1">Grade</p>
              <p className="col-span-2">Status</p>
            </div>
            {prerequisiteCourses.map((course) => (
              <div
                key={`${course.requirement}-${course.course}`}
                className="grid grid-cols-12 gap-3 px-3 py-3 border-b border-white/5 last:border-b-0"
              >
                <p className="col-span-3 text-foreground text-sm font-medium">{course.requirement}</p>
                <p className="col-span-5 text-muted-foreground text-sm">{course.course}</p>
                <p className="col-span-1 text-muted-foreground text-sm">{course.units}</p>
                <p className="col-span-1 text-muted-foreground text-sm">{course.grade}</p>
                <p className="col-span-2 text-sm text-cyan-300">{course.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-foreground mb-4 font-display">Honors & Affiliations</h3>
          <div className="flex flex-wrap gap-3">
            {honorsAndAffiliations.map((honor, index) => (
              <motion.span
                key={honor}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-100 text-sm"
              >
                {honor}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
