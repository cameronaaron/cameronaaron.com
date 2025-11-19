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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group block h-full p-8"
    >
      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
        {project.title}
      </h3>
      <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed flex-grow">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {project.tags.slice(0, 3).map((tag, tagIndex) => (
          <span
            key={tagIndex}
            className="px-3 py-1 bg-white/5 text-muted-foreground/80 rounded-lg text-xs font-medium border border-white/10"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center text-primary font-medium text-sm group-hover:translate-x-2 transition-transform mt-auto">
        View Project
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </SpotlightCard>
  );
}
