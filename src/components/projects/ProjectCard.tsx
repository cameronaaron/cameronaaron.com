'use client';

import { motion } from 'framer-motion';
import type { Project } from '@/data/projects';
import SpotlightCard from '@/components/ui/SpotlightCard';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <SpotlightCard
      as={motion.a}
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="group block h-full p-8 relative overflow-hidden"
    >
      {/* Animated gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        initial={false}
      />
      <div className="relative z-10">
        <motion.h3 
          className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors"
          whileHover={{ x: 5 }}
          transition={{ duration: 0.2 }}
        >
          {project.title}
        </motion.h3>
        <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed flex-grow">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.slice(0, 3).map((tag, tagIndex) => (
            <motion.span
              key={tagIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + tagIndex * 0.05 }}
              whileHover={{ scale: 1.1, y: -2 }}
              className="px-3 py-1 bg-white/5 text-muted-foreground/80 rounded-lg text-xs font-medium border border-white/10 hover:border-primary/30 transition-colors"
            >
              {tag}
            </motion.span>
          ))}
        </div>
        <motion.div 
          className="flex items-center text-primary font-medium text-sm group-hover:translate-x-2 transition-transform mt-auto"
          whileHover={{ x: 8 }}
          transition={{ duration: 0.2 }}
        >
          View Project
          <motion.svg 
            className="w-4 h-4 ml-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </motion.svg>
        </motion.div>
      </div>
    </SpotlightCard>
  );
}
