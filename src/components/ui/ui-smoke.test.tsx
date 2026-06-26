import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AmbientBackground from './AmbientBackground';
import Button from './Button';
import Card from './Card';
import CursorTrail from './CursorTrail';
import CustomCursor from './CustomCursor';
import FadeInWhenVisible from './FadeInWhenVisible';
import FloatingBadge from './FloatingBadge';
import Magnetic from './Magnetic';
import ParallaxSection from './ParallaxSection';
import ScrollReveal from './ScrollReveal';
import SectionHeader from './SectionHeader';
import SkillBar from './SkillBar';
import SmoothScroll from './SmoothScroll';
import SpotlightCard from './SpotlightCard';
import StatCard from './StatCard';
import TextReveal from './TextReveal';
import Tilt from './Tilt';
import TypewriterEffect from './TypewriterEffect';

describe('ui component smoke coverage', () => {
  it('renders all UI primitives', () => {
    render(
      <>
        <AmbientBackground />
        <Button onClick={() => undefined}>Action</Button>
        <Button href="#contact" variant="secondary">Link</Button>
        <Card gradient>Card body</Card>
        <CursorTrail />
        <CustomCursor />
        <FadeInWhenVisible direction="left">Fade</FadeInWhenVisible>
        <FadeInWhenVisible>Default direction</FadeInWhenVisible>
        <FloatingBadge icon="innovation" position="top-right" />
        <FloatingBadge icon="neuro" position="bottom-left" delay={0.2} />
        <Magnetic><span>Magnetic</span></Magnetic>
        <ParallaxSection><div>Parallax</div></ParallaxSection>
        <ScrollReveal><div>Reveal</div></ScrollReveal>
        <SectionHeader title="Section" subtitle="Subtitle" />
        <SkillBar name="TypeScript" level={95} index={0} />
        <SmoothScroll />
        <SpotlightCard><div>Spot</div></SpotlightCard>
        <StatCard value="10+" label="Years" />
        <TextReveal text="Reveal text" />
        <Tilt><div>Tilted</div></Tilt>
        <TypewriterEffect text="Typing text" typingSpeed={1} />
      </>
    );

    expect(screen.getByText('Action')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(screen.getByText('Subtitle')).toBeTruthy();
    expect(screen.getByText('10+')).toBeTruthy();
  });

  it('exercises pointer-driven interactions', () => {
    render(
      <>
        <Button onClick={() => undefined}>Move Me</Button>
        <Magnetic><button type="button">Magnet Target</button></Magnetic>
        <Tilt><button type="button">Tilt Target</button></Tilt>
        <SpotlightCard><button type="button">Spotlight Target</button></SpotlightCard>
      </>
    );

    fireEvent.mouseMove(window, { clientX: 40, clientY: 40 });
    const magnetTarget = screen.getByRole('button', { name: 'Magnet Target' });
    fireEvent.mouseOver(magnetTarget);
    fireEvent.touchStart(magnetTarget, { touches: [{ clientX: 0, clientY: 0 }] });

    const tiltButton = screen.getByRole('button', { name: 'Tilt Target' });
    fireEvent.mouseMove(tiltButton, { clientX: 120, clientY: 80 });
    fireEvent.mouseLeave(tiltButton);

    const spotButton = screen.getByRole('button', { name: 'Spotlight Target' });
    fireEvent.mouseMove(spotButton, { clientX: 130, clientY: 90 });
    fireEvent.mouseEnter(spotButton);
    fireEvent.mouseLeave(spotButton);

    expect(screen.getByText('Move Me')).toBeTruthy();
  });
});
