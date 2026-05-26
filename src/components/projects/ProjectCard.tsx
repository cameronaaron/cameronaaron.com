'use client';

import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Project } from '@/data/projects';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { useInteractionMode } from '@/hooks/useInteractionMode';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [relevanceDisplay, setRelevanceDisplay] = useState(0);
  const [signalDisplay, setSignalDisplay] = useState(0);
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();
  const readingMinutes = Math.max(2, Math.ceil(project.description.length / 130));
  const impactScore = 82 + ((index * 7) % 17);
  const signalScore = 68 + Math.min(28, project.tags.length * 6 + (index % 4) * 3);
  
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  
  const rotateX = useTransform(y, [0, 1], [8, -8]);
  const rotateY = useTransform(x, [0, 1], [-8, 8]);
  
  const springRotateX = useSpring(rotateX, { stiffness: 400, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 400, damping: 30 });
  const relevanceCounter = useMotionValue(0);
  const signalCounter = useMotionValue(0);
  const relevanceSpring = useSpring(relevanceCounter, { stiffness: 130, damping: 28, mass: 0.55 });
  const signalSpring = useSpring(signalCounter, { stiffness: 130, damping: 28, mass: 0.55 });

  useMotionValueEvent(relevanceSpring, 'change', (value) => {
    setRelevanceDisplay(Math.round(value));
  });

  useMotionValueEvent(signalSpring, 'change', (value) => {
    setSignalDisplay(Math.round(value));
  });

  useEffect(() => {
    relevanceCounter.set(0);
    signalCounter.set(0);
  }, [relevanceCounter, signalCounter]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!enableHoverMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const percentX = (e.clientX - centerX) / (rect.width / 2);
    const percentY = (e.clientY - centerY) / (rect.height / 2);
    
    x.set(0.5 + percentX * 0.5);
    y.set(0.5 + percentY * 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
    setIsHovering(false);

    if (!prefersReducedMotion) {
      relevanceCounter.set(0);
      signalCounter.set(0);
    }
  };

  const handleMouseEnter = () => {
    if (!enableHoverMotion) return;

    setIsHovering(true);

    if (prefersReducedMotion) {
      setRelevanceDisplay(impactScore);
      setSignalDisplay(signalScore);
      return;
    }

    relevanceCounter.set(impactScore);
    signalCounter.set(signalScore);
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

      <div className="absolute inset-x-4 bottom-4 z-20 translate-y-8 rounded-xl border border-white/15 bg-black/50 p-3 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Live Insight Feed</span>
          <span className="text-cyan-300">{relevanceDisplay}% relevance</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-foreground/90">
          <span>{readingMinutes} min deep dive</span>
          <span>{signalDisplay}% signal match</span>
        </div>
        <div className="mt-3 space-y-1.5">
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground/90">
              <span>Relevance</span>
              <span>{relevanceDisplay}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-primary"
                style={{ transformOrigin: 'left' }}
                animate={{ scaleX: relevanceDisplay / 100 }}
                transition={{ type: 'spring', stiffness: 140, damping: 30, mass: 0.7 }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground/90">
              <span>Signal</span>
              <span>{signalDisplay}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-secondary"
                style={{ transformOrigin: 'left' }}
                animate={{ scaleX: signalDisplay / 100 }}
                transition={{ type: 'spring', stiffness: 140, damping: 30, mass: 0.7 }}
              />
            </div>
          </div>
        </div>
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
          className="flex items-center text-primary font-medium text-sm group-hover:translate-x-2 transition-transform mt-auto"
          whileHover={enableHoverMotion ? { x: 8 } : undefined}
          transition={{ duration: 0.2 }}
        >
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
