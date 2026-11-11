'use client';

import { m } from 'framer-motion';
import { useMemo } from 'react';
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

  return (
    <section id="projects" className="py-20 md:py-28 relative" aria-labelledby="projects-heading">
      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          headingId="projects-heading"
          title="Research & Publications"
          subtitle="Read the work. Play with the ideas. Follow your curiosity."
        />

        <div className="mb-12">
          <div
            className="flex flex-wrap items-center gap-2"
          >
            {researchSignals.map((signal, index) => (
              <span
                key={`${signal}-${index}`}
                className="inline-flex items-center rounded-full border border-foreground/12 bg-surface px-3 py-1 text-xs font-medium text-muted-foreground"
              >
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
                hidden: { opacity: 0, y: 16 },
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
          <h3 className="research-playground-title font-display text-3xl md:text-5xl font-medium text-foreground">Play the research</h3>
          {playableProjects.map((project, index) => (
            <div
              key={project.title}
              data-testid={`playable-project-${index}`}
              className="rounded-2xl border border-foreground/10 bg-surface p-5 md:p-6"
            >
              <ProjectCard project={project} index={index} />
              <ProjectDemoDisclosure demo={project.interactiveDemo!} projectTitle={project.title} />
            </div>
          ))}
        </div>

        <m.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
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
                hidden: { opacity: 0, y: 16, scale: 1 },
                visible: { opacity: 1, y: 0, scale: 1 }
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <ProjectCard project={project} index={index} />
            </m.div>
          ))}
        </m.div>

      </div>
    </section>
  );
}
