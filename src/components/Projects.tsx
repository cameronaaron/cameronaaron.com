'use client';

import { m, useScroll, useTransform } from 'framer-motion';
import { useMemo, useRef, type CSSProperties } from 'react';
import { projects } from '@/data/projects';
import SectionHeader from '@/components/ui/SectionHeader';
import FeaturedProject from '@/components/projects/FeaturedProject';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectDemoDisclosure from '@/components/projects/ProjectDemoDisclosure';
import { buildProjectCollections } from '@/components/projects/projects-logic';

export default function Projects() {
  const { featuredProjects, playableProjects, otherProjects, researchSignals } = useMemo(
    () => buildProjectCollections(projects),
    [],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const backgroundY2 = useTransform(scrollYProgress, [0, 1], [100, -50]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <section id="projects" className="py-20 bg-background relative overflow-hidden" ref={containerRef} aria-labelledby="projects-heading">
      <m.div 
        style={{ y: backgroundY, rotate }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" 
      />
      <m.div
        style={{ y: backgroundY2 }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"
      />
      {/* CSS spin (compositor) — was framer rAF that ran even though these are
          display:none on mobile (hidden lg:block); CSS animations don't tick on
          display:none, so this also stops the off-screen mobile waste. */}
      <div
        className="spin-anim pointer-events-none absolute -right-24 top-36 hidden h-64 w-64 rounded-full border border-cyan-300/20 lg:block"
        style={{ '--spin-duration': '18s' } as CSSProperties}
        aria-hidden="true"
      />
      <div
        className="spin-anim spin-anim-reverse pointer-events-none absolute -right-14 top-44 hidden h-44 w-44 rounded-full border border-emerald-300/20 lg:block"
        style={{ '--spin-duration': '13s' } as CSSProperties}
        aria-hidden="true"
      />

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          headingId="projects-heading"
          index="04"
          title="Research & Publications"
          subtitle="Read the work. Play with the ideas. Follow your curiosity."
          className="[&>h2]:font-display"
        />

        <div className="mb-12 overflow-hidden rounded-2xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
          <div
            className="flex flex-wrap items-center gap-2"
          >
            {researchSignals.map((signal, index) => (
              <span
                key={`${signal}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
                {signal}
              </span>
            ))}
          </div>
        </div>

        <m.div
          className="space-y-20 mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.3
              }
            }
          }}
        >
          {featuredProjects.map((project, index) => (
            <m.div
              key={project.title}
              data-testid={`featured-project-item-${index}`}
              data-period={project.period}
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <FeaturedProject project={project} index={index} />
              {project.interactiveDemo ? (
                <ProjectDemoDisclosure demo={project.interactiveDemo} projectTitle={project.title} defaultOpen />
              ) : null}
            </m.div>
          ))}
        </m.div>

        {/* Projects that ship a playable companion, each paired with its own
            game rather than pointing at one stacked further down the page. */}
        <div id="research-playground" className="research-playground mb-20 max-w-6xl mx-auto" data-testid="playable-projects">
          <h3 className="research-playground-title font-display text-3xl md:text-5xl font-semibold tracking-tight text-foreground">Play the research</h3>
          {playableProjects.map((project, index) => (
            <div
              key={project.title}
              data-testid={`playable-project-${index}`}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6"
            >
              <ProjectCard project={project} index={index} />
              <ProjectDemoDisclosure demo={project.interactiveDemo!} projectTitle={project.title} />
            </div>
          ))}
        </div>

        <m.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {otherProjects.map((project, index) => (
            <m.div
              key={project.title}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.9 },
                visible: { opacity: 1, y: 0, scale: 1 }
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
            >
              <ProjectCard project={project} index={index} />
            </m.div>
          ))}
        </m.div>

      </div>
    </section>
  );
}
