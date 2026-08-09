import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ProgramCard from './ProgramCard';
import { buildProgramView } from './dashboard-logic';
import type { NursingProgram } from '@/data/nursingPrograms';

function makeProgram(overrides: Partial<NursingProgram> = {}): NursingProgram {
  return {
    id: 'test-program',
    institution: 'Test University',
    programName: 'Test BSN',
    city: 'Test City',
    degreeType: 'accelerated-bsn',
    requiresChemistry: false,
    prerequisites: [],
    applicationWindows: [],
    sourceUrls: ['https://example.edu'],
    ...overrides,
  };
}

const NOW = new Date('2027-01-01');
const EMPTY_TRANSCRIPT_INDEX = new Map();

describe('ProgramCard', () => {
  it('renders program notes when present', () => {
    const view = buildProgramView(makeProgram({ notes: 'Rolling admissions, apply early' }), EMPTY_TRANSCRIPT_INDEX, NOW);
    render(
      <ProgramCard
        view={view}
        isStarred={false}
        onToggleStar={vi.fn()}
        completedTaskIds={{}}
        onToggleTask={vi.fn()}
      />
    );

    expect(screen.getByText('Rolling admissions, apply early')).toBeTruthy();
  });

  it('renders nothing extra when the program has no notes', () => {
    const view = buildProgramView(makeProgram(), EMPTY_TRANSCRIPT_INDEX, NOW);
    render(
      <ProgramCard
        view={view}
        isStarred={false}
        onToggleStar={vi.fn()}
        completedTaskIds={{}}
        onToggleTask={vi.fn()}
      />
    );

    expect(screen.getByTestId('program-card-test-program')).toBeTruthy();
  });
});
