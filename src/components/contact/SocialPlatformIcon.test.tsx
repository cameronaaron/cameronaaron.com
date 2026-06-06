import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SocialPlatformIcon from '@/components/contact/SocialPlatformIcon';

describe('SocialPlatformIcon', () => {
  it('renders icon svg for supported platforms', () => {
    const { container, rerender } = render(<SocialPlatformIcon platformKey="github" />);
    expect(container.querySelector('svg')).toBeTruthy();

    rerender(<SocialPlatformIcon platformKey="linkedin" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
