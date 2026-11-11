import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SectionReveal } from './SectionTransitions';

describe('SectionTransitions', () => {
  it('renders SectionReveal children', () => {
    render(
      <SectionReveal index={0}>
        <div>content</div>
      </SectionReveal>
    );

    expect(screen.getByText('content')).toBeTruthy();
  });
});
