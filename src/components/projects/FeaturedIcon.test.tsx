import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FeaturedIcon from '@/components/projects/FeaturedIcon';

describe('FeaturedIcon', () => {
  it('renders an accessible icon for each variant', () => {
    const { container, rerender } = render(<FeaturedIcon variant="pen" />);
    expect(container.querySelector('svg')).toBeTruthy();

    rerender(<FeaturedIcon variant="science" />);
    expect(container.querySelector('svg')).toBeTruthy();

    rerender(<FeaturedIcon variant="code" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
