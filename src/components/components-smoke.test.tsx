import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Certifications from './Certifications';
import Contact from './Contact';
import Education from './Education';
import Experience from './Experience';
import Hero from './Hero';
import Navigation from './Navigation';
import Projects from './Projects';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';
import Skills from './Skills';
import StructuredData from './StructuredData';
import Testimonials from './Testimonials';
import SocialLink from './contact/SocialLink';
import ExperienceCard from './experience/ExperienceCard';
import ProfileImage from './hero/ProfileImage';
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
    const { container } = render(
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

    expect(container.querySelector('#home')).toBeTruthy();
    expect(container.querySelector('#experience')).toBeTruthy();
    expect(container.querySelector('#education')).toBeTruthy();
    expect(container.querySelector('#contact')).toBeTruthy();

    // The hero is static HTML: its name is a real heading and its portrait is
    // in the first paint, with nothing hidden behind an entrance animation.
    expect(screen.getByRole('heading', { level: 1, name: profile.name })).toBeTruthy();
    expect(container.querySelector('#home img')?.getAttribute('alt')).toBe(profile.name);
  });

  it('renders structured data script', () => {
    const { container } = render(<StructuredData />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).toBeTruthy();
    expect(script?.textContent).toContain('"@graph"');
  });

  it('renders subcomponents with explicit props', () => {
    render(
      <>
        <SocialLink
          name="GitHub"
          platformKey="github"
          url="https://github.com/example"
          color="from-primary to-success"
        />
        <ExperienceCard experience={experiences[0]} index={0} />
        <FeaturedProject project={projects[0]} index={0} />
        <ProjectCard project={projects[0]} index={0} />
        <ProjectPattern index={1} />
        <TestimonialCard testimonial={testimonials[0]} index={0} />
        <ProfileImage src={profile.image} alt={profile.name} />
      </>
    );

    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.getByText(experiences[0].company)).toBeTruthy();
    expect(screen.getAllByText(projects[0].title).length).toBeGreaterThan(0);
    expect(screen.getByText(testimonials[0].name)).toBeTruthy();
  });

  it('runs service worker registration component safely in test mode', () => {
    render(<ServiceWorkerRegistration />);
    expect(true).toBe(true);
  });
});
