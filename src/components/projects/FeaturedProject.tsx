'use client';

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import type { Project } from '@/data/projects';
import Tilt from '@/components/ui/Tilt';
import ProjectPattern from '@/components/projects/ProjectPattern';
import Button from '@/components/ui/Button';

interface FeaturedProjectProps {
  project: Project;
  index?: number;
}

function FeaturedIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" className="h-14 w-14 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 14.5 14.4 4.2c.6-.6 1.6-.5 2.1.2l3.3 4.4c.4.6.4 1.3-.2 1.8L9.2 20.8c-.4.4-1 .6-1.5.5l-3.9-1c-.8-.2-1.2-1-.9-1.8l1-3.5c.1-.4.3-.7.5-1Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m12 6 6 6" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" className="h-14 w-14 text-emerald-200" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5c-2.8 1.6-4 4.4-4 7 0 2.6 1.2 5.4 4 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5c2.8 1.6 4 4.4 4 7 0 2.6-1.2 5.4-4 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h8M8 16h8" />
        <circle cx="12" cy="8" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-14 w-14 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 8 4 12l4 4M16 8l4 4-4 4M14 5l-4 14" />
    </svg>
  );
}

export default function FeaturedProject({ project, index = 0 }: FeaturedProjectProps) {
  const hoverX = useMotionValue(50);
  const hoverY = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(460px circle at ${hoverX}% ${hoverY}%, rgba(34, 211, 238, 0.18), rgba(16, 185, 129, 0.1) 36%, transparent 72%)`;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100;

    hoverX.set(Math.max(0, Math.min(100, xPct)));
    hoverY.set(Math.max(0, Math.min(100, yPct)));
  };

  const handleMouseLeave = () => {
    hoverX.set(50);
    hoverY.set(50);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.2, duration: 0.8 }}
      className="max-w-6xl mx-auto mb-24"
    >
      <Tilt intensity={5} className="h-full">
        <div
          className="group relative grid md:grid-cols-2 gap-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-primary/30 transition-colors duration-500"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          data-cursor="interactive"
        >
          <motion.div className="pointer-events-none absolute inset-0" style={{ background: spotlight }} />
          
          {/* Content Side */}
          <div className="p-8 md:p-12 flex flex-col justify-center relative z-10">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Featured Publication
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-emerald-300 transition-all duration-300">
                {project.title}
              </h3>

              <p className="text-cyan-300 text-sm font-medium mb-4">{project.period}</p>
              
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {project.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-3 py-1 bg-white/5 rounded-md text-sm font-medium text-gray-300 border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Button 
                href={project.link} 
                variant="primary" 
                className="w-fit group-hover:shadow-[0_0_20px_rgba(34,211,238,0.45)] transition-shadow"
              >
                {project.cta ?? 'View Publication'}
              </Button>
            </div>
          </div>

          {/* Visual Side */}
          <div className="relative min-h-[300px] md:min-h-full bg-black/20 overflow-hidden flex items-center justify-center p-8">
            <ProjectPattern index={index} />
            
            {/* Floating 3D Element */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="relative z-10 w-full max-w-xs aspect-square glass-card rounded-2xl border border-white/10 flex items-center justify-center p-8 transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500"
            >
              <div className="text-center">
                <div className="mb-4 flex justify-center filter drop-shadow-[0_0_15px_rgba(103,232,249,0.25)]">
                  <FeaturedIcon index={index} />
                </div>
                <div className="text-2xl font-bold text-white/80 font-mono">
                  {project.title.split(' ')[0]}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </Tilt>
    </motion.div>
  );
}
