import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import FAQ from './FAQ';
import Testimonials from './Testimonials';
import ExperienceCard from './experience/ExperienceCard';
import FeaturedProject from './projects/FeaturedProject';
import ProjectCard from './projects/ProjectCard';
import Button from './ui/Button';
import Card from './ui/Card';
import Magnetic from './ui/Magnetic';
import ParallaxSection from './ui/ParallaxSection';
import SmoothScroll from './ui/SmoothScroll';
import Tilt from './ui/Tilt';
import TypewriterEffect from './ui/TypewriterEffect';

import { experiences } from '@/data/experience';
import { projects } from '@/data/projects';

afterEach(() => {
  vi.useRealTimers();
});

describe('branch coverage targets', () => {
  it('toggles FAQ interactive branches and renders testimonials actions', () => {
    render(<Testimonials />);
    expect(screen.queryByRole('button', { name: /view all/i })).toBeNull();
    expect(screen.getByRole('button', { name: /show previous testimonial/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /show next testimonial/i })).toBeTruthy();

    const { container } = render(<FAQ />);
    fireEvent.click(screen.getByText("What's your background?"));
    expect(container.querySelectorAll('[itemprop="acceptedAnswer"]').length).toBe(1);
  });

  it('exercises button and card style/interaction branches', () => {
    const onClick = vi.fn();

    const { container } = render(
      <>
        <Button onClick={onClick} variant="primary">Primary</Button>
        <Button href="#go" variant="secondary">Secondary Link</Button>
        <Button variant="outline">Outline</Button>
        <Card hover={false} gradient={false}>Plain Card</Card>
      </>
    );

    const primary = screen.getByRole('button', { name: 'Primary' });
    fireEvent.mouseMove(primary, { clientX: 80, clientY: 40 });
    fireEvent.mouseLeave(primary);
    fireEvent.click(primary);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Secondary Link' })).toBeTruthy();
    expect(container.textContent).toContain('Plain Card');
  });

  it('covers experience/project hover and icon branches', () => {
    render(
      <>
        <ExperienceCard experience={experiences[0]} index={0} />
        <FeaturedProject project={projects[0]} index={1} />
        <FeaturedProject project={projects[0]} index={2} />
        <ProjectCard project={projects[0]} index={0} />
      </>
    );

    const companyImage = screen.getByAltText(experiences[0].company);
    fireEvent.error(companyImage);

    const projectLinks = screen.getAllByRole('link');
    const projectCardLink = projectLinks.find((node) => node.getAttribute('href') === projects[0].link);
    expect(projectCardLink).toBeTruthy();

    if (projectCardLink) {
      fireEvent.mouseEnter(projectCardLink);
      fireEvent.mouseMove(projectCardLink, { clientX: 120, clientY: 80 });
      fireEvent.mouseLeave(projectCardLink);
    }

    expect(screen.getByText(experiences[0].company.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase())).toBeTruthy();
  });

  it('drives UI utility motion handlers', () => {
    render(
      <>
        <Magnetic><button type="button">Magnet</button></Magnetic>
        <ParallaxSection direction="down"><div>Parallax Down</div></ParallaxSection>
        <Tilt><button type="button">Tilt Target</button></Tilt>
      </>
    );

    const magnet = screen.getByRole('button', { name: 'Magnet' });
    fireEvent.mouseMove(magnet, { clientX: 50, clientY: 50 });
    fireEvent.mouseLeave(magnet);

    const tilt = screen.getByRole('button', { name: 'Tilt Target' });
    fireEvent.mouseMove(tilt, { clientX: 90, clientY: 60 });
    fireEvent.mouseLeave(tilt);

    expect(screen.getByText('Parallax Down')).toBeTruthy();
  });

  it('runs typewriter completion and smooth scroll RAF path', () => {
    vi.useFakeTimers();
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const smooth = render(<SmoothScroll />);
    expect(rafSpy).toHaveBeenCalled();

    const firstRaf = rafSpy.mock.calls[0]?.[0];
    if (firstRaf) {
      act(() => {
        firstRaf(16);
      });
    }

    smooth.unmount();

    render(<TypewriterEffect text="Done" typingSpeed={1} />);
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(screen.getByText('Done')).toBeTruthy();
    rafSpy.mockRestore();
  });
});
