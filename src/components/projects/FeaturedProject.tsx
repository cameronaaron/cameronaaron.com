'use client';

import { motion } from 'framer-motion';
import type { Project } from '@/data/projects';

interface FeaturedProjectProps {
  project: Project;
}

export default function FeaturedProject({ project }: FeaturedProjectProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-5xl mx-auto mb-12"
    >
      <a
        href={project.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-white hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-4">
              ⭐ Featured
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">{project.title}</h3>
            <p className="text-purple-100 text-lg leading-relaxed mb-6">{project.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </a>
    </motion.div>
  );
}
