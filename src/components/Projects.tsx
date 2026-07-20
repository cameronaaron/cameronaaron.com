'use client';

import { m, useScroll, useSpring, useTransform } from 'framer-motion';
import { useMemo, useRef, type CSSProperties } from 'react';
import { projects } from '@/data/projects';
import SectionHeader from '@/components/ui/SectionHeader';
import FeaturedProject from '@/components/projects/FeaturedProject';
import ProjectCard from '@/components/projects/ProjectCard';
import dynamic from 'next/dynamic';
import { buildProjectCollections } from '@/components/projects/projects-logic';

// Code-split (2026-07-19, measured — see ENGINEERING-STANDARDS §4.7 item 8):
// the games are interactive-only widgets deep below the fold, already gated
// on useInView; their code has no business in the initial bundle that every
// visitor parses on a 4x-throttled phone CPU. ssr:false is safe here because
// nothing inside them is indexable content — the surrounding project cards
// (which ARE content) stay statically rendered.
const DnaSnpGame = dynamic(() => import('@/components/projects/dna-game/DnaSnpGame'), { ssr: false });
const ReactionTimeGame = dynamic(() => import('@/components/projects/reaction-game/ReactionTimeGame'), { ssr: false });
const PredatorPreyChase = dynamic(() => import('@/components/projects/predator-prey/PredatorPreyChase'), { ssr: false });

export default function Projects() {
  const { featuredProjects, otherProjects, researchSignals } = useMemo(
    () => buildProjectCollections(projects),
    [],
  );
  // otherProjects renders as a multi-column grid tile, too narrow for a full
  // simulation widget — its paired demo (if any) renders full-width below the
  // whole grid instead, same idea as the featured section's inline demos.
  const otherProjectWithDemo = otherProjects.find((project) => project.interactiveDemo === 'predator-prey-chase');
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const backgroundY2 = useTransform(scrollYProgress, [0, 1], [100, -50]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const chapterProgress = useSpring(scrollYProgress, { stiffness: 150, damping: 28, mass: 0.35 });

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
        <div className="mb-10 hidden lg:block">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span>Research Storyline</span>
              <span>Scroll-driven chapter</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <m.div
                className="h-full bg-gradient-to-r from-cyan-400 via-primary to-secondary"
                style={{ scaleX: chapterProgress, transformOrigin: 'left' }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-muted-foreground/90">
              <span>Featured Work</span>
              <span>Publications</span>
              <span>Deep Dives</span>
            </div>
          </div>
        </div>

        <SectionHeader
          headingId="projects-heading"
          index="04"
          title="Research & Publications"
          subtitle="Selected publications, conference presentations, and research projects"
          className="[&>h2]:font-display"
        />

        <div className="mb-12 overflow-hidden rounded-2xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
          <div
            className="marquee-track flex w-max items-center gap-2"
            style={{ '--marquee-duration': '22s' } as CSSProperties}
          >
            {[...researchSignals, ...researchSignals].map((signal, index) => (
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
              {project.interactiveDemo === 'dna-snp-game' && <DnaSnpGame />}
              {project.interactiveDemo === 'reaction-time-game' && <ReactionTimeGame />}
            </m.div>
          ))}
        </m.div>

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

        {otherProjectWithDemo ? (
          <div className="max-w-6xl mx-auto">
            <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Try it — paired with &ldquo;{otherProjectWithDemo.title}&rdquo;
            </p>
            <PredatorPreyChase />
          </div>
        ) : null}
      </div>
    </section>
  );
}
