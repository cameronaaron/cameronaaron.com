'use client';

import { projects } from '@/data/projects';
import SectionHeader from '@/components/ui/SectionHeader';
import FeaturedProject from '@/components/projects/FeaturedProject';
import ProjectCard from '@/components/projects/ProjectCard';

export default function Projects() {
  const featuredProjects = projects.filter(p => p.featured);
  const otherProjects = projects.filter(p => !p.featured);

  return (
    <section id="projects" className="py-20 bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="container mx-auto px-6">
        <SectionHeader
          title="Featured Projects"
          subtitle="Innovative solutions leveraging AI, web development, and scientific research"
        />

        {/* Featured Projects */}
        {featuredProjects.map((project, index) => (
          <FeaturedProject key={index} project={project} />
        ))}

        {/* Other Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {otherProjects.map((project, index) => (
            <ProjectCard key={index} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
