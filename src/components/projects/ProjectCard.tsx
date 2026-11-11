'use client';

import { m } from 'framer-motion';
import { useMemo } from 'react';
import type { Project } from '@/data/projects';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import {
  getProjectCardCta,
  getProjectCardLinkProps,
  getProjectReadingMinutes,
  getProjectTopTags,
} from '@/components/projects/card-logic';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();
  // Derived values are memoized so a parent re-render does zero recomputation.
  const readingMinutes = useMemo(() => getProjectReadingMinutes(project.description), [project.description]);
  const topTags = useMemo(() => getProjectTopTags(project.tags), [project.tags]);
  const linkProps = useMemo(() => getProjectCardLinkProps(project.link), [project.link]);
  const isLinked = linkProps.href !== undefined;

  return (
    <SpotlightCard
      as={isLinked ? m.a : m.article}
      {...linkProps}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      whileHover={enableHoverMotion ? { y: -3, transition: { duration: 0.2, ease: "easeOut" } } : undefined}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99, y: 1 }}
      className="group block h-full p-7 relative overflow-hidden"
      data-testid={`project-card-${index}`}
      data-period={project.period}
    >
      <p className="font-data relative z-20 mb-4 text-xs font-medium text-muted-foreground">
        Deep dive {readingMinutes}m
      </p>

      <div className="relative z-10">
        <h3 className="font-display text-2xl leading-tight font-medium text-foreground mb-3">
          {project.title}
        </h3>
        <p className="text-muted-foreground mb-5 line-clamp-3 leading-relaxed flex-grow">
          {project.description}
        </p>
        <p className="font-data text-muted-foreground text-sm mb-4">{project.period}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {topTags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="px-2.5 py-1 text-muted-foreground rounded-full text-xs border border-foreground/12"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center text-primary font-semibold text-sm mt-auto">
          {getProjectCardCta(project.cta)}
          {isLinked ? (
            <svg
              className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth={2} />
              <path strokeLinecap="round" strokeWidth={2} d="M8 11V7a4 4 0 018 0v4" />
            </svg>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}
