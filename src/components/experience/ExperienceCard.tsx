'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Experience } from '@/data/experience';
import SpotlightCard from '@/components/ui/SpotlightCard';

interface ExperienceCardProps {
  experience: Experience;
  index: number;
}

export default function ExperienceCard({ experience, index }: ExperienceCardProps) {
  return (
    <SpotlightCard
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="p-8 h-full"
    >
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-md">
            <Image
              src={experience.logo}
              alt={experience.company}
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-bold text-foreground mb-4">{experience.company}</h3>
          
          <div className="space-y-4">
            {experience.positions.map((pos, posIndex) => (
              <div key={posIndex} className="border-l-2 border-primary/30 pl-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <h4 className="text-lg font-semibold text-primary">{pos.title}</h4>
                  <span className="text-sm text-muted-foreground font-medium">{pos.period}</span>
                </div>
                <p className="text-muted-foreground/80 leading-relaxed">{pos.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
