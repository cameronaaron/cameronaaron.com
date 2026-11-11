import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Testimonials from './Testimonials';
import ExperienceCard from './experience/ExperienceCard';
import FeaturedProject from './projects/FeaturedProject';
import ProjectCard from './projects/ProjectCard';
import Button from './ui/Button';
import Magnetic from './ui/Magnetic';
import SmoothScroll from './ui/SmoothScroll';
import Tilt from './ui/Tilt';
import TypewriterEffect from './ui/TypewriterEffect';

import { experiences } from '@/data/experience';
import { projects } from '@/data/projects';

// The featured capstone: a linked project. Not `projects[0]` — the data is
// ordered newest-first, and the newest work can be a private repository.
const capstoneProject = projects.find((project) => project.link?.includes('/capstone'))!;

afterEach(() => {
  vi.useRealTimers();
});

describe('branch coverage targets', () => {
  it('renders testimonials cycle actions', () => {
    render(<Testimonials />);
    expect(screen.queryByRole('button', { name: /view all/i })).toBeNull();

    const prevBtn = screen.queryByRole('button', { name: /show previous testimonial/i });
    const nextBtn = screen.queryByRole('button', { name: /show next testimonial/i });
    expect(prevBtn).toBeTruthy();
    expect(nextBtn).toBeTruthy();
    // Click both cycle buttons to cover the inline onClick functions (lines 62, 72)
    if (prevBtn) fireEvent.click(prevBtn);
    if (nextBtn) fireEvent.click(nextBtn);
  });

  it('exercises button style/interaction branches', () => {
    const onClick = vi.fn();

    render(
      <>
        <Button onClick={onClick} variant="primary">Primary</Button>
        <Button href="#go" variant="secondary">Secondary Link</Button>
        <Button variant="outline">Outline</Button>
      </>
    );

    const primary = screen.getByRole('button', { name: 'Primary' });
    fireEvent.mouseMove(primary, { clientX: 80, clientY: 40 });
    fireEvent.mouseLeave(primary);
    fireEvent.click(primary);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Secondary Link' })).toBeTruthy();
  });

  it('covers experience/project hover and icon branches', () => {
    // The logo-error branch needs a company that has a logo; some don't.
    const withLogo = experiences.find((experience) => experience.logo)!;
    // Render with websiteUrl to cover true branch, and without to cover false branch
    const expWithoutUrl = { ...withLogo, websiteUrl: undefined };
    render(
      <>
        <ExperienceCard experience={withLogo} index={0} />
        <ExperienceCard experience={expWithoutUrl} index={1} />
        <FeaturedProject project={capstoneProject} index={1} />
        <FeaturedProject project={capstoneProject} index={2} />
        <ProjectCard project={capstoneProject} index={0} />
      </>
    );

    // Fire mouseEnter on card to cover the onMouseEnter inline function (line 68)
    const card = screen.getByTestId('experience-card-0');
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);

    const companyImages = screen.getAllByAltText(withLogo.company);
    fireEvent.error(companyImages[0]);

    const projectLinks = screen.getAllByRole('link');
    const projectCardLink = projectLinks.find((node) => node.getAttribute('href') === capstoneProject.link);
    expect(projectCardLink).toBeTruthy();

    if (projectCardLink) {
      fireEvent.mouseEnter(projectCardLink);
      fireEvent.mouseMove(projectCardLink, { clientX: 120, clientY: 80 });
      fireEvent.mouseLeave(projectCardLink);
    }

    expect(screen.getByText(withLogo.company.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase())).toBeTruthy();
  });

  it('renders no call-to-action for a featured project without a public link', () => {
    // A private repository has no link (repoVisibility.ts); its card must not
    // offer a button that goes nowhere. Real data stopped reaching this branch
    // once the Homestead and Room Remembers You cards linked public repos.
    const { link: _link, ...unlinked } = capstoneProject;
    render(<FeaturedProject project={{ ...unlinked, cta: 'Private repository' }} index={0} />);

    expect(screen.queryByRole('link', { name: /private repository/i })).toBeNull();
    expect(screen.queryByText('Private repository')).toBeNull();
  });

  it('shows the monogram, and requests no image, for a company with no logo', () => {
    render(
      <ExperienceCard
        experience={{ company: 'Sun Brewed Homestead', positions: [{ title: 'COO', period: 'Jul 2025 - Present', description: '' }] }}
        index={0}
      />
    );

    expect(screen.queryByAltText('Sun Brewed Homestead')).toBeNull();
    expect(screen.getByText('SBH')).toBeTruthy();
  });

  it('drives UI utility motion handlers', () => {
    render(
      <>
        <Magnetic><button type="button">Magnet</button></Magnetic>
        <Tilt><button type="button">Tilt Target</button></Tilt>
      </>
    );

    const magnet = screen.getByRole('button', { name: 'Magnet' });
    fireEvent.mouseMove(magnet, { clientX: 50, clientY: 50 });
    fireEvent.mouseLeave(magnet);

    const tilt = screen.getByRole('button', { name: 'Tilt Target' });
    fireEvent.mouseMove(tilt, { clientX: 90, clientY: 60 });
    fireEvent.mouseLeave(tilt);

    expect(tilt).toBeTruthy();
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

    // TypewriterEffect now renders "Done" in both sr-only and the invisible spacer span
    expect(screen.getAllByText('Done').length).toBeGreaterThan(0);
    rafSpy.mockRestore();
  });

  it('resets browser scroll restoration and snaps back on reload navigation', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const getEntriesSpy = vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { type: 'reload' } as PerformanceNavigationTiming,
    ]);
    const originalScrollRestoration = window.history.scrollRestoration;

    const smooth = render(<SmoothScroll />);

    expect(window.history.scrollRestoration).toBe('manual');

    const pageShowEvent = new Event('pageshow');
    Object.defineProperty(pageShowEvent, 'persisted', { value: false });
    window.dispatchEvent(pageShowEvent);

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0);

    smooth.unmount();

    expect(window.history.scrollRestoration).toBe(originalScrollRestoration);

    scrollToSpy.mockRestore();
    getEntriesSpy.mockRestore();
  });
});
