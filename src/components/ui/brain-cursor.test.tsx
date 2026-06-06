import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BrainCursor from '@/components/ui/BrainCursor';

describe('BrainCursor', () => {
  it('renders semantic brain cursor svg', () => {
    render(<BrainCursor active={false} />);
    expect(screen.getByRole('img', { name: 'brain cursor' })).toBeTruthy();
  });
});
