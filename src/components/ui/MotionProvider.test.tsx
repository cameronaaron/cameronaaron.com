import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MotionProvider, { loadMotionFeatures } from './MotionProvider';

describe('MotionProvider', () => {
  it('renders its children', () => {
    render(
      <MotionProvider>
        <div>child content</div>
      </MotionProvider>
    );

    expect(screen.getByText('child content')).toBeTruthy();
  });

  it('loadMotionFeatures resolves the DOM feature pack default export', async () => {
    const features = await loadMotionFeatures();
    expect(features).toBeTruthy();
  });
});
