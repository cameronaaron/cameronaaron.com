'use client';

import { experiences } from '@/data/experience';
import SectionHeader from '@/components/ui/SectionHeader';
import ExperienceCard from '@/components/experience/ExperienceCard';

export default function Experience() {
  return (
    <section id="experience" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <SectionHeader
          title="Professional Experience"
          subtitle="Building innovative solutions at world-class companies"
        />

        <div className="max-w-4xl mx-auto space-y-8">
          {experiences.map((exp, index) => (
            <ExperienceCard key={index} experience={exp} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
