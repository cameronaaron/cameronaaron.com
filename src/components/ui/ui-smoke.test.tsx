import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Button from './Button';
import SectionHeader from './SectionHeader';
import SkillBar from './SkillBar';
import SmoothScroll from './SmoothScroll';
import SpotlightCard from './SpotlightCard';

describe('ui component smoke coverage', () => {
  it('renders all UI primitives', () => {
    render(
      <>
        <Button onClick={() => undefined}>Action</Button>
        <Button href="#contact" variant="secondary">Link</Button>
        <SectionHeader title="Section" subtitle="Subtitle" />
        <SkillBar name="TypeScript" level={95} index={0} />
        <SmoothScroll />
        <SpotlightCard><div>Spot</div></SpotlightCard>
      </>
    );

    expect(screen.getByText('Action')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(screen.getByText('Subtitle')).toBeTruthy();
  });

  it('exercises pointer-driven interactions', () => {
    render(
      <>
        <Button onClick={() => undefined}>Move Me</Button>
        <SpotlightCard><button type="button">Spotlight Target</button></SpotlightCard>
      </>
    );

    const spotButton = screen.getByRole('button', { name: 'Spotlight Target' });
    fireEvent.mouseMove(spotButton, { clientX: 130, clientY: 90 });
    fireEvent.mouseEnter(spotButton);
    fireEvent.mouseLeave(spotButton);

    expect(screen.getByText('Move Me')).toBeTruthy();
  });
});
