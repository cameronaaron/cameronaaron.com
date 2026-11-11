'use client';

import { m } from 'framer-motion';
import type { Project } from '@/data/projects';
import FeaturedIcon from '@/components/projects/FeaturedIcon';
import ProjectPattern from '@/components/projects/ProjectPattern';
import Button from '@/components/ui/Button';
import {
  getFeaturedIconVariant,
  getFeaturedProjectCta,
  getFeaturedProjectLeadToken,
} from '@/components/projects/featured-logic';

interface FeaturedProjectProps {
  project: Project;
  index?: number;
}

export default function FeaturedProject({ project, index = 0 }: FeaturedProjectProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="max-w-6xl mx-auto mb-24"
    >
        <div className="group relative grid grid-cols-1 md:grid-cols-2 bg-surface border border-foreground/10 rounded-3xl overflow-hidden">
          {/* Content Side */}
          <div className="p-8 md:p-12 flex flex-col justify-center relative z-10">
            <div className="mb-6">
              <p className="mb-5 text-sm font-semibold text-primary">Featured publication</p>
              
              <h3 className="font-display text-3xl md:text-[2.75rem] md:leading-[1.08] font-medium mb-4 text-foreground">
                {project.title}
              </h3>

              <p className="font-data text-muted-foreground text-sm font-medium mb-4">{project.period}</p>
              
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {project.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-3 py-1 rounded-full text-sm text-muted-foreground border border-foreground/12"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {project.link ? (
                <Button
                  href={project.link}
                  variant="primary"
                  className="w-fit"
                >
                  {getFeaturedProjectCta(project.cta)}
                </Button>
              ) : null}
            </div>
          </div>

          {/* Visual Side */}
          <div className="relative min-h-[300px] md:min-h-full bg-muted overflow-hidden flex items-center justify-center p-8">
            <ProjectPattern index={index} />
            
            <div className="relative z-10 w-full max-w-xs aspect-square rounded-2xl bg-surface border border-foreground/10 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="mb-4 flex justify-center filter">
                  <FeaturedIcon variant={getFeaturedIconVariant(index)} />
                </div>
                <div className="font-display text-3xl font-medium text-foreground">
                  {getFeaturedProjectLeadToken(project.title)}
                </div>
              </div>
            </div>
          </div>

        </div>
    </m.div>
  );
}
