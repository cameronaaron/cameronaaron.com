import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Certifications from './Certifications';
import Contact from './Contact';
import Education from './Education';
import Experience from './Experience';
import FAQ from './FAQ';
import Hero from './Hero';
import Navigation from './Navigation';
import Projects from './Projects';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';
import Skills from './Skills';
import StructuredData from './StructuredData';
import Testimonials from './Testimonials';
import SocialLink from './contact/SocialLink';
import ExperienceCard from './experience/ExperienceCard';
import BackgroundParticles from './hero/BackgroundParticles';
import InteractiveParticles from './hero/InteractiveParticles';
import ProfileImage from './hero/ProfileImage';
import ScrollIndicator from './hero/ScrollIndicator';
import FeaturedProject from './projects/FeaturedProject';
import ProjectCard from './projects/ProjectCard';
import ProjectPattern from './projects/ProjectPattern';
import TestimonialCard from './testimonials/TestimonialCard';

import { experiences } from '@/data/experience';
import { profile } from '@/data/profile';
import { projects } from '@/data/projects';
import { testimonials } from '@/data/testimonials';

describe('component smoke coverage', () => {
  it('renders core section components', () => {
    render(
      <>
        <Navigation />
        <Hero />
        <Certifications />
        <Experience />
        <Education />
        <Projects />
        <Skills />
        <Testimonials />
        <Contact />
      </>
    );

    expect(screen.getByText('Research & Publications')).toBeTruthy();
    expect(screen.getByText('Clinical Certifications & Licenses')).toBeTruthy();
    expect(screen.getByText('Connect With Me')).toBeTruthy();
  });

  it('renders FAQ and toggles answer visibility', () => {
    render(<FAQ />);

    const firstQuestion = screen.getByText('Is this the official Cameron Aaron website?');
    fireEvent.click(firstQuestion);
    expect(screen.getByText(/official portfolio and resume website/i)).toBeTruthy();
  });

  it('renders structured data script', () => {
    const { container } = render(<StructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).toBeTruthy();
    expect(script?.textContent).toContain('"@graph"');
  });

  it('renders subcomponents with explicit props', () => {
    const mockProgress = {
      get: () => 1,
      set: vi.fn(),
      on: vi.fn(),
    };

    render(
      <>
        <SocialLink
          name="GitHub"
          platformKey="github"
          url="https://github.com/example"
          color="from-cyan-500 to-emerald-500"
          index={0}
          revealProgress={mockProgress as never}
        />
        <ExperienceCard experience={experiences[0]} index={0} />
        <FeaturedProject project={projects[0]} index={0} />
        <ProjectCard project={projects[0]} index={0} />
        <ProjectPattern index={1} />
        <TestimonialCard testimonial={testimonials[0]} index={0} />
        <ProfileImage src={profile.image} alt={profile.name} />
        <BackgroundParticles />
        <InteractiveParticles />
        <ScrollIndicator />
      </>
    );

    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.getByText(experiences[0].company)).toBeTruthy();
    expect(screen.getByText(projects[0].title)).toBeTruthy();
    expect(screen.getByText(testimonials[0].name)).toBeTruthy();
  });

  it('runs service worker registration component safely in test mode', () => {
    render(<ServiceWorkerRegistration />);
    expect(true).toBe(true);
  });
});
