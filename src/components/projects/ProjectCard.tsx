'use client';

import { m } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { Project } from '@/data/projects';
import ScrambleText from '@/components/ui/ScrambleText';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { use3DTilt } from '@/hooks/use3DTilt';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import { getProjectCardCta, getProjectReadingMinutes, getProjectTopTags } from '@/components/projects/card-logic';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();
  // This card re-renders on every hover enter/leave (isHovering) — derived
  // values are memoized so hover events do zero recomputation.
  const readingMinutes = useMemo(() => getProjectReadingMinutes(project.description), [project.description]);
  const topTags = useMemo(() => getProjectTopTags(project.tags), [project.tags]);

  const { handleMouseMove: tiltMouseMove, handleMouseLeave: tiltMouseLeave, rotateX: springRotateX, rotateY: springRotateY } =
    use3DTilt({ maxRotation: 8 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!enableHoverMotion) return;
    tiltMouseMove(e);
  };

  const handleMouseLeave = () => {
    tiltMouseLeave();
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    if (!enableHoverMotion) return;
    setIsHovering(true);
  };

  return (
    <SpotlightCard
      as={m.a}
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      whileHover={
        enableHoverMotion
          ? {
              y: -12,
              scale: 1.03,
              transition: { duration: 0.38, ease: "easeOut" }
            }
          : undefined
      }
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99, y: 1 }}
      style={{
        rotateX: isHovering && enableHoverMotion ? springRotateX : 0,
        rotateY: isHovering && enableHoverMotion ? springRotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className="group block h-full p-8 relative overflow-hidden"
      data-testid={`project-card-${index}`}
      data-period={project.period}
    >
      {/* Animated gradient overlay on hover */}
      <m.div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        initial={false}
      />
      
      {/* Glow effect on hover */}
      <m.div
        className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"
        initial={false}
      />

      <div className="relative z-20 mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200/90">
        <span className="dot-ping-anim h-1.5 w-1.5 rounded-full bg-cyan-300" />
        Deep dive {readingMinutes}m
      </div>
      
      <div className="relative z-10">
        <m.h3 
          className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors"
          whileHover={enableHoverMotion ? { x: 5 } : undefined}
          transition={{ duration: 0.2 }}
        >
          <ScrambleText text={project.title} />
        </m.h3>
        <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed flex-grow">
          {project.description}
        </p>
        <p className="text-cyan-300 text-sm font-medium mb-4">{project.period}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {topTags.map((tag, tagIndex) => (
            <m.span
              key={tagIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + tagIndex * 0.05 }}
              whileHover={enableHoverMotion ? { scale: 1.15, y: -3 } : undefined}
              className="px-3 py-1 bg-white/5 text-muted-foreground/80 rounded-lg text-xs font-medium border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-colors"
            >
              {tag}
            </m.span>
          ))}
        </div>
        <m.div
          className="mb-5 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/90"
          initial={{ opacity: 0.55 }}
          whileHover={enableHoverMotion ? { opacity: 1 } : undefined}
        >
          <span className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1">{project.tags.length} tags</span>
        </m.div>
        <m.div 
          className="flex items-center text-primary font-medium text-sm group-hover:translate-x-2 transition-transform mt-auto"
          whileHover={enableHoverMotion ? { x: 8 } : undefined}
          transition={{ duration: 0.2 }}
        >
          {getProjectCardCta(project.cta)}
          <svg
            className="arrow-nudge-anim w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </m.div>
      </div>
    </SpotlightCard>
  );
}
