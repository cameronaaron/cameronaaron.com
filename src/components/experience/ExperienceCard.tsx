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
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(124, 58, 237, 0.2)",
        transition: { duration: 0.3 }
      }}
      className="p-8 h-full relative overflow-hidden group"
    >
      {/* Animated background on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={false}
      />
      <div className="flex items-start gap-6 relative z-10">
        <motion.div 
          className="flex-shrink-0"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-md group-hover:shadow-xl transition-shadow">
            <Image
              src={experience.logo}
              alt={experience.company}
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>

        <div className="flex-1">
          <motion.h3 
            className="text-2xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {experience.company}
          </motion.h3>
          
          <div className="space-y-4">
            {experience.positions.map((pos, posIndex) => (
              <motion.div 
                key={posIndex} 
                className="border-l-2 border-primary/30 pl-4 hover:border-primary/60 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + posIndex * 0.1 }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <h4 className="text-lg font-semibold text-primary">{pos.title}</h4>
                  <span className="text-sm text-muted-foreground font-medium">{pos.period}</span>
                </div>
                <p className="text-muted-foreground/80 leading-relaxed">{pos.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}

