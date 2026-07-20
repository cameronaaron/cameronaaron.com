import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FloatingBadgeIcon from '@/components/ui/floating-badge-icon';

describe('FloatingBadgeIcon', () => {
  it('renders a neuro icon variant', () => {
    const { container } = render(<FloatingBadgeIcon icon="neuro" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.className.baseVal).toContain('text-emerald-100');
  });

  it('renders a writing icon variant', () => {
    const { container } = render(<FloatingBadgeIcon icon="write" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.className.baseVal).toContain('text-cyan-100');
  });
});
