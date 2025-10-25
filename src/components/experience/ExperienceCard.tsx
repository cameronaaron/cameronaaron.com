'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Experience } from '@/data/experience';

interface ExperienceCardProps {
  experience: Experience;
  index: number;
}

export default function ExperienceCard({ experience, index }: ExperienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 hover:shadow-xl transition-shadow duration-300 border border-purple-100">
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
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{experience.company}</h3>
            
            <div className="space-y-4">
              {experience.positions.map((pos, posIndex) => (
                <div key={posIndex} className="border-l-2 border-purple-300 pl-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                    <h4 className="text-lg font-semibold text-purple-700">{pos.title}</h4>
                    <span className="text-sm text-gray-500 font-medium">{pos.period}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{pos.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
