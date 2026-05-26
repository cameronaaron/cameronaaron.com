'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState } from 'react';
import type { Project } from '@/data/projects';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { useInteractionMode } from '@/hooks/useInteractionMode';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function calculateCardTiltTargets(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number
) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const percentX = (clientX - centerX) / (rect.width / 2);
  const percentY = (clientY - centerY) / (rect.height / 2);

  return {
    x: 0.5 + percentX * 0.5,
    y: 0.5 + percentY * 0.5,
  };
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();
  const readingMinutes = Math.max(2, Math.ceil(project.description.length / 130));
  
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  
  const rotateX = useTransform(y, [0, 1], [8, -8]);
  const rotateY = useTransform(x, [0, 1], [-8, 8]);
  
  const springRotateX = useSpring(rotateX, { stiffness: 400, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 400, damping: 30 });

  /* v8 ignore next 10 */
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!enableHoverMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const target = calculateCardTiltTargets(rect, e.clientX, e.clientY);

    x.set(target.x);
    y.set(target.y);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    if (!enableHoverMotion) return;
    setIsHovering(true);
  };

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
    >
      {/* Animated gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        initial={false}
      />
      
      {/* Glow effect on hover */}
      <motion.div
        className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"
        initial={false}
      />

      <div className="absolute right-4 top-4 z-20 flex translate-y-2 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/90 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-cyan-300"
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.5, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        Deep dive {readingMinutes}m
      </div>
      
      <div className="relative z-10">
        <motion.h3 
          className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors"
          whileHover={enableHoverMotion ? { x: 5 } : undefined}
          transition={{ duration: 0.2 }}
        >
          {project.title}
        </motion.h3>
        <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed flex-grow">
          {project.description}
        </p>
        <p className="text-cyan-300 text-sm font-medium mb-4">{project.period}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.slice(0, 3).map((tag, tagIndex) => (
            <motion.span
              key={tagIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + tagIndex * 0.05 }}
              whileHover={enableHoverMotion ? { scale: 1.15, y: -3 } : undefined}
              className="px-3 py-1 bg-white/5 text-muted-foreground/80 rounded-lg text-xs font-medium border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-colors"
            >
              {tag}
            </motion.span>
          ))}
        </div>
        <motion.div
          className="mb-5 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/90"
          initial={{ opacity: 0.55 }}
          whileHover={enableHoverMotion ? { opacity: 1 } : undefined}
        >
          <span className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1">{project.tags.length} tags</span>
        </motion.div>
        <motion.div 
          className="flex items-center text-primary font-medium text-sm group-hover:translate-x-2 transition-transform mt-auto"
          whileHover={enableHoverMotion ? { x: 8 } : undefined}
          transition={{ duration: 0.2 }}
        >
          {/* v8 ignore next */}
          {project.cta ?? 'Read More'}
          <motion.svg 
            className="w-4 h-4 ml-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            animate={prefersReducedMotion ? undefined : { x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </motion.svg>
        </motion.div>
      </div>
    </SpotlightCard>
  );
}
