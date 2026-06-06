import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SectionHandoff, SectionReveal } from './SectionTransitions';

describe('SectionTransitions', () => {
  it('renders SectionReveal children', () => {
    render(
      <SectionReveal index={0}>
        <div>content</div>
      </SectionReveal>
    );

    expect(screen.getByText('content')).toBeTruthy();
  });

  it('renders SectionHandoff with anchor target', () => {
    render(<SectionHandoff label="Projects" cue="transition cue" index={1} targetId="projects" />);

    const link = screen.getByRole('link', { name: /projects/i });
    expect(link.getAttribute('href')).toBe('#projects');
    expect(screen.getByText(/transition cue/i)).toBeTruthy();
  });
});
