import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NursingDashboard from './NursingDashboard';

describe('NursingDashboard', () => {
  it('shows an empty-state message when there are no verified programs', () => {
    render(<NursingDashboard programs={[]} transcriptCourses={[]} />);

    expect(screen.getByText('No verified programs yet.')).toBeTruthy();
  });
});
